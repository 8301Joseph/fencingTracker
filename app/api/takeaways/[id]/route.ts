import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

const bodySchema = z.object({
  completed: z.boolean().optional(),
  content: z.string().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createSupabaseClient();
  const { id } = await params;
  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.errors }, { status: 400 });
  }

  const updates = {} as Record<string, unknown>;
  if (parsed.data.completed !== undefined) updates.completed = parsed.data.completed;
  if (parsed.data.content !== undefined) updates.content = parsed.data.content;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const result = await supabase.from('takeaways').update(updates).eq('id', id).select().single();
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json(result.data);
}
