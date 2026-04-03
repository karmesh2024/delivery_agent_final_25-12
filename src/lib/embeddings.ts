import { embed } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "",
  baseURL: "https://generativelanguage.googleapis.com/v1", // الـ Embedding يعمل هنا بشكل مستقر
});

/**
 * تحويل النص إلى متجه عددي (Vector) باستخدام Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: text,
    }).catch(err => {
      console.warn("⚠️ Embedding API failed, returning dummy vector:", err.message);
      return { embedding: new Array(768).fill(0) }; // ناقل فارغ لضمان عدم توقف العمل
    });

    return embedding;
  } catch (error) {
    console.error("❌ Fatal Embedding Error:", error);
    return new Array(768).fill(0);
  }
}

/**
 * دالة للبحث عن التشابه المتجهي عبر Supabase
 * (يجب استخدام هذه الدالة عبر استدعاء RPC في Supabase)
 */
export const VECTOR_SEARCH_QUERY = `
  create or replace function match_search_memories (
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    p_category text
  )
  returns table (
    id uuid,
    query text,
    summary text,
    category text,
    similarity float
  )
  language plpgsql
  as $$
  begin
    return query
    select
      search_memories.id,
      search_memories.query,
      search_memories.summary,
      search_memories.category,
      1 - (search_memories.embedding <=> query_embedding) as similarity
    from search_memories
    where (1 - (search_memories.embedding <=> query_embedding) > match_threshold)
    and (search_memories.category = p_category or p_category = 'general')
    order by similarity desc
    limit match_count;
  end;
  $$;
`;
