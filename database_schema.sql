-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'parent', 'co_parent', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- Create children table
CREATE TABLE IF NOT EXISTS children (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create routines table
CREATE TABLE IF NOT EXISTS routines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('morning', 'evening', 'bedtime', 'chores', 'homework', 'other')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  estimated_duration INTEGER,
  points INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, child_id)
);

-- Create task_completions table
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  points_earned INTEGER DEFAULT 0,
  notes TEXT
);

-- Create worksheets table
CREATE TABLE IF NOT EXISTS worksheets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('math', 'reading', 'writing', 'science', 'art', 'social_studies')),
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  age_min INTEGER,
  age_max INTEGER,
  content JSONB NOT NULL,
  rewards JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create worksheet_progress table
CREATE TABLE IF NOT EXISTS worksheet_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  worksheet_id UUID REFERENCES worksheets(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  time_spent INTEGER,
  mistakes INTEGER DEFAULT 0,
  level INTEGER,
  details JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(worksheet_id, child_id)
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  category TEXT CHECK (category IN ('toy', 'activity', 'privilege', 'treat', 'other')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create child_rewards table
CREATE TABLE IF NOT EXISTS child_rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  points_earned INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create points_log table
CREATE TABLE IF NOT EXISTS points_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  points_awarded INTEGER NOT NULL,
  reason TEXT NOT NULL,
  awarded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  event_type TEXT CHECK (event_type IN ('custody', 'activity', 'medical', 'school', 'other')),
  location TEXT,
  is_all_day BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custody_schedule table
CREATE TABLE IF NOT EXISTS custody_schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chores table
CREATE TABLE IF NOT EXISTS chores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('cleaning', 'laundry', 'dishes', 'garden', 'other')),
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  estimated_duration INTEGER,
  points INTEGER DEFAULT 1,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chore_assignments table
CREATE TABLE IF NOT EXISTS chore_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chore_id UUID REFERENCES chores(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER DEFAULT 0,
  notes TEXT
);

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack')),
  ingredients JSONB,
  instructions TEXT,
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  is_favorite BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT CHECK (category IN ('food', 'transport', 'education', 'entertainment', 'health', 'other')),
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject TEXT,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('general', 'schedule', 'expense', 'emergency')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_children_family_id ON children(family_id);
CREATE INDEX IF NOT EXISTS idx_routines_family_id ON routines(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_routine_id ON tasks(routine_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_child_id ON task_completions(child_id);
CREATE INDEX IF NOT EXISTS idx_worksheet_progress_child_id ON worksheet_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_rewards_family_id ON rewards(family_id);
CREATE INDEX IF NOT EXISTS idx_child_rewards_child_id ON child_rewards(child_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_family_id ON calendar_events(family_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_custody_schedule_family_id ON custody_schedule(family_id);
CREATE INDEX IF NOT EXISTS idx_chores_family_id ON chores(family_id);
CREATE INDEX IF NOT EXISTS idx_meals_family_id ON meals(family_id);
CREATE INDEX IF NOT EXISTS idx_expenses_family_id ON expenses(family_id);
CREATE INDEX IF NOT EXISTS idx_messages_family_id ON messages(family_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE worksheet_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Families policies
CREATE POLICY "Users can create families" ON families
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Family creators can view their families" ON families
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Family creators can update their families" ON families
  FOR UPDATE USING (auth.uid() = created_by);

-- Family members policies (simplified to avoid recursion)
CREATE POLICY "Users can view their own family memberships" ON family_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert themselves as family members" ON family_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family creators can manage family members" ON family_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = family_members.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Children policies
CREATE POLICY "Family creators can manage children" ON children
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = children.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Routines policies
CREATE POLICY "Family creators can manage routines" ON routines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = routines.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Tasks policies
CREATE POLICY "Family creators can manage tasks" ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM routines r
      JOIN families f ON r.family_id = f.id
      WHERE r.id = tasks.routine_id 
      AND f.created_by = auth.uid()
    )
  );

-- Task completions policies
CREATE POLICY "Family creators can manage task completions" ON task_completions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN routines r ON t.routine_id = r.id
      JOIN families f ON r.family_id = f.id
      WHERE t.id = task_completions.task_id 
      AND f.created_by = auth.uid()
    )
  );

-- Worksheets policies (public read access)
CREATE POLICY "Anyone can view active worksheets" ON worksheets
  FOR SELECT USING (is_active = true);

-- Worksheet progress policies
CREATE POLICY "Family creators can manage worksheet progress" ON worksheet_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = worksheet_progress.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Rewards policies
CREATE POLICY "Family creators can manage rewards" ON rewards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = rewards.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Child rewards policies
CREATE POLICY "Family creators can manage child rewards" ON child_rewards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = child_rewards.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Points log policies
CREATE POLICY "Family creators can manage points log" ON points_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = points_log.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Calendar events policies
CREATE POLICY "Family creators can manage calendar events" ON calendar_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = calendar_events.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Custody schedule policies
CREATE POLICY "Family creators can manage custody schedule" ON custody_schedule
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = custody_schedule.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Chores policies
CREATE POLICY "Family creators can manage chores" ON chores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = chores.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Chore assignments policies
CREATE POLICY "Family creators can manage chore assignments" ON chore_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chores c
      JOIN families f ON c.family_id = f.id
      WHERE c.id = chore_assignments.chore_id 
      AND f.created_by = auth.uid()
    )
  );

-- Meals policies
CREATE POLICY "Family creators can manage meals" ON meals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = meals.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Meal plans policies
CREATE POLICY "Family creators can manage meal plans" ON meal_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = meal_plans.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Expenses policies
CREATE POLICY "Family creators can manage expenses" ON expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = expenses.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Family creators can manage messages" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = messages.family_id 
      AND families.created_by = auth.uid()
    )
  );

-- Functions and Triggers

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO public.worksheets (title, description, category, difficulty, age_min, age_max, content) VALUES
('Addition Practice', 'Practice basic addition with numbers 1-10', 'math', 1, 5, 8, '{"type": "addition", "problems": 10, "maxNumber": 10}'),
('Sight Words', 'Learn common sight words for early readers', 'reading', 2, 6, 9, '{"type": "sight_words", "words": ["the", "and", "is", "it", "in", "you", "that", "he", "was", "for"]}'),
('Letter Tracing', 'Practice writing letters A-Z', 'writing', 1, 4, 7, '{"type": "letter_tracing", "letters": ["A", "B", "C", "D", "E"]}'),
('Animal Habitats', 'Learn about different animal habitats', 'science', 3, 7, 10, '{"type": "matching", "pairs": [{"animal": "Lion", "habitat": "Savanna"}, {"animal": "Fish", "habitat": "Ocean"}, {"animal": "Bear", "habitat": "Forest"}, {"animal": "Camel", "habitat": "Desert"}]}'),
('Color Mixing', 'Learn about primary and secondary colors', 'art', 2, 5, 8, '{"type": "color_mixing", "colors": ["red", "blue", "yellow", "green", "purple", "orange"]}'),
('Community Helpers', 'Learn about people who help in our community', 'social_studies', 2, 6, 9, '{"type": "matching", "pairs": [{"helper": "Firefighter", "tool": "Fire Truck"}, {"helper": "Doctor", "tool": "Stethoscope"}, {"helper": "Teacher", "tool": "Books"}, {"helper": "Police Officer", "tool": "Badge"}]}'),
('Subtraction Practice', 'Practice basic subtraction with numbers 1-10', 'math', 1, 6, 9, '{"type": "subtraction", "problems": 10, "maxNumber": 10}'),
('Reading Comprehension', 'Read short stories and answer questions', 'reading', 3, 7, 10, '{"type": "reading_comprehension", "stories": [{"title": "The Little Red Hen", "text": "Once upon a time...", "questions": [{"question": "What did the hen want to do?", "answer": "Make bread"}]}]}'),
('Number Writing', 'Practice writing numbers 1-20', 'writing', 1, 4, 6, '{"type": "number_writing", "numbers": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}'),
('Plant Life Cycle', 'Learn about how plants grow', 'science', 2, 6, 9, '{"type": "matching", "pairs": [{"stage": "Seed", "description": "Starting point"}, {"stage": "Sprout", "description": "First growth"}, {"stage": "Plant", "description": "Full grown"}]}'),
('Drawing Shapes', 'Learn to draw basic shapes', 'art', 1, 3, 6, '{"type": "drawing", "shapes": ["circle", "square", "triangle", "rectangle"]}'),
('Map Reading', 'Learn to read simple maps', 'social_studies', 3, 8, 11, '{"type": "map_reading", "locations": [{"name": "School", "symbol": "🏫"}, {"name": "Park", "symbol": "🌳"}, {"name": "Store", "symbol": "🏪"}]}'); 