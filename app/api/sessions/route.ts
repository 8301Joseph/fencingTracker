import { NextResponse } from 'next/server';
import { createSupabaseClient, storageBucket } from '@/lib/supabase';
import { transcribeAudio } from '@/lib/transcribe';
import { extractTakeaways } from '@/lib/extractTakeaways';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const user = url.searchParams.get('user') as 'Joseph' | 'Sophia' | null;

    if (!user || !['Joseph', 'Sophia'].includes(user)) {
      return NextResponse.json({ error: 'Missing or invalid user' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('audio');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
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
      user_name: user,
      session_date: new Date().toISOString().slice(0, 10),
      weapon: null,
      session_type: null,
      duration_minutes: null,
      club: null,
      coach: null,
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

    console.log('📋 Session created with response:', JSON.stringify(created.data, null, 2));
    return NextResponse.json(created.data);
  } catch (error: any) {
    const errorMessage = error?.message ?? String(error) ?? 'Unexpected server error';
    console.error('POST /api/sessions error:', errorMessage, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = url.searchParams.get('user') as 'Joseph' | 'Sophia' | null;
  const weapon = url.searchParams.get('weapon');
  const sessionType = url.searchParams.get('session_type');
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');

  if (!user || !['Joseph', 'Sophia'].includes(user)) {
    return NextResponse.json({ error: 'Missing or invalid user' }, { status: 400 });
  }

  const supabase = createSupabaseClient();

  let query = supabase.from('sessions').select('*, takeaways(*)').eq('user_name', user).order('session_date', { ascending: false });

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
