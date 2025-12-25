-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    avatar_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Create user_login_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    login_time TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB DEFAULT '{}'::jsonb,
    session_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON public.user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_login_time ON public.user_login_history(login_time);

-- Add RLS policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read their own data
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
CREATE POLICY "Users can read their own data" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Policy to allow authenticated users to update their own data
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- Policy to allow admins to read all users
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users" 
ON public.users 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy to allow admins to insert users
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow admins to update users
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users" 
ON public.users 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Add RLS policies for user_login_history table
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own login history
DROP POLICY IF EXISTS "Users can read their own login history" ON public.user_login_history;
CREATE POLICY "Users can read their own login history" 
ON public.user_login_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy to allow system to insert login history
DROP POLICY IF EXISTS "System can insert login history" ON public.user_login_history;
CREATE POLICY "System can insert login history" 
ON public.user_login_history 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow admins to read all login history
DROP POLICY IF EXISTS "Admins can read all login history" ON public.user_login_history;
CREATE POLICY "Admins can read all login history" 
ON public.user_login_history 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Insert a default user if it doesn't exist
INSERT INTO public.users (name, email, role)
VALUES ('Default Admin', 'admin@example.com', 'admin')
ON CONFLICT (email) DO NOTHING; 