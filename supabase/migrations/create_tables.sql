-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    template TEXT,
    customizations JSONB,
    script TEXT,
    images TEXT[],
    voice_url TEXT,
    final_url TEXT
);

-- Add index for user_id for better performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);

-- Drop the existing table if it exists and recreate it with the correct schema
DROP TABLE IF EXISTS videos CASCADE;

-- Recreate videos table with correct schema
CREATE TABLE videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    template TEXT,
    customizations JSONB,
    script TEXT,
    images TEXT[],
    voice_url TEXT,
    final_url TEXT
);

-- Add index for user_id for better performance
CREATE INDEX idx_videos_user_id ON videos(user_id);

-- Create user profiles table for credit system
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    credits_available INTEGER DEFAULT 1,
    plan_type TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'inactive',
    paddle_subscription_id TEXT,
    monthly_credits_used INTEGER DEFAULT 0,
    monthly_reset_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW() + INTERVAL '1 month'),
    total_credits_purchased INTEGER DEFAULT 1,
    total_credits_used INTEGER DEFAULT 0
);

-- Create credit transactions table for tracking credit usage
DROP TABLE IF EXISTS credit_transactions CASCADE;

CREATE TABLE credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    transaction_type TEXT NOT NULL, -- 'credit', 'debit'
    amount INTEGER NOT NULL, -- positive for credits added, negative for credits used
    description TEXT,
    video_id UUID REFERENCES videos(id),
    paddle_transaction_id TEXT,
    balance_after INTEGER DEFAULT 0
);

-- Create RLS policies
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for videos
DROP POLICY IF EXISTS "Users can view their own videos" ON videos;
DROP POLICY IF EXISTS "Users can insert their own videos" ON videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON videos;

CREATE POLICY "Users can view their own videos" ON videos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos" ON videos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON videos
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON credit_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

-- Create function to initialize user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, credits_available, plan_type)
    VALUES (NEW.id, 1, 'free');
    
    -- Add initial credit transaction
    INSERT INTO public.credit_transactions (user_id, transaction_type, amount, description, balance_after)
    VALUES (NEW.id, 'credit', 1, 'Welcome bonus - 1 free credit', 1);
    
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE create_user_profile();

-- Function to check user credits and plan details
CREATE OR REPLACE FUNCTION check_user_credits(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    profile_data RECORD;
    result JSONB;
BEGIN
    -- Get user profile data with proper schema prefix
    SELECT * INTO profile_data
    FROM public.user_profiles
    WHERE id = p_user_id;
    
    -- If no profile exists, create one
    IF NOT FOUND THEN
        INSERT INTO public.user_profiles (id, credits_available, plan_type)
        VALUES (p_user_id, 1, 'free')
        RETURNING * INTO profile_data;
        
        -- Add initial credit transaction
        INSERT INTO public.credit_transactions (user_id, transaction_type, amount, description, balance_after)
        VALUES (p_user_id, 'credit', 1, 'Welcome bonus - 1 free credit', 1);
    END IF;
    
    -- Build result JSON
    result := jsonb_build_object(
        'credits_available', profile_data.credits_available,
        'plan_type', profile_data.plan_type,
        'subscription_status', profile_data.subscription_status,
        'monthly_limit', CASE 
            WHEN profile_data.plan_type = 'starter' THEN 15
            WHEN profile_data.plan_type = 'daily' THEN 30
            WHEN profile_data.plan_type = 'hardcore' THEN 60
            ELSE 1
        END,
        'weekly_limit', CASE 
            WHEN profile_data.plan_type = 'starter' THEN 3
            WHEN profile_data.plan_type = 'daily' THEN 7
            WHEN profile_data.plan_type = 'hardcore' THEN 15
            ELSE 1
        END,
        'is_weekly_plan', false,
        'monthly_credits_used', profile_data.monthly_credits_used,
        'total_credits_used', profile_data.total_credits_used
    );
    
    RETURN result;
END;
$$ language 'plpgsql' security definer set search_path = '';

-- Function to consume credits for video generation
CREATE OR REPLACE FUNCTION consume_credit_for_video(p_user_id UUID, p_video_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile exists and get current credits
    SELECT credits_available INTO current_credits
    FROM public.user_profiles
    WHERE id = p_user_id;
    
    -- If no profile found, return false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has credits available
    IF current_credits <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Consume one credit
    UPDATE public.user_profiles
    SET 
        credits_available = credits_available - 1,
        monthly_credits_used = monthly_credits_used + 1,
        total_credits_used = total_credits_used + 1,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = p_user_id;
    
    -- Record the transaction
    INSERT INTO public.credit_transactions (user_id, transaction_type, amount, description, video_id, balance_after)
    VALUES (p_user_id, 'debit', -1, 'Credit used for video generation', p_video_id, current_credits - 1);
    
    RETURN TRUE;
END;
$$ language 'plpgsql' security definer set search_path = '';

-- Function to add credits (for purchases/bonuses)
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_amount INTEGER, p_description TEXT, p_transaction_id TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user credits
    UPDATE public.user_profiles
    SET 
        credits_available = credits_available + p_amount,
        total_credits_purchased = total_credits_purchased + p_amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = p_user_id;
    
    -- Record the transaction
    INSERT INTO public.credit_transactions (user_id, transaction_type, amount, description, paddle_transaction_id, balance_after)
    VALUES (p_user_id, 'credit', p_amount, p_description, p_transaction_id, 
            (SELECT credits_available FROM public.user_profiles WHERE id = p_user_id));
    
    RETURN TRUE;
END;
$$ language 'plpgsql' security definer set search_path = '';

-- Function to update user plan and credits based on subscription
CREATE OR REPLACE FUNCTION update_user_subscription(
    p_user_id UUID,
    p_plan_type TEXT,
    p_subscription_status TEXT,
    p_paddle_subscription_id TEXT,
    p_credits_to_add INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user profile with new subscription details
    UPDATE public.user_profiles
    SET 
        plan_type = p_plan_type,
        subscription_status = p_subscription_status,
        paddle_subscription_id = p_paddle_subscription_id,
        credits_available = credits_available + p_credits_to_add,
        total_credits_purchased = total_credits_purchased + p_credits_to_add,
        monthly_reset_date = TIMEZONE('utc', NOW() + INTERVAL '1 month'),
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = p_user_id;
    
    -- Record the credit addition
    IF p_credits_to_add > 0 THEN
        INSERT INTO public.credit_transactions (user_id, transaction_type, amount, description, paddle_transaction_id, balance_after)
        VALUES (p_user_id, 'credit', p_credits_to_add, 
                'Credits added for ' || p_plan_type || ' plan subscription', p_paddle_subscription_id,
                (SELECT credits_available FROM public.user_profiles WHERE id = p_user_id));
    END IF;
    
    RETURN TRUE;
END;
$$ language 'plpgsql' security definer set search_path = ''; 