import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function spatialSearch(
  userId: string,
  queryVector: number[],
  wing?: string,
  room?: string
) {
  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: queryVector,
    match_threshold: 0.7,
    match_count: 5,
    p_user_id: userId,
    p_wing_id: wing || null,
    p_room_id: room || null
  });

  if (error) {
    console.error('[PalaceSearch] Error:', error);
    return [];
  }
  return data || [];
}
