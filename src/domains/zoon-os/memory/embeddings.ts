const GOOGLE_EMBEDDING_MODEL = 'gemini-embedding-001';
const OLLAMA_EMBEDDING_MODEL = 'nomic-embed-text';
const OLLAMA_URL = 'http://localhost:11434/api/embeddings';

export async function generateEmbedding(text: string): Promise<number[]> {
  // 1️⃣ المحاولة الأولى: الموديل المحلي (Ollama) لضمان السيادة والسرعة
  try {
    const localResponse = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: OLLAMA_EMBEDDING_MODEL,
        prompt: text 
      }),
      // Timeout قصير (2 ثانية) للقفز للبديل بسرعة إذا كان Ollama مغلقاً
      signal: AbortSignal.timeout(2000) 
    });

    if (localResponse.ok) {
      const localData = await localResponse.json();
      console.log(`[Embeddings] Local success using ${OLLAMA_EMBEDDING_MODEL}`);
      return localData.embedding;
    }
  } catch (e: any) {
    console.warn(`[Embeddings] Local failure (Ollama possibly down): ${e.message}`);
  }

  // 2️⃣ المحاولة الثانية: البديل السحابي (Google) في حال فشل المحلي
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content: { parts: [{ text }] },
        output_dimensionality: 768 
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cloud Embedding Generation Failed: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  console.log(`[Embeddings] Cloud fallback success using ${GOOGLE_EMBEDDING_MODEL}`);
  return data.embedding.values;
}
