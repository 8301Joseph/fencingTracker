import { Anthropic } from '@anthropic-ai/sdk';
import { ExtractedSession } from './types';
import { parseClaudeResponse } from './transcribe';

const CLAUDE_MODEL = 'claude-sonnet-4-6';

export async function extractTakeaways(transcript: string): Promise<ExtractedSession> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY');
  }

  const client = new Anthropic({ apiKey });
  const prompt = `You are a fencing coach's assistant. You receive the transcript of a voice note a fencer recorded right after a training session. The speech may be rambling, out of order, and full of filler. Your job is to turn it into a clean, structured breakdown.

Rules:
- Only use information actually present in the transcript. Never invent details, scores, or feedback that wasn't said.
- Be concise. Each takeaway is one clear, specific point, phrased so it's still useful when read months later.
- Use fencing knowledge to categorize correctly (e.g. parry-riposte, distance, tempo, blade work, point control = technique; advance/lunge/balestra/footwork = footwork; reading opponents, second-intention, timing = tactics).
- Sort each takeaway into exactly one category from the allowed list.
- Mark anything the fencer should do before/at the next session as an action item.
- Flag any mention of pain, soreness, strain, or injury under "injury".
- Do not infer weapon, session_type, or any metadata fields.

Return ONLY valid JSON matching this schema, with no markdown fences and no text before or after:

{
  "summary": string,
  "takeaways": [
    {
      "category": "technique" | "footwork" | "tactics" | "bouts" | "conditioning" | "mental" | "coach_feedback" | "action_item" | "injury",
      "content": string,
      "is_action_item": boolean
    }
  ]
}

Transcript:\n${transcript}`;

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  if (!response || !response.content || response.content.length === 0) {
    throw new Error('Claude returned an empty response');
  }

  const completedText = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = await parseClaudeResponse(completedText);

  // Always set metadata fields to null
  return {
    summary: parsed.summary,
    weapon: null,
    session_type: null,
    takeaways: parsed.takeaways
  };
}
