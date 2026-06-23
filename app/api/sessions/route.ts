import { NextResponse } from 'next/server';
import { createSupabaseClient, storageBucket } from '@/lib/supabase';
import { transcribeAudio } from '@/lib/transcribe';
import { extractTakeaways } from '@/lib/extractTakeaways';
import { z } from 'zod';

const sessionBodySchema = z.object({
  session_date: z.string().optional(),
  weapon: z.enum(['foil', 'epee', 'sabre']).nullable().optional(),
  session_type: z.enum(['lesson', 'open_fencing', 'drills', 'competition', 'conditioning', 'other']).nullable().optional(),
  duration_minutes: z.string().optional().transform((value) => {
    if (!value || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }),
  club: z.string().optional().nullable(),
  coach: z.string().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    const rawFields = Object.fromEntries(
      Array.from(formData.entries()).filter(([key]) => key !== 'audio')
    );
    const parsed = sessionBodySchema.safeParse(rawFields);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid metadata', details: parsed.error.errors }, { status: 400 });
    }

    const supabase = createSupabaseClient();
    const arrayBuffer = await file.arrayBuffer();
    const uniqueId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const fileName = `sessions/${uniqueId}-${file.name}`;
    const uploadResult = await supabase.storage.from(storageBucket).upload(fileName, arrayBuffer, {
      contentType: file.type,
      upsert: false
    });

    if (uploadResult.error) {
      return NextResponse.json({ error: uploadResult.error.message }, { status: 500 });
    }

    const audioUrlResult = supabase.storage.from(storageBucket).getPublicUrl(fileName);
    const audioUrl = audioUrlResult.data.publicUrl;

    const transcript = await transcribeAudio(arrayBuffer, file.name);
    const extracted = await extractTakeaways(transcript);

    const insertSession = await supabase.from('sessions').insert({
      session_date: parsed.data.session_date ?? new Date().toISOString().slice(0, 10),
      weapon: parsed.data.weapon ?? extracted.weapon,
      session_type: parsed.data.session_type ?? extracted.session_type,
      duration_minutes: parsed.data.duration_minutes ?? null,
      club: parsed.data.club ?? null,
      coach: parsed.data.coach ?? null,
      audio_url: audioUrl,
      transcript,
      summary: extracted.summary
    }).select('id').single();

    if (insertSession.error || !insertSession.data) {
      return NextResponse.json({ error: insertSession.error?.message ?? 'Failed to create session' }, { status: 500 });
    }

    const sessionId = insertSession.data.id;
    const takeawayRows = extracted.takeaways.map((takeaway) => ({
      session_id: sessionId,
      category: takeaway.category,
      content: takeaway.content,
      is_action_item: takeaway.is_action_item
    }));

    const insertTakeaways = await supabase.from('takeaways').insert(takeawayRows);
    if (insertTakeaways.error) {
      return NextResponse.json({ error: insertTakeaways.error.message }, { status: 500 });
    }

    const created = await supabase.from('sessions').select('*, takeaways(*)').eq('id', sessionId).single();
    if (created.error || !created.data) {
      return NextResponse.json({ error: created.error?.message ?? 'Failed to fetch session' }, { status: 500 });
    }

    return NextResponse.json(created.data);
  } catch (error: any) {
    console.error('POST /api/sessions error', error);
    return NextResponse.json({ error: error?.message ?? 'Unexpected server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const weapon = url.searchParams.get('weapon');
  const sessionType = url.searchParams.get('session_type');
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');
  const supabase = createSupabaseClient();

  let query = supabase.from('sessions').select('*, takeaways(*)').order('session_date', { ascending: false });

  if (weapon) {
    query = query.eq('weapon', weapon);
  }
  if (sessionType) {
    query = query.eq('session_type', sessionType);
  }
  if (startDate) {
    query = query.gte('session_date', startDate);
  }
  if (endDate) {
    query = query.lte('session_date', endDate);
  }

  const response = await query;
  if (response.error) {
    return NextResponse.json({ error: response.error.message }, { status: 500 });
  }

  return NextResponse.json(response.data);
}
