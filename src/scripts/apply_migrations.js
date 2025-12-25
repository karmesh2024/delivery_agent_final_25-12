// Script for applying database migrations to Supabase
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

// Initialize environment variables
dotenv.config();

// Handle __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationsDir = path.join(__dirname, '..', 'migrations');

async function applyMigrations() {
  console.log('🚀 Starting database migrations...');
  
  // Read all SQL files in the migrations directory
  let files;
  try {
    files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure consistent ordering
      
    console.log(`📂 Found ${files.length} migration files: ${files.join(', ')}`);
  } catch (error) {
    console.error('❌ Error reading migrations directory:', error);
    process.exit(1);
  }
  
  // Process each file
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`\n📄 Processing ${file}...`);
    
    try {
      // Read SQL content
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Apply migration to database
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error(`❌ Migration failed for ${file}:`, error);
        console.error('Error details:', error.message);
        
        // Ask whether to continue with other migrations
        const readline = createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const response = await new Promise(resolve => {
          readline.question('Continue with remaining migrations? (y/n): ', answer => {
            readline.close();
            resolve(answer.toLowerCase());
          });
        });
        
        if (response !== 'y') {
          console.log('🛑 Migration process stopped');
          process.exit(1);
        }
      } else {
        console.log(`✅ Successfully applied ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
      process.exit(1);
    }
  }
  
  console.log('\n✨ All migrations completed successfully!');
}

// Execute the migrations
applyMigrations().catch(error => {
  console.error('❌ Unhandled error during migrations:', error);
  process.exit(1);
}); 