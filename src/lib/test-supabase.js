import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nxdaklwjvpqwzzaevkpp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54ZGFrbHdqdnB3cXp6YWV2a3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MTY5MzUsImV4cCI6MjA5MzE5MjkzNX0.CWi5Bfaz713dltMQt_S0lEFAs3EUNDv-DFtViX5emJw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  const { data, error } = await supabase.from('items').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Success! Items table exists. Data:", data);
  }
}

checkTables();
