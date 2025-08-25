# Supabase Setup Guide for MotusTots

This guide will help you set up Supabase authentication for the MotusTots app.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `motustots` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose closest to your users
5. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

## Step 3: Set Up Environment Variables

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add your Supabase credentials:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://gqopilelgxqnqnvshzpr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxb3BpbGVsZ3hxbnFudnNoenByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODYzNjAsImV4cCI6MjA2NjQ2MjM2MH0.4HIgzZTYIlncPRyei8j6SoTGCWDLoHEkDpAiKcq-a20

# App Configuration
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_APP_VERSION=1.0.0
```

**Replace the values with your actual Supabase project URL and anon key.**

## Step 4: Set Up Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'parent' CHECK (role IN ('parent', 'co_parent', 'admin')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create families table
CREATE TABLE public.families (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family_members table for linking users to families
CREATE TABLE public.family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'parent', 'co_parent', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(family_id, user_id)
);

-- Create children table
CREATE TABLE public.children (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create routines table
CREATE TABLE public.routines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    schedule_type TEXT DEFAULT 'daily' CHECK (schedule_type IN ('daily', 'weekly', 'custom')),
    schedule_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create routine_tasks table
CREATE TABLE public.routine_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    estimated_duration INTEGER DEFAULT 5, -- in minutes
    points_reward INTEGER DEFAULT 1,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_completions table
CREATE TABLE public.task_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.routine_tasks(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    points_earned INTEGER DEFAULT 0,
    notes TEXT
);

-- Create worksheets table
CREATE TABLE public.worksheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('math', 'reading', 'writing', 'science', 'art', 'social_studies')),
    difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    age_min INTEGER DEFAULT 3,
    age_max INTEGER DEFAULT 12,
    content JSONB NOT NULL,
    rewards JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create progress table for worksheet completion
CREATE TABLE public.progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worksheet_id UUID REFERENCES public.worksheets(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- in seconds
    mistakes INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    details JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(worksheet_id, child_id)
);

-- Create rewards table
CREATE TABLE public.rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🎁',
    points_required INTEGER DEFAULT 10,
    category TEXT DEFAULT 'toy' CHECK (category IN ('toy', 'activity', 'privilege', 'special')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reward_unlocks table
CREATE TABLE public.reward_unlocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reward_id, child_id)
);

-- Create reward_redemptions table
CREATE TABLE public.reward_redemptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🏆',
    category TEXT DEFAULT 'general' CHECK (category IN ('routine', 'chores', 'education', 'special', 'general')),
    criteria JSONB NOT NULL,
    points_reward INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievement_earnings table
CREATE TABLE public.achievement_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(achievement_id, child_id)
);

-- Create chores table
CREATE TABLE public.chores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    points_reward INTEGER DEFAULT 1,
    frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
    assigned_to UUID REFERENCES public.children(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chore_completions table
CREATE TABLE public.chore_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chore_id UUID REFERENCES public.chores(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    points_earned INTEGER DEFAULT 0,
    notes TEXT
);

-- Create meals table
CREATE TABLE public.meals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    meal_type TEXT DEFAULT 'dinner' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    planned_date DATE NOT NULL,
    ingredients JSONB DEFAULT '[]',
    instructions TEXT,
    prep_time INTEGER DEFAULT 30, -- in minutes
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN ('food', 'clothing', 'education', 'entertainment', 'health', 'transport', 'general')),
    date DATE NOT NULL,
    paid_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'percentage', 'fixed')),
    split_data JSONB DEFAULT '{}',
    is_approved BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message_reads table
CREATE TABLE public.message_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chore_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for families table
CREATE POLICY "Users can view own families" ON public.families
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = families.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own families" ON public.families
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own families" ON public.families
    FOR UPDATE USING (auth.uid() = created_by);

-- Create policies for family_members table
CREATE POLICY "Users can view family members" ON public.family_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.family_members fm2
            WHERE fm2.family_id = family_members.family_id AND fm2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage family members" ON public.family_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.families f
            WHERE f.id = family_members.family_id AND f.created_by = auth.uid()
        )
    );

-- Create policies for children table
CREATE POLICY "Users can view family children" ON public.children
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = children.family_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage family children" ON public.children
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = children.family_id AND user_id = auth.uid()
        )
    );

-- Create policies for routines table
CREATE POLICY "Users can view family routines" ON public.routines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = routines.family_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage family routines" ON public.routines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = routines.family_id AND user_id = auth.uid()
        )
    );

-- Create policies for routine_tasks table
CREATE POLICY "Users can view routine tasks" ON public.routine_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.routines r
            JOIN public.family_members fm ON r.family_id = fm.family_id
            WHERE r.id = routine_tasks.routine_id AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage routine tasks" ON public.routine_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.routines r
            JOIN public.family_members fm ON r.family_id = fm.family_id
            WHERE r.id = routine_tasks.routine_id AND fm.user_id = auth.uid()
        )
    );

-- Create policies for task_completions table
CREATE POLICY "Users can view task completions" ON public.task_completions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.routine_tasks rt
            JOIN public.routines r ON rt.routine_id = r.id
            JOIN public.family_members fm ON r.family_id = fm.family_id
            WHERE rt.id = task_completions.task_id AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage task completions" ON public.task_completions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.routine_tasks rt
            JOIN public.routines r ON rt.routine_id = r.id
            JOIN public.family_members fm ON r.family_id = fm.family_id
            WHERE rt.id = task_completions.task_id AND fm.user_id = auth.uid()
        )
    );

-- Create policies for worksheets table (public read access)
CREATE POLICY "Anyone can view active worksheets" ON public.worksheets
    FOR SELECT USING (is_active = true);

-- Create policies for progress table
CREATE POLICY "Users can view child progress" ON public.progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.children c
            JOIN public.family_members fm ON c.family_id = fm.family_id
            WHERE c.id = progress.child_id AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage child progress" ON public.progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.children c
            JOIN public.family_members fm ON c.family_id = fm.family_id
            WHERE c.id = progress.child_id AND fm.user_id = auth.uid()
        )
    );

-- Create policies for rewards table
CREATE POLICY "Users can view family rewards" ON public.rewards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = rewards.family_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage family rewards" ON public.rewards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = rewards.family_id AND user_id = auth.uid()
        )
    );

-- Create policies for reward_unlocks table
CREATE POLICY "Users can view reward unlocks" ON public.reward_unlocks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.children c
            JOIN public.family_members fm ON c.family_id = fm.family_id
            WHERE c.id = reward_unlocks.child_id AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage reward unlocks" ON public.reward_unlocks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.children c
            JOIN public.family_members fm ON c.family_id = fm.family_id
            WHERE c.id = reward_unlocks.child_id AND fm.user_id = auth.uid()
        )
    );

-- Create policies for reward_redemptions table
CREATE POLICY "Users can view reward redemptions" ON public.reward_redemptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.children c
            JOIN public.family_members fm ON c.family_id = fm.family_id
            WHERE c.id = reward_redemptions.child_id AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage reward redemptions" ON public.reward_redemptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.children c
            JOIN public.family_members fm ON c.family_id = fm.family_id
            WHERE c.id = reward_redemptions.child_id AND fm.user_id = auth.uid()
        )
    );

-- Create policies for achievements table (public read access)
CREATE POLICY "Anyone can view active achievements" ON public.achievements
    FOR SELECT USING (is_active = true);

-- Create policies for achievement_earnings table
CREATE POLICY "Users can view achievement earnings" ON public.achievement_earnings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.children c
            JOIN public.family_members fm ON c.family_id = fm.family_id
            WHERE c.id = achievement_earnings.child_id AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage achievement earnings" ON public.achievement_earnings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.children c
            JOIN public.family_members fm ON c.family_id = fm.family_id
            WHERE c.id = achievement_earnings.child_id AND fm.user_id = auth.uid()
        )
    );

-- Create policies for chores table
CREATE POLICY "Users can view family chores" ON public.chores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = chores.family_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage family chores" ON public.chores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = chores.family_id AND user_id = auth.uid()
        )
    );

-- Create policies for chore_completions table
CREATE POLICY "Users can view chore completions" ON public.chore_completions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chores c
            JOIN public.family_members fm ON c.family_id = fm.family_id
            WHERE c.id = chore_completions.chore_id AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage chore completions" ON public.chore_completions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.chores c
            JOIN public.family_members fm ON c.family_id = fm.family_id
            WHERE c.id = chore_completions.chore_id AND fm.user_id = auth.uid()
        )
    );

-- Create policies for meals table
CREATE POLICY "Users can view family meals" ON public.meals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = meals.family_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage family meals" ON public.meals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = meals.family_id AND user_id = auth.uid()
        )
    );

-- Create policies for expenses table
CREATE POLICY "Users can view family expenses" ON public.expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = expenses.family_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage family expenses" ON public.expenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = expenses.family_id AND user_id = auth.uid()
        )
    );

-- Create policies for messages table
CREATE POLICY "Users can view family messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = messages.family_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send family messages" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members 
            WHERE family_id = messages.family_id AND user_id = auth.uid()
        )
    );

-- Create policies for message_reads table
CREATE POLICY "Users can view message reads" ON public.message_reads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            JOIN public.family_members fm ON m.family_id = fm.family_id
            WHERE m.id = message_reads.message_id AND fm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage message reads" ON public.message_reads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            JOIN public.family_members fm ON m.family_id = fm.family_id
            WHERE m.id = message_reads.message_id AND fm.user_id = auth.uid()
        )
    );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample worksheets
INSERT INTO public.worksheets (title, description, category, difficulty, age_min, age_max, content) VALUES
('Addition Practice', 'Practice basic addition with numbers 1-10', 'math', 1, 5, 8, '{"type": "addition", "problems": 10, "maxNumber": 10}'),
('Sight Words', 'Learn common sight words for early readers', 'reading', 2, 6, 9, '{"type": "sight_words", "words": ["the", "and", "is", "it", "in", "you", "that", "he", "was", "for"]}'),
('Letter Tracing', 'Practice writing letters A-Z', 'writing', 1, 4, 7, '{"type": "letter_tracing", "letters": ["A", "B", "C", "D", "E"]}'),
('Animal Habitats', 'Learn about different animal habitats', 'science', 3, 7, 10, '{"type": "matching", "pairs": [{"animal": "Lion", "habitat": "Savanna"}, {"animal": "Fish", "habitat": "Ocean"}]}'),
('Color Mixing', 'Learn about primary and secondary colors', 'art', 2, 5, 8, '{"type": "color_mixing", "colors": ["red", "blue", "yellow", "green", "purple", "orange"]}'),
('Community Helpers', 'Learn about people who help in our community', 'social_studies', 2, 6, 9, '{"type": "matching", "pairs": [{"helper": "Doctor", "tool": "Stethoscope"}, {"helper": "Firefighter", "tool": "Fire Truck"}]}');

-- Insert some sample achievements
INSERT INTO public.achievements (name, description, icon, category, criteria, points_reward) VALUES
('Routine Master', 'Complete 7 routines in a row', '⭐', 'routine', '{"type": "streak", "count": 7, "activity": "routine"}', 50),
('Chore Champion', 'Complete 20 chores', '🏆', 'chores', '{"type": "total", "count": 20, "activity": "chores"}', 100),
('Learning Explorer', 'Complete 10 educational worksheets', '📚', 'education', '{"type": "total", "count": 10, "activity": "worksheets"}', 75),
('Early Bird', 'Complete morning routine 5 days in a row', '🌅', 'routine', '{"type": "streak", "count": 5, "activity": "morning_routine"}', 30),
('Helping Hand', 'Help with 5 family activities', '🤝', 'special', '{"type": "total", "count": 5, "activity": "family_activities"}', 25);
```

## Step 5: Configure Authentication Settings

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Configure the following:
   - **Site URL**: `exp://192.168.1.59:8081` (for development)
   - **Redirect URLs**: Add your app's redirect URLs
   - **Email Templates**: Customize if needed

## Step 6: Test the Setup

1. Start your Expo development server:
   ```bash
   npx expo start
   ```

2. Scan the QR code with Expo Go
3. Try to register a new account
4. Try to sign in with the created account

## Troubleshooting

### Common Issues:

1. **"Invalid API key" error**: Check that your anon key is correct
2. **"Project not found" error**: Verify your project URL
3. **Database connection errors**: Ensure your database is active in Supabase dashboard

### Environment Variables Not Loading:

1. Make sure your `.env` file is in the project root
2. Restart your Expo development server after adding environment variables
3. Check that variable names start with `EXPO_PUBLIC_`

### Authentication Issues:

1. Check Supabase logs in the dashboard
2. Verify email templates are configured
3. Check that redirect URLs are set correctly

## Next Steps

Once authentication is working:

1. Test user registration and login
2. Verify user profiles are created in the database
3. Test password reset functionality
4. Implement additional features like email verification

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive data
- Regularly rotate your API keys
- Monitor your Supabase usage and logs

## Troubleshooting Onboarding Errors

### Common Onboarding Errors

1. **"Onboarding error: {}"**
   - **Cause**: Usually indicates a database connection or permission issue
   - **Solution**: 
     - Check your Supabase URL and anon key in `.env`
     - Ensure all database tables are created
     - Verify Row Level Security policies are in place

2. **"Permission denied"**
   - **Cause**: RLS policies blocking access
   - **Solution**: Run the complete SQL schema above

3. **"relation does not exist"**
   - **Cause**: Database tables not created
   - **Solution**: Run the SQL schema in your Supabase SQL editor

4. **"Network error"**
   - **Cause**: Connection issues
   - **Solution**: Check internet connection and Supabase project status

### Debug Steps

1. **Check Environment Variables**
   ```bash
   # In your app, check the console logs for:
   console.log('ENV configuration:', {
     SUPABASE_URL: ENV.SUPABASE_URL,
     SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY ? 'Present' : 'Missing',
   });
   ```

2. **Test Database Connection**
   - The app now includes connection testing
   - Check console logs for connection test results

3. **Verify Database Setup**
   - Go to your Supabase dashboard
   - Check the "Table Editor" to ensure all tables exist
   - Check the "Authentication" > "Policies" to ensure RLS is enabled

4. **Check User Authentication**
   - Ensure the user is properly authenticated
   - Check if the user profile was created in the `users` table

### Mock Mode

If you're testing without a database:
- The app will automatically detect mock mode
- Use any email/password combination to sign in
- Onboarding will skip database operations

### Getting Help

If you're still experiencing issues:
1. Check the console logs for detailed error messages
2. Verify your Supabase project is active
3. Ensure you have the latest version of the app
4. Check the Supabase documentation for any service updates 