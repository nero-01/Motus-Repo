import { supabase } from './client';
import { getCurrentFamily, getFamilyChildren } from './family';

export interface DashboardStats {
  routinesCompleted: number;
  routinesRemaining: number;
  mealsPlanned: number;
  worksheetsAvailable: number;
  newMessages: number;
  expensesToReview: number;
  weeklyProgress: number;
  streakDays: number;
  activeRoutines: number;
  childrenCount: number;
}

export type RecentActivityType = 'routine' | 'meal' | 'education' | 'message';

export interface RecentActivity {
  id: string;
  type: RecentActivityType;
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
  /** ISO timestamp for merging/sorting feeds */
  occurredAt: string;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Monday-start week in local timezone */
function startOfLocalWeekMonday(d: Date): Date {
  const x = startOfLocalDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  if (sec < 172800) return 'Yesterday';
  return `${Math.floor(sec / 86400)} days ago`;
}

async function computeStreakDays(childIds: string[]): Promise<number> {
  if (childIds.length === 0) return 0;
  const since = new Date();
  since.setDate(since.getDate() - 120);
  const { data, error } = await supabase
    .from('task_completions')
    .select('completed_at')
    .in('child_id', childIds)
    .gte('completed_at', since.toISOString());
  if (error || !data?.length) return 0;
  const days = new Set(
    data.map((r) => localDayKey(new Date(r.completed_at)))
  );
  let streak = 0;
  const cur = startOfLocalDay(new Date());
  for (let i = 0; i < 365; i++) {
    const key = localDayKey(cur);
    if (days.has(key)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

const emptyStats = (): DashboardStats => ({
  routinesCompleted: 0,
  routinesRemaining: 0,
  mealsPlanned: 0,
  worksheetsAvailable: 0,
  newMessages: 0,
  expensesToReview: 0,
  weeklyProgress: 0,
  streakDays: 0,
  activeRoutines: 0,
  childrenCount: 0,
});

export const dashboardService = {
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const family = await getCurrentFamily();
    if (!family) return emptyStats();

    const children = await getFamilyChildren(family.id);
    const childIds = children.map((c) => c.id);

    const weekStart = startOfLocalWeekMonday(new Date());
    const dayStart = startOfLocalDay(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const { data: familyRoutineRows } = await supabase
      .from('routines')
      .select('id')
      .eq('family_id', family.id)
      .eq('is_active', true);

    const routineIds = familyRoutineRows?.map((r) => r.id) ?? [];

    const routineTasksCountPromise =
      routineIds.length > 0
        ? supabase
            .from('routine_tasks')
            .select('id', { count: 'exact', head: true })
            .in('routine_id', routineIds)
        : Promise.resolve({ count: 0, error: null });

    const [
      routineTasksRes,
      weekCompletionsRes,
      todayCompletionsRes,
      worksheetsCountRes,
      mealPlansRes,
      messagesRes,
      expensesRes,
    ] = await Promise.all([
      routineTasksCountPromise,
      childIds.length
        ? supabase
            .from('task_completions')
            .select('id', { count: 'exact', head: true })
            .in('child_id', childIds)
            .gte('completed_at', weekStart.toISOString())
            .lt('completed_at', weekEnd.toISOString())
        : Promise.resolve({ count: 0, error: null }),
      childIds.length
        ? supabase
            .from('task_completions')
            .select('id', { count: 'exact', head: true })
            .in('child_id', childIds)
            .gte('completed_at', dayStart.toISOString())
        : Promise.resolve({ count: 0, error: null }),
      supabase
        .from('worksheets')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('meal_plans')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', family.id)
        .gte('planned_date', localDayKey(weekStart))
        .lt('planned_date', localDayKey(weekEnd)),
      supabase
        .from('coparenting_messages')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', family.id)
        .eq('is_read', false)
        .neq('sender_id', userId),
      supabase
        .from('shared_expenses')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', family.id)
        .eq('is_paid', false),
    ]);

    const activeRoutines = routineIds.length;
    const totalRoutineTasks = routineTasksRes.count ?? 0;
    const childCount = Math.max(1, childIds.length);

    const weekCompletions = weekCompletionsRes.count ?? 0;
    const todayCompletions = todayCompletionsRes.count ?? 0;

    const weeklyGoal = Math.max(1, totalRoutineTasks * childCount);
    const weeklyProgress = Math.min(100, Math.round((weekCompletions / weeklyGoal) * 100));

    const dailyTarget = Math.max(1, totalRoutineTasks * childCount);
    const routinesRemaining = Math.max(0, dailyTarget - todayCompletions);

    const streakDays = await computeStreakDays(childIds);

    return {
      routinesCompleted: todayCompletions,
      routinesRemaining,
      mealsPlanned: mealPlansRes.count ?? 0,
      worksheetsAvailable: worksheetsCountRes.count ?? 0,
      newMessages: messagesRes.count ?? 0,
      expensesToReview: expensesRes.count ?? 0,
      weeklyProgress,
      streakDays,
      activeRoutines,
      childrenCount: children.length,
    };
  },

  async getRecentActivities(userId: string, limit: number = 10): Promise<RecentActivity[]> {
    const family = await getCurrentFamily();
    if (!family) return [];

    const children = await getFamilyChildren(family.id);
    const childIds = children.map((c) => c.id);
    const childNameById = Object.fromEntries(children.map((c) => [c.id, c.name]));

    const items: RecentActivity[] = [];

    if (childIds.length) {
      const { data: completions } = await supabase
        .from('task_completions')
        .select(`
          id,
          completed_at,
          child_id,
          routine_tasks ( name )
        `)
        .in('child_id', childIds)
        .order('completed_at', { ascending: false })
        .limit(8);

      completions?.forEach((row: any) => {
        const taskName = row.routine_tasks?.name || 'Routine task';
        const childName = childNameById[row.child_id] || 'Child';
        items.push({
          id: `tc-${row.id}`,
          type: 'routine',
          title: taskName,
          description: `${childName} completed a routine step`,
          time: formatRelativeTime(row.completed_at),
          icon: '☀️',
          color: '#4CAF50',
          occurredAt: row.completed_at,
        });
      });
    }

    const { data: progress } = await supabase
      .from('worksheet_progress')
      .select(`
        id,
        completed_at,
        child_id,
        worksheets ( title )
      `)
      .eq('family_id', family.id)
      .order('completed_at', { ascending: false })
      .limit(8);

    progress?.forEach((row: any) => {
      const title = row.worksheets?.title || 'Worksheet';
      const childName = childNameById[row.child_id] || 'Child';
      items.push({
        id: `wp-${row.id}`,
        type: 'education',
        title,
        description: `${childName} finished a learning activity`,
        time: formatRelativeTime(row.completed_at),
        icon: '📚',
        color: '#2196F3',
        occurredAt: row.completed_at,
      });
    });

    const { data: messages } = await supabase
      .from('coparenting_messages')
      .select('id, created_at, subject, content, sender_id')
      .eq('family_id', family.id)
      .order('created_at', { ascending: false })
      .limit(6);

    messages?.forEach((row: any) => {
      const preview = (row.content || '').slice(0, 80);
      items.push({
        id: `msg-${row.id}`,
        type: 'message',
        title: row.subject || 'Co-parent message',
        description: preview || 'New message',
        time: formatRelativeTime(row.created_at),
        icon: '💬',
        color: '#9C27B0',
        occurredAt: row.created_at,
      });
    });

    items.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );

    return items.slice(0, limit);
  },

  async getUpcomingTasks(_userId: string) {
    try {
      return [];
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
      throw new Error('Failed to load upcoming tasks');
    }
  },
};
