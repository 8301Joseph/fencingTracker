import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const url = new URL(request.url);
  const user = url.searchParams.get('user') as 'Joseph' | 'Sophia' | null;

  if (!user || !['Joseph', 'Sophia'].includes(user)) {
    return NextResponse.json({ error: 'Missing or invalid user' }, { status: 400 });
  }

  const supabase = createSupabaseClient();
  const { id } = await params;
  const result = await supabase.from('sessions').select('*, takeaways(*)').eq('id', id).eq('user_name', user).single();
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  if (!result.data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  return NextResponse.json(result.data);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const url = new URL(request.url);
  const user = url.searchParams.get('user') as 'Joseph' | 'Sophia' | null;

  if (!user || !['Joseph', 'Sophia'].includes(user)) {
    return NextResponse.json({ error: 'Missing or invalid user' }, { status: 400 });
  }

  const supabase = createSupabaseClient();
  const { id } = await params;

  // Verify the session belongs to this user
  const checkResult = await supabase.from('sessions').select('id').eq('id', id).eq('user_name', user).single();
  if (checkResult.error || !checkResult.data) {
    return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
  }

  const result = await supabase.from('sessions').delete().eq('id', id);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
