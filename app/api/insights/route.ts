import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createSupabaseClient();
  const categoryCountsQuery = (supabase.from('takeaways').select('category, count:id', { count: 'exact' }) as any).group('category');
  const [openActionItems, categoryCounts, recentInjuries] = await Promise.all([
    supabase.from('takeaways').select('id, content, session_id').eq('category', 'action_item').eq('completed', false).order('created_at', { ascending: false }),
    categoryCountsQuery,
    supabase.from('takeaways').select('id, content, session_id, created_at').eq('category', 'injury').order('created_at', { ascending: false }).limit(10)
  ]);

  if (openActionItems.error || categoryCounts.error || recentInjuries.error) {
    const error = openActionItems.error?.message || categoryCounts.error?.message || recentInjuries.error?.message;
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({
    openActionItems: openActionItems.data,
    categoryCounts: categoryCounts.data,
    recentInjuries: recentInjuries.data
  });
}
