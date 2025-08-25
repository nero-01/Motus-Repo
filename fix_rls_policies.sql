-- Fix RLS Policies - Drop problematic policies first
-- Run this in your Supabase SQL editor

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Family members can view their families" ON families;
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Family owners can update their families" ON families;
DROP POLICY IF EXISTS "Family members can view family members" ON family_members;
DROP POLICY IF EXISTS "Family owners can manage family members" ON family_members;
DROP POLICY IF EXISTS "Family members can view children" ON children;
DROP POLICY IF EXISTS "Family members can manage children" ON children;
DROP POLICY IF EXISTS "Family members can view routines" ON routines;
DROP POLICY IF EXISTS "Family members can manage routines" ON routines;
DROP POLICY IF EXISTS "Users can view routine tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage routine tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view task completions" ON task_completions;
DROP POLICY IF EXISTS "Users can manage task completions" ON task_completions;
DROP POLICY IF EXISTS "Anyone can view active worksheets" ON worksheets;
DROP POLICY IF EXISTS "Users can view child progress" ON worksheet_progress;
DROP POLICY IF EXISTS "Users can manage child progress" ON worksheet_progress;
DROP POLICY IF EXISTS "Users can view family rewards" ON rewards;
DROP POLICY IF EXISTS "Users can manage family rewards" ON rewards;
DROP POLICY IF EXISTS "Users can view reward unlocks" ON child_rewards;
DROP POLICY IF EXISTS "Users can manage reward unlocks" ON child_rewards;
DROP POLICY IF EXISTS "Users can view family chores" ON chores;
DROP POLICY IF EXISTS "Users can manage family chores" ON chores;
DROP POLICY IF EXISTS "Users can view chore completions" ON chore_assignments;
DROP POLICY IF EXISTS "Users can manage chore completions" ON chore_assignments;
DROP POLICY IF EXISTS "Users can view family meals" ON meals;
DROP POLICY IF EXISTS "Users can manage family meals" ON meals;
DROP POLICY IF EXISTS "Users can view family expenses" ON expenses;
DROP POLICY IF EXISTS "Users can manage family expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view family messages" ON messages;
DROP POLICY IF EXISTS "Users can send family messages" ON messages;

-- Now create the corrected policies
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

-- Tasks policies (corrected table name)
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