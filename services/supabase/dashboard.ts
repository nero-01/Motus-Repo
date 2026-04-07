import {
  endOfWeek,
  format,
  formatDistanceToNow,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { supabase } from './client';

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

export type DashboardActivityType = 'routine' | 'meal' | 'education' | 'message' | 'chore';

export interface DashboardActivity {
  id: string;
  type: DashboardActivityType;
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
}

export type DashboardUpcomingKind = 'calendar' | 'meal' | 'chore';

export interface DashboardUpcomingTask {
  id: string;
  kind: DashboardUpcomingKind;
  title: string;
  subtitle: string;
  dueAt: string;
  icon: string;
  color: string;
}

const ACTIVITY_STYLE: Record<
  DashboardActivityType,
  { icon: string; color: string }
> = {
  routine: { icon: '🔄', color: '#4CAF50' },
  meal: { icon: '🍽️', color: '#FF9800' },
  education: { icon: '📚', color: '#2196F3' },
  message: { icon: '💬', color: '#9C27B0' },
  chore: { icon: '🧹', color: '#795548' },
};

const UPCOMING_STYLE: Record<DashboardUpcomingKind, { icon: string; color: string }> = {
  calendar: { icon: '📅', color: '#006A60' },
  meal: { icon: '🍽️', color: '#FF9800' },
  chore: { icon: '✅', color: '#795548' },
};

function relativeTimeLabel(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

function truncate(text: string, max: number): string {
  const t = text?.trim() || '';
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatMealDue(plannedDate: string, mealType: string | null): string {
  try {
    const d = parseISO(`${plannedDate}T12:00:00`);
    const type = mealType ? `${mealType.charAt(0).toUpperCase()}${mealType.slice(1)}` : 'Meal';
    const today = startOfDay(new Date());
    const dayStart = startOfDay(d);
    const diff = Math.round((dayStart.getTime() - today.getTime()) / (86400 * 1000));
    if (diff === 0) return `${type} · today`;
    if (diff === 1) return `${type} · tomorrow`;
    return `${type} · ${format(d, 'MMM d')}`;
  } catch {
    return plannedDate;
  }
}

function streakDaysFromTimestamps(timestamps: string[]): number {
  const days = new Set<string>();
  for (const ts of timestamps) {
    try {
      days.add(format(startOfDay(parseISO(ts)), 'yyyy-MM-dd'));
    } catch {
      /* skip */
    }
  }
  let streak = 0;
  let d = startOfDay(new Date());
  const key = () => format(d, 'yyyy-MM-dd');
  while (days.has(key())) {
    streak++;
    d = new Date(d);
    d.setDate(d.getDate() - 1);
    d = startOfDay(d);
  }
  return streak;
}

async function getFamilyIdsForUser(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId);

  if (error) {
    console.warn('dashboard: family_members', error.message);
    return [];
  }
  const ids = (data || []).map((r) => r.family_id).filter(Boolean);
  return [...new Set(ids)];
}

async function getChildIdsForFamilies(familyIds: string[]): Promise<string[]> {
  if (!familyIds.length) return [];
  const { data, error } = await supabase
    .from('children')
    .select('id')
    .in('family_id', familyIds);

  if (error) {
    console.warn('dashboard: children', error.message);
    return [];
  }
  return (data || []).map((c) => c.id).filter(Boolean);
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
    try {
      const familyIds = await getFamilyIdsForUser(userId);
      if (!familyIds.length) return emptyStats();

      const childIds = await getChildIdsForFamilies(familyIds);
      const now = new Date();
      const dayStart = startOfDay(now);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
      const dayStartIso = dayStart.toISOString();
      const weekStartIso = weekStart.toISOString();
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const sevenDaysAgoIso = new Date(now.getTime() - 7 * 86400000).toISOString();

      const results = await Promise.allSettled([
        supabase
          .from('routines')
          .select('id', { count: 'exact', head: true })
          .in('family_id', familyIds)
          .eq('is_active', true),

        childIds.length
          ? supabase
              .from('task_completions')
              .select('task_id, child_id, completed_at')
              .in('child_id', childIds)
              .gte('completed_at', dayStartIso)
          : Promise.resolve({ data: [] as { task_id: string; child_id: string; completed_at: string }[], error: null }),

        childIds.length
          ? supabase
              .from('task_assignments')
              .select('task_id, child_id')
              .in('child_id', childIds)
          : Promise.resolve({ data: [] as { task_id: string; child_id: string }[], error: null }),

        childIds.length
          ? supabase
              .from('task_completions')
              .select('task_id, child_id')
              .in('child_id', childIds)
              .gte('completed_at', weekStartIso)
          : Promise.resolve({ data: [] as { task_id: string; child_id: string }[], error: null }),

        childIds.length
          ? supabase
              .from('task_completions')
              .select('completed_at')
              .in('child_id', childIds)
              .gte('completed_at', ninetyDaysAgo.toISOString())
          : Promise.resolve({ data: [] as { completed_at: string }[], error: null }),

        supabase
          .from('meal_plans')
          .select('id', { count: 'exact', head: true })
          .in('family_id', familyIds)
          .gte('planned_date', weekStartStr)
          .lte('planned_date', weekEndStr),

        supabase.from('worksheets').select('id', { count: 'exact', head: true }).eq('is_active', true),

        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('family_id', familyIds)
          .eq('is_read', false)
          .neq('sender_id', userId),

        supabase
          .from('expenses')
          .select('id', { count: 'exact', head: true })
          .in('family_id', familyIds)
          .gte('created_at', sevenDaysAgoIso),
      ]);

      const activeRoutines =
        results[0].status === 'fulfilled' && !results[0].value.error
          ? results[0].value.count ?? 0
          : 0;

      const completionsToday =
        results[1].status === 'fulfilled' && !results[1].value.error && results[1].value.data
          ? results[1].value.data
          : [];

      const assignments =
        results[2].status === 'fulfilled' && !results[2].value.error && results[2].value.data
          ? results[2].value.data
          : [];

      const completionsWeek =
        results[3].status === 'fulfilled' && !results[3].value.error && results[3].value.data
          ? results[3].value.data
          : [];

      const completionsForStreak =
        results[4].status === 'fulfilled' && !results[4].value.error && results[4].value.data
          ? results[4].value.data
          : [];

      const mealsPlanned =
        results[5].status === 'fulfilled' && !results[5].value.error
          ? results[5].value.count ?? 0
          : 0;

      const worksheetsAvailable =
        results[6].status === 'fulfilled' && !results[6].value.error
          ? results[6].value.count ?? 0
          : 0;

      const newMessages =
        results[7].status === 'fulfilled' && !results[7].value.error
          ? results[7].value.count ?? 0
          : 0;

      const expensesToReview =
        results[8].status === 'fulfilled' && !results[8].value.error
          ? results[8].value.count ?? 0
          : 0;

      const routinesCompleted = completionsToday.length;

      const doneTodayKeys = new Set(
        completionsToday.map((r) => `${r.task_id}:${r.child_id}`)
      );
      let routinesRemaining = 0;
      for (const a of assignments) {
        if (!doneTodayKeys.has(`${a.task_id}:${a.child_id}`)) routinesRemaining++;
      }

      const assignmentCount = assignments.length;
      const weekKeys = new Set(
        completionsWeek.map((r) => `${r.task_id}:${r.child_id}`)
      );
      const weeklyProgress =
        assignmentCount > 0
          ? Math.min(100, Math.round((weekKeys.size / assignmentCount) * 100))
          : completionsWeek.length > 0
            ? Math.min(100, completionsWeek.length * 10)
            : 0;

      const streakDays = streakDaysFromTimestamps(
        completionsForStreak.map((r) => r.completed_at)
      );

      return {
        routinesCompleted,
        routinesRemaining,
        mealsPlanned,
        worksheetsAvailable,
        newMessages,
        expensesToReview,
        weeklyProgress,
        streakDays,
        activeRoutines,
        childrenCount: childIds.length,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to load dashboard data');
    }
  },

  async getRecentActivities(userId: string, limit: number = 10): Promise<DashboardActivity[]> {
    try {
      const familyIds = await getFamilyIdsForUser(userId);
      if (!familyIds.length) return [];

      const childIds = await getChildIdsForFamilies(familyIds);
      const nowIso = new Date().toISOString();
      const perSource = Math.max(limit, 5);

      const results = await Promise.allSettled([
        childIds.length
          ? supabase
              .from('task_completions')
              .select(
                `
              id,
              completed_at,
              tasks ( title, routines ( name ) ),
              children ( name )
            `
              )
              .in('child_id', childIds)
              .order('completed_at', { ascending: false })
              .limit(perSource)
          : Promise.resolve({ data: null, error: null }),

        childIds.length
          ? supabase
              .from('worksheet_progress')
              .select(
                `
              id,
              completed_at,
              score,
              worksheets ( title ),
              children ( name )
            `
              )
              .in('child_id', childIds)
              .order('completed_at', { ascending: false })
              .limit(perSource)
          : Promise.resolve({ data: null, error: null }),

        supabase
          .from('messages')
          .select('id, created_at, subject, content, message_type')
          .in('family_id', familyIds)
          .order('created_at', { ascending: false })
          .limit(perSource),

        supabase
          .from('meal_plans')
          .select(
            `
            id,
            created_at,
            planned_date,
            meal_type,
            meals ( name )
          `
          )
          .in('family_id', familyIds)
          .order('created_at', { ascending: false })
          .limit(perSource),

        childIds.length
          ? supabase
              .from('chore_assignments')
              .select(
                `
              id,
              completed_at,
              chores ( title ),
              children ( name )
            `
              )
              .in('child_id', childIds)
              .not('completed_at', 'is', null)
              .order('completed_at', { ascending: false })
              .limit(perSource)
          : Promise.resolve({ data: null, error: null }),
      ]);

      const merged: { at: string; activity: DashboardActivity }[] = [];

      const r0 = results[0];
      if (r0.status === 'fulfilled' && !r0.value.error && r0.value.data) {
        for (const row of r0.value.data as TaskCompletionRow[]) {
          const at = row.completed_at;
          if (!at) continue;
          const taskTitle = row.tasks?.title || 'Task';
          const routineName = row.tasks?.routines?.name;
          const childName = row.children?.name || 'Child';
          const style = ACTIVITY_STYLE.routine;
          merged.push({
            at,
            activity: {
              id: `routine-${row.id}`,
              type: 'routine',
              title: routineName ? `${routineName}` : 'Routine step',
              description: `${childName} completed “${taskTitle}”`,
              time: relativeTimeLabel(at),
              icon: style.icon,
              color: style.color,
            },
          });
        }
      } else if (r0.status === 'fulfilled' && r0.value.error) {
        console.warn('dashboard: task_completions', r0.value.error.message);
      }

      const r1 = results[1];
      if (r1.status === 'fulfilled' && !r1.value.error && r1.value.data) {
        for (const row of r1.value.data as WorksheetProgressRow[]) {
          const at = row.completed_at;
          if (!at) continue;
          const wsTitle = row.worksheets?.title || 'Worksheet';
          const childName = row.children?.name || 'Child';
          const score = row.score != null ? ` · ${row.score}%` : '';
          const style = ACTIVITY_STYLE.education;
          merged.push({
            at,
            activity: {
              id: `education-${row.id}`,
              type: 'education',
              title: 'Worksheet completed',
              description: `${childName} finished “${wsTitle}”${score}`,
              time: relativeTimeLabel(at),
              icon: style.icon,
              color: style.color,
            },
          });
        }
      } else if (r1.status === 'fulfilled' && r1.value.error) {
        console.warn('dashboard: worksheet_progress', r1.value.error.message);
      }

      const r2 = results[2];
      if (r2.status === 'fulfilled' && !r2.value.error && r2.value.data) {
        for (const row of r2.value.data as MessageRow[]) {
          const at = row.created_at;
          if (!at) continue;
          const style = ACTIVITY_STYLE.message;
          const title =
            row.subject?.trim() ||
            (row.message_type === 'emergency' ? 'Emergency message' : 'Family message');
          merged.push({
            at,
            activity: {
              id: `message-${row.id}`,
              type: 'message',
              title,
              description: truncate(row.content || '', 100),
              time: relativeTimeLabel(at),
              icon: style.icon,
              color: style.color,
            },
          });
        }
      } else if (r2.status === 'fulfilled' && r2.value.error) {
        console.warn('dashboard: messages', r2.value.error.message);
      }

      const r3 = results[3];
      if (r3.status === 'fulfilled' && !r3.value.error && r3.value.data) {
        for (const row of r3.value.data as MealPlanRow[]) {
          const at = row.created_at || `${row.planned_date}T12:00:00`;
          const mealName = row.meals?.name || 'Meal';
          const style = ACTIVITY_STYLE.meal;
          merged.push({
            at,
            activity: {
              id: `meal-${row.id}`,
              type: 'meal',
              title: 'Meal planned',
              description: `${mealName} · ${row.meal_type || 'meal'} on ${row.planned_date}`,
              time: relativeTimeLabel(row.created_at || nowIso),
              icon: style.icon,
              color: style.color,
            },
          });
        }
      } else if (r3.status === 'fulfilled' && r3.value.error) {
        console.warn('dashboard: meal_plans', r3.value.error.message);
      }

      const r4 = results[4];
      if (r4.status === 'fulfilled' && !r4.value.error && r4.value.data) {
        for (const row of r4.value.data as ChoreDoneRow[]) {
          const at = row.completed_at;
          if (!at) continue;
          const choreTitle = row.chores?.title || 'Chore';
          const childName = row.children?.name || 'Child';
          const style = ACTIVITY_STYLE.chore;
          merged.push({
            at,
            activity: {
              id: `chore-${row.id}`,
              type: 'chore',
              title: 'Chore completed',
              description: `${childName} finished “${choreTitle}”`,
              time: relativeTimeLabel(at),
              icon: style.icon,
              color: style.color,
            },
          });
        }
      } else if (r4.status === 'fulfilled' && r4.value.error) {
        console.warn('dashboard: chore_assignments', r4.value.error.message);
      }

      merged.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      return merged.slice(0, limit).map((m) => m.activity);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw new Error('Failed to load recent activities');
    }
  },

  async getUpcomingTasks(userId: string, limit: number = 15): Promise<DashboardUpcomingTask[]> {
    try {
      const familyIds = await getFamilyIdsForUser(userId);
      if (!familyIds.length) return [];

      const childIds = await getChildIdsForFamilies(familyIds);
      const today = new Date().toISOString().split('T')[0];
      const nowIso = new Date().toISOString();
      const perSource = Math.max(limit, 5);

      const results = await Promise.allSettled([
        supabase
          .from('calendar_events')
          .select('id, title, description, start_date, event_type, location')
          .in('family_id', familyIds)
          .gte('start_date', nowIso)
          .order('start_date', { ascending: true })
          .limit(perSource),

        supabase
          .from('meal_plans')
          .select(
            `
            id,
            planned_date,
            meal_type,
            meals ( name )
          `
          )
          .in('family_id', familyIds)
          .gte('planned_date', today)
          .order('planned_date', { ascending: true })
          .limit(perSource),

        childIds.length
          ? supabase
              .from('chore_assignments')
              .select(
                `
              id,
              due_date,
              chores ( title ),
              children ( name )
            `
              )
              .in('child_id', childIds)
              .is('completed_at', null)
              .not('due_date', 'is', null)
              .gte('due_date', today)
              .order('due_date', { ascending: true })
              .limit(perSource)
          : Promise.resolve({ data: null, error: null }),
      ]);

      const merged: { due: string; task: DashboardUpcomingTask }[] = [];

      const c0 = results[0];
      if (c0.status === 'fulfilled' && !c0.value.error && c0.value.data) {
        for (const row of c0.value.data as CalendarRow[]) {
          const due = row.start_date;
          if (!due) continue;
          const style = UPCOMING_STYLE.calendar;
          const sub = [row.event_type, row.location].filter(Boolean).join(' · ');
          merged.push({
            due,
            task: {
              id: `cal-${row.id}`,
              kind: 'calendar',
              title: row.title,
              subtitle: sub || 'Calendar event',
              dueAt: due,
              icon: style.icon,
              color: style.color,
            },
          });
        }
      } else if (c0.status === 'fulfilled' && c0.value.error) {
        console.warn('dashboard: calendar_events', c0.value.error.message);
      }

      const c1 = results[1];
      if (c1.status === 'fulfilled' && !c1.value.error && c1.value.data) {
        for (const row of c1.value.data as MealPlanUpcomingRow[]) {
          const due = `${row.planned_date}T12:00:00`;
          const mealName = row.meals?.name || 'Meal';
          const style = UPCOMING_STYLE.meal;
          merged.push({
            due,
            task: {
              id: `meal-up-${row.id}`,
              kind: 'meal',
              title: mealName,
              subtitle: formatMealDue(row.planned_date, row.meal_type ?? null),
              dueAt: due,
              icon: style.icon,
              color: style.color,
            },
          });
        }
      } else if (c1.status === 'fulfilled' && c1.value.error) {
        console.warn('dashboard: meal_plans upcoming', c1.value.error.message);
      }

      const c2 = results[2];
      if (c2.status === 'fulfilled' && !c2.value.error && c2.value.data) {
        for (const row of c2.value.data as ChoreDueRow[]) {
          if (!row.due_date) continue;
          const due = `${row.due_date}T23:59:59`;
          const choreTitle = row.chores?.title || 'Chore';
          const childName = row.children?.name || 'Child';
          const style = UPCOMING_STYLE.chore;
          merged.push({
            due,
            task: {
              id: `chore-due-${row.id}`,
              kind: 'chore',
              title: choreTitle,
              subtitle: `${childName} · due ${row.due_date}`,
              dueAt: due,
              icon: style.icon,
              color: style.color,
            },
          });
        }
      } else if (c2.status === 'fulfilled' && c2.value.error) {
        console.warn('dashboard: chore_assignments upcoming', c2.value.error.message);
      }

      merged.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
      return merged.slice(0, limit).map((m) => m.task);
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
      throw new Error('Failed to load upcoming tasks');
    }
  },
};

interface TaskCompletionRow {
  id: string;
  completed_at: string | null;
  tasks?: { title?: string | null; routines?: { name?: string | null } | null } | null;
  children?: { name?: string | null } | null;
}

interface WorksheetProgressRow {
  id: string;
  completed_at: string | null;
  score?: number | null;
  worksheets?: { title?: string | null } | null;
  children?: { name?: string | null } | null;
}

interface MessageRow {
  id: string;
  created_at: string | null;
  subject?: string | null;
  content?: string | null;
  message_type?: string | null;
}

interface MealPlanRow {
  id: string;
  created_at: string | null;
  planned_date: string;
  meal_type?: string | null;
  meals?: { name?: string | null } | null;
}

interface ChoreDoneRow {
  id: string;
  completed_at: string | null;
  chores?: { title?: string | null } | null;
  children?: { name?: string | null } | null;
}

interface CalendarRow {
  id: string;
  title: string;
  description?: string | null;
  start_date: string;
  event_type?: string | null;
  location?: string | null;
}

interface MealPlanUpcomingRow {
  id: string;
  planned_date: string;
  meal_type?: string | null;
  meals?: { name?: string | null } | null;
}

interface ChoreDueRow {
  id: string;
  due_date: string | null;
  chores?: { title?: string | null } | null;
  children?: { name?: string | null } | null;
}
