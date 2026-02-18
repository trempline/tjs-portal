-- SQL Schema for tjs_messages table
-- Run this in your Supabase SQL Editor if the table doesn't exist yet

CREATE TABLE IF NOT EXISTS public.tjs_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tjs_messages ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anonymous inserts (for the contact form)
CREATE POLICY "Allow anonymous inserts" ON public.tjs_messages
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create a policy to allow authenticated users to view all messages
CREATE POLICY "Allow authenticated users to view" ON public.tjs_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Optional: Create an index on email for faster queries
CREATE INDEX IF NOT EXISTS idx_tjs_messages_email ON public.tjs_messages(email);

-- Optional: Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_tjs_messages_created_at ON public.tjs_messages(created_at DESC);

