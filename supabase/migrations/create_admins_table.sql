-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

-- Enable Row Level Security (RLS)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage admins
CREATE POLICY "Service role can manage admins" ON admins
  FOR ALL
  USING (auth.role() = 'service_role');

-- Insert initial admin user
-- Note: In production, you should hash passwords using bcrypt or similar
-- This is a plain text password for development only
INSERT INTO admins (username, password) 
VALUES ('rahul', 'rahul')
ON CONFLICT (username) DO NOTHING;
