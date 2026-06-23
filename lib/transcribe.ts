import { ExtractedSession } from './types';

const OPENAI_TRANSCRIPTION_URL = 'https://api.openai.com/v1/audio/transcriptions';

export async function transcribeAudio(fileBytes: ArrayBuffer, fileName: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const formData = new FormData();
  const blob = new Blob([fileBytes]);
  formData.append('file', blob, fileName);
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  const response = await fetch(OPENAI_TRANSCRIPTION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Transcription failed: ${response.status} ${body}`);
  }

  const payload = await response.json();
  return payload.text?.trim() ?? '';
}

export function sanitizeClaudeJson(text: string): string {
  const stripped = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1');
  return stripped.trim();
}

export async function parseClaudeResponse(raw: string): Promise<ExtractedSession> {
  const cleaned = sanitizeClaudeJson(raw);

  try {
    return JSON.parse(cleaned) as ExtractedSession;
  } catch (error) {
    throw new Error(`Failed to parse Claude JSON response: ${String(error)}\nResponse was:\n${cleaned}`);
  }
}
