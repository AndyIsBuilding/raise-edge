import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate URL format
const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Check if the environment variables are valid
const isValidConfig = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  isValidUrl(supabaseUrl)
);

console.log('Environment variables:', {
  supabaseUrl: supabaseUrl ? 'present' : 'missing',
  supabaseAnonKey: supabaseAnonKey ? 'present' : 'missing',
  isValidUrl: supabaseUrl ? isValidUrl(supabaseUrl) : false,
  urlValue: supabaseUrl ? supabaseUrl : 'missing'
});

if (!isValidConfig) {
  console.warn('Invalid Supabase configuration. Running in local-only mode.');
}

// Create a mock Supabase client if configuration is invalid
let supabaseClient: SupabaseClient;

try {
  if (isValidConfig) {
    console.log('Creating real Supabase client...');
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
    console.log('Real Supabase client created successfully');
  } else {
    console.log('Creating mock Supabase client...');
    supabaseClient = createClient('http://localhost:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMmYTn_I0', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    console.log('Mock Supabase client created successfully');
  }
} catch (error) {
  console.error('Error creating Supabase client:', error);
  throw error;
}

console.log('Supabase client initialized:', {
  isConfigured: isValidConfig,
  clientType: isValidConfig ? 'real' : 'mock'
});

export const supabase = supabaseClient;