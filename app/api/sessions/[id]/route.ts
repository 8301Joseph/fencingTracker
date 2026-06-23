import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createSupabaseClient();
  const { id } = await params;
  const result = await supabase.from('sessions').select('*, takeaways(*)').eq('id', id).single();
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  if (!result.data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  return NextResponse.json(result.data);
}
