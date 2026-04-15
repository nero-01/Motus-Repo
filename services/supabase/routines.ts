import { supabase } from './client';

export interface Routine {
  id: string;
  name: string;
  description?: string;
  family_id: string;
  created_by: string;
  is_active: boolean;
  schedule_type: 'daily' | 'weekly' | 'custom';
  schedule_data?: any;
  created_at: string;
  updated_at: string;
}

export interface RoutineTask {
  id: string;
  routine_id: string;
  name: string;
  description?: string;
  order_index: number;
  estimated_duration: number; // in minutes
  points_reward: number;
  is_required: boolean;
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  child_id: string;
  completed_at: string;
  points_earned: number;
  notes?: string;
}

// Fetch all routines for a family
export async function getRoutinesByFamily(familyId: string): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Create a new routine
export async function createRoutine(routine: Omit<Routine, 'id' | 'created_at' | 'updated_at'>): Promise<Routine> {
  const { data, error } = await supabase
    .from('routines')
    .insert(routine)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Update a routine
export async function updateRoutine(id: string, updates: Partial<Routine>): Promise<Routine> {
  const { data, error } = await supabase
    .from('routines')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Delete a routine (soft delete)
export async function deleteRoutine(id: string): Promise<void> {
  const { error } = await supabase
    .from('routines')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}

// Fetch all tasks for a routine
export async function getRoutineTasks(routineId: string): Promise<RoutineTask[]> {
  const { data, error } = await supabase
    .from('routine_tasks')
    .select('*')
    .eq('routine_id', routineId)
    .order('order_index', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

// Create a new routine task
export async function createRoutineTask(task: Omit<RoutineTask, 'id' | 'created_at'>): Promise<RoutineTask> {
  const { data, error } = await supabase
    .from('routine_tasks')
    .insert(task)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Update a routine task
export async function updateRoutineTask(id: string, updates: Partial<RoutineTask>): Promise<RoutineTask> {
  const { data, error } = await supabase
    .from('routine_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Delete a routine task
export async function deleteRoutineTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('routine_tasks')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Reorder routine tasks
export async function reorderRoutineTasks(tasks: { id: string; order_index: number }[]): Promise<void> {
  const { error } = await supabase
    .from('routine_tasks')
    .upsert(tasks, { onConflict: 'id' });
  
  if (error) throw error;
}

function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Which tasks in this routine are "done" for the current local calendar day (by completed_at). */
export async function getRoutineTasksCompletionToday(
  routineId: string,
  childId: string
): Promise<Record<string, boolean>> {
  const tasks = await getRoutineTasks(routineId);
  if (tasks.length === 0) return {};
  const taskIds = tasks.map((t) => t.id);
  const { data, error } = await supabase
    .from('task_completions')
    .select('task_id, completed_at')
    .eq('child_id', childId)
    .in('task_id', taskIds);

  if (error) throw error;

  const out: Record<string, boolean> = {};
  for (const t of tasks) out[t.id] = false;
  const now = new Date();
  for (const row of data || []) {
    const d = new Date(row.completed_at);
    if (isSameLocalCalendarDay(d, now)) {
      out[row.task_id] = true;
    }
  }
  return out;
}

/** Remove completion rows for all tasks in this routine for this child (e.g. end-of-day reset). */
export async function deleteRoutineTaskCompletionsForChild(
  routineId: string,
  childId: string
): Promise<void> {
  const tasks = await getRoutineTasks(routineId);
  if (tasks.length === 0) return;
  const taskIds = tasks.map((t) => t.id);
  const { error } = await supabase
    .from('task_completions')
    .delete()
    .eq('child_id', childId)
    .in('task_id', taskIds);

  if (error) throw error;
}

// Mark a routine task as complete for a child
export async function completeRoutineTask({ taskId, childId, notes }: { taskId: string; childId: string; notes?: string }): Promise<TaskCompletion> {
  // First get the task to know the points reward
  const { data: task, error: taskError } = await supabase
    .from('routine_tasks')
    .select('points_reward')
    .eq('id', taskId)
    .single();
  
  if (taskError) throw taskError;

  const { data, error } = await supabase
    .from('task_completions')
    .upsert({
      task_id: taskId,
      child_id: childId,
      completed_at: new Date().toISOString(),
      points_earned: task.points_reward,
      notes
    }, { onConflict: 'task_id,child_id' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Get task completions for a child
export async function getTaskCompletions(childId: string, date?: string): Promise<TaskCompletion[]> {
  let query = supabase
    .from('task_completions')
    .select(`
      *,
      routine_tasks (
        name,
        routine_id
      ),
      routines (
        name
      )
    `)
    .eq('child_id', childId);
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    query = query
      .gte('completed_at', startOfDay.toISOString())
      .lte('completed_at', endOfDay.toISOString());
  }
  
  const { data, error } = await query.order('completed_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Get routine completion statistics
export async function getRoutineStats(familyId: string, days: number = 7): Promise<any> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('task_completions')
    .select(`
      *,
      routine_tasks (
        routine_id
      ),
      routines (
        name
      )
    `)
    .gte('completed_at', startDate.toISOString())
    .order('completed_at', { ascending: false });
  
  if (error) throw error;
  
  // Process the data to get statistics
  const stats = {
    totalCompletions: data?.length || 0,
    totalPoints: data?.reduce((sum, completion) => sum + completion.points_earned, 0) || 0,
    completionsByDay: {} as Record<string, number>,
    topRoutines: {} as Record<string, number>
  };
  
  data?.forEach(completion => {
    const date = completion.completed_at.split('T')[0];
    stats.completionsByDay[date] = (stats.completionsByDay[date] || 0) + 1;
    
    const routineName = completion.routines?.name || 'Unknown';
    stats.topRoutines[routineName] = (stats.topRoutines[routineName] || 0) + 1;
  });
  
  return stats;
} 