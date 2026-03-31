import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vvhtrgfhfnmznsbdsdkn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2aHRyZ2ZoZm5tem5zYmRzZGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjc5MjUsImV4cCI6MjA4OTk0MzkyNX0.CrFR2f8ogmA6O0hEKmKS0IY1q5BhCaDWahUqFe6AOJw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
