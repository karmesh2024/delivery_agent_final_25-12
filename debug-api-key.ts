import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  console.log(`Checking key: ${key?.substring(0, 5)}...`);
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.error) {
    console.error('❌ API Error:', JSON.stringify(data.error, null, 2));
  } else {
    console.log('✅ Available Models:');
    data.models?.forEach((m: any) => console.log(`- ${m.name}`));
  }
}

listModels();
