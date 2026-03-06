import { supabase } from './client';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  event_type: 'custody' | 'activity' | 'medical' | 'school' | 'other';
  location?: string;
  created_by: string;
  family_id: string;
  is_all_day: boolean;
  created_at: string;
}

export interface CustodySchedule {
  id: string;
  child_id: string;
  parent_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string;
  end_time: string;
  is_primary: boolean;
  family_id: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  event_type: 'custody' | 'activity' | 'medical' | 'school' | 'other';
  location?: string;
  family_id: string;
  created_by: string;
  is_all_day: boolean;
}

// Get all calendar events for the current family
export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get family ID from user's family_members table
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .single();

    if (!familyMember) throw new Error('User not part of a family');

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('family_id', familyMember.family_id)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    if (__DEV__) console.error('Error fetching calendar events:', error);
    throw error;
  }
};

// Create a new calendar event
export const createEvent = async (eventData: CreateEventData): Promise<CalendarEvent> => {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert([eventData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    if (__DEV__) console.error('Error creating calendar event:', error);
    throw error;
  }
};

// Update a calendar event
export const updateEvent = async (id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> => {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    if (__DEV__) console.error('Error updating calendar event:', error);
    throw error;
  }
};

// Delete a calendar event
export const deleteEvent = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    if (__DEV__) console.error('Error deleting calendar event:', error);
    throw error;
  }
};

// Get custody schedule for the current family
export const getCustodySchedule = async (): Promise<CustodySchedule[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get family ID from user's family_members table
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .single();

    if (!familyMember) throw new Error('User not part of a family');

    const { data, error } = await supabase
      .from('custody_schedule')
      .select('*')
      .eq('family_id', familyMember.family_id)
      .order('day_of_week', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    if (__DEV__) console.error('Error fetching custody schedule:', error);
    throw error;
  }
};

// Create a new custody schedule entry
export const createCustodySchedule = async (scheduleData: Omit<CustodySchedule, 'id'>): Promise<CustodySchedule> => {
  try {
    const { data, error } = await supabase
      .from('custody_schedule')
      .insert([scheduleData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    if (__DEV__) console.error('Error creating custody schedule:', error);
    throw error;
  }
};

// Update a custody schedule entry
export const updateCustodySchedule = async (id: string, updates: Partial<CustodySchedule>): Promise<CustodySchedule> => {
  try {
    const { data, error } = await supabase
      .from('custody_schedule')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    if (__DEV__) console.error('Error updating custody schedule:', error);
    throw error;
  }
};

// Delete a custody schedule entry
export const deleteCustodySchedule = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('custody_schedule')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    if (__DEV__) console.error('Error deleting custody schedule:', error);
    throw error;
  }
};

// Get events for a specific date range
export const getEventsByDateRange = async (startDate: string, endDate: string): Promise<CalendarEvent[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get family ID from user's family_members table
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .single();

    if (!familyMember) throw new Error('User not part of a family');

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('family_id', familyMember.family_id)
      .gte('start_date', startDate)
      .lte('start_date', endDate)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    if (__DEV__) console.error('Error fetching events by date range:', error);
    throw error;
  }
};

// Get events for a specific child
export const getEventsByChild = async (childId: string): Promise<CalendarEvent[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get family ID from user's family_members table
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .single();

    if (!familyMember) throw new Error('User not part of a family');

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('family_id', familyMember.family_id)
      .eq('child_id', childId)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    if (__DEV__) console.error('Error fetching events by child:', error);
    throw error;
  }
};

// Get custody schedule for a specific child
export const getCustodyScheduleByChild = async (childId: string): Promise<CustodySchedule[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get family ID from user's family_members table
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .single();

    if (!familyMember) throw new Error('User not part of a family');

    const { data, error } = await supabase
      .from('custody_schedule')
      .select('*')
      .eq('family_id', familyMember.family_id)
      .eq('child_id', childId)
      .order('day_of_week', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    if (__DEV__) console.error('Error fetching custody schedule by child:', error);
    throw error;
  }
};

// Check for schedule conflicts
export const checkScheduleConflicts = async (startDate: string, endDate: string, childId?: string): Promise<CalendarEvent[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get family ID from user's family_members table
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .single();

    if (!familyMember) throw new Error('User not part of a family');

    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('family_id', familyMember.family_id)
      .or(`start_date.overlaps.tstzrange('${startDate}', '${endDate}'),end_date.overlaps.tstzrange('${startDate}', '${endDate}')`);

    if (childId) {
      query = query.eq('child_id', childId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    if (__DEV__) console.error('Error checking schedule conflicts:', error);
    throw error;
  }
}; 