// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://jabhyeqgqifyzunwdcvi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphYmh5ZXFncWlmeXp1bndkY3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1Mjc3NDAsImV4cCI6MjA2NjEwMzc0MH0.7WHwWGcvGdFgIXEmnQo5BOhuI2MvM-Ax7r0JyHcT_2Q";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);