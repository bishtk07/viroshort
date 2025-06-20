-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    template TEXT,
    customizations JSONB,
    script TEXT,
    images TEXT[],
    voice_url TEXT,
    final_url TEXT
);

-- Create RLS policies
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at(); 