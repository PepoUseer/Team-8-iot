import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServerKey = process.env.SUPABASE_SECRET_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseServerKey
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServerKey)
  : null;