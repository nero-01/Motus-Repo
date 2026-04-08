import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Chip, 
  Surface, 
  FAB, 
  Dialog, 
  Portal, 
  TextInput, 
  SegmentedButtons, 
  ActivityIndicator, 
  IconButton,
  Avatar,
  ProgressBar,
  Switch,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useFamilyStore } from '../../../../stores/familyStore';
import { useAuthStore } from '../../../../stores/authStore';
import { 
  getCalendarEventsByFamily,
  getCustodyScheduleByFamily,
  getUpcomingEvents,
  getUnreadMessageCount,
  getPendingExpenses,
  createCalendarEvent,
  deleteCalendarEvent,
  CalendarEvent,
  CustodySchedule,
} from '../../../../services/supabase/coparenting';

const CALENDAR_EVENT_TYPES = ['activity', 'custody', 'medical', 'school', 'other'] as const;

function toEventStartIso(input: string, allDay: boolean): string {
  const t = input.trim();
  if (!t) throw new Error('Invalid start date');
  if (t.includes('T')) {
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) throw new Error('Invalid start date');
    return d.toISOString();
  }
  const d = new Date(`${t}T${allDay ? '00:00:00' : '09:00:00'}`);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid start date');
  return d.toISOString();
}

function toEventEndIso(
  startIso: string,
  endInput: string | undefined,
  allDay: boolean
): string {
  const t = (endInput || '').trim();
  if (t) {
    if (t.includes('T')) {
      const d = new Date(t);
      if (Number.isNaN(d.getTime())) throw new Error('Invalid end date');
      return d.toISOString();
    }
    const d = new Date(`${t}T${allDay ? '23:59:59' : '17:00:00'}`);
    if (Number.isNaN(d.getTime())) throw new Error('Invalid end date');
    return d.toISOString();
  }
  const start = new Date(startIso);
  const addMs = allDay ? 24 * 60 * 60 * 1000 - 1 : 60 * 60 * 1000;
  return new Date(start.getTime() + addMs).toISOString();
}

export default function CoParentingCalendarScreen() {
  const { user } = useAuthStore();
  const { children, currentFamily, familyMembers } = useFamilyStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [custodySchedule, setCustodySchedule] = useState<CustodySchedule[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingExpenses, setPendingExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCustodyDialog, setShowCustodyDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'schedule' | 'communication' | 'expenses'>('calendar');
  const [newEvent, setNewEvent] = useState<{
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    event_type: (typeof CALENDAR_EVENT_TYPES)[number];
    location: string;
    is_all_day: boolean;
  }>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    event_type: 'activity',
    location: '',
    is_all_day: false,
  });

  const views = [
    { value: 'calendar', label: 'Calendar' },
    { value: 'schedule', label: 'Custody' },
    { value: 'communication', label: 'Messages' },
    { value: 'expenses', label: 'Expenses' },
  ];

  useEffect(() => {
    loadCalendarData();
  }, [currentFamily]);

  const loadCalendarData = async () => {
    if (!currentFamily) return;

    try {
      setIsLoading(true);
      setRefreshing(true);

      const [
        eventsData, 
        custodyData, 
        upcomingData, 
        unreadCount, 
        pendingCount
      ] = await Promise.all([
        getCalendarEventsByFamily(currentFamily.id),
        getCustodyScheduleByFamily(currentFamily.id),
        getUpcomingEvents(currentFamily.id, 7),
        getUnreadMessageCount(currentFamily.id, user?.id || ''),
        getPendingExpenses(currentFamily.id).then(expenses => expenses.length),
      ]);

      setEvents(eventsData);
      setCustodySchedule(custodyData);
      setUpcomingEvents(upcomingData);
      setUnreadMessages(unreadCount);
      setPendingExpenses(pendingCount);

    } catch (error) {
      console.error('Error loading calendar data:', error);
      Alert.alert('Error', 'Failed to load calendar data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadCalendarData();
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.start_date) {
      Alert.alert('Error', 'Please enter a title and start date');
      return;
    }

    if (!currentFamily || !user?.id) {
      Alert.alert('Error', 'Family or user not found');
      return;
    }

    try {
      const startIso = toEventStartIso(newEvent.start_date, newEvent.is_all_day);
      const endIso = toEventEndIso(startIso, newEvent.end_date, newEvent.is_all_day);

      await createCalendarEvent({
        family_id: currentFamily.id,
        title: newEvent.title.trim(),
        description: newEvent.description.trim() || undefined,
        start_date: startIso,
        end_date: endIso,
        event_type: newEvent.event_type,
        location: newEvent.location.trim() || undefined,
        created_by: user.id,
        is_all_day: newEvent.is_all_day,
      });

      Alert.alert('Success', 'Event created successfully!');

      setNewEvent({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        event_type: 'activity',
        location: '',
        is_all_day: false,
      });
      setShowAddDialog(false);
      loadCalendarData();
    } catch (error) {
      console.error('Error creating event:', error);
      const message =
        error instanceof Error && error.message.startsWith('Invalid')
          ? error.message
          : 'Failed to create event. Use YYYY-MM-DD or a full ISO date/time.';
      Alert.alert('Error', message);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert(
      'Delete event',
      'Remove this event from the calendar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteCalendarEvent(eventId);
                Alert.alert('Success', 'Event deleted successfully');
                loadCalendarData();
              } catch (error) {
                console.error('Error deleting event:', error);
                Alert.alert('Error', 'Failed to delete event');
              }
            })();
          },
        },
      ]
    );
  };

  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      custody: '👨‍👩‍👧‍👦',
      activity: '🎉',
      medical: '🏥',
      school: '🎓',
      other: '📅'
    };
    return icons[type] || '📅';
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      custody: '#E3F2FD',
      activity: '#E8F5E8',
      medical: '#FFEBEE',
      school: '#FFF3E0',
      other: '#F3E5F5'
    };
    return colors[type] || '#F5F5F5';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const getCustodyByDay = (dayOfWeek: number) => {
    return custodySchedule.filter(schedule => schedule.day_of_week === dayOfWeek);
  };

  const getParentName = (parentId: string) => {
    const member = familyMembers.find(m => m.user_id === parentId);
    if (member?.user) {
      return `${member.user.first_name} ${member.user.last_name}`;
    }
    return 'Unknown';
  };

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId);
    return child?.name || 'Unknown';
  };

  const handleCreateEvent = () => {
    setShowAddDialog(true);
  };

  const handleCreateCustodySchedule = () => {
    router.push('/co-parenting/calendar/custody');
  };

  const handleViewMessages = () => {
    router.push('/co-parenting/messages');
  };

  const handleViewExpenses = () => {
    router.push('/co-parenting/expenses');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Surface style={styles.header} elevation={1}>
          <View style={styles.headerContent}>
            <Text variant="headlineSmall" style={styles.title}>
              📅 Co-Parenting Hub
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Manage shared schedules and family coordination
            </Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text variant="titleLarge">{upcomingEvents.length}</Text>
              <Text variant="bodySmall">Upcoming</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="titleLarge">{unreadMessages}</Text>
              <Text variant="bodySmall">Messages</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="titleLarge">{pendingExpenses}</Text>
              <Text variant="bodySmall">Expenses</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="titleLarge">{custodySchedule.length}</Text>
              <Text variant="bodySmall">Custody Days</Text>
            </View>
          </View>
        </Surface>

        {/* View Mode Toggle */}
        <Card style={styles.modeCard}>
          <Card.Content>
            <SegmentedButtons
              value={viewMode}
              onValueChange={(value) => setViewMode(value as 'calendar' | 'schedule' | 'communication' | 'expenses')}
              buttons={views.map(view => ({
                value: view.value,
                label: view.label,
              }))}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <View style={styles.calendarView}>
            {/* Upcoming Events */}
            <Card style={styles.sectionCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  📅 Upcoming Events ({upcomingEvents.length})
                </Text>
                
                {upcomingEvents.length === 0 ? (
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    No upcoming events. Create your first event!
                  </Text>
                ) : (
                  <View style={styles.eventsList}>
                    {upcomingEvents.slice(0, 5).map((event) => (
                      <Card key={event.id} style={styles.eventCard}>
                        <Card.Content>
                          <View style={styles.eventHeader}>
                            <Chip
                              style={[
                                styles.eventTypeChip,
                                { backgroundColor: getEventTypeColor(event.event_type) }
                              ]}
                            >
                              {getEventTypeIcon(event.event_type)} {event.event_type}
                            </Chip>
                            <Text 
                              style={{ fontSize: 20, marginLeft: 8 }}
                              onPress={() => handleDeleteEvent(event.id)}
                            >
                              🗑️
                            </Text>
                          </View>
                          <Text variant="titleMedium" style={styles.eventTitle}>
                            {event.title}
                          </Text>
                          {event.description && (
                            <Text variant="bodySmall" style={styles.eventDescription}>
                              {event.description}
                            </Text>
                          )}
                          <View style={styles.eventMeta}>
                            <Text variant="bodySmall" style={styles.eventDate}>
                              📅 {formatDate(event.start_date)}
                            </Text>
                            {event.location && (
                              <Text variant="bodySmall" style={styles.eventLocation}>
                                📍 {event.location}
                              </Text>
                            )}
                          </View>
                        </Card.Content>
                      </Card>
                    ))}
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* All Events */}
            <Card style={styles.sectionCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  📋 All Events ({events.length})
                </Text>
                
                {events.length === 0 ? (
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    No events created yet.
                  </Text>
                ) : (
                  <View style={styles.eventsList}>
                    {events.slice(0, 10).map((event) => (
                      <Card key={event.id} style={styles.eventCard}>
                        <Card.Content>
                          <View style={styles.eventHeader}>
                            <Chip
                              style={[
                                styles.eventTypeChip,
                                { backgroundColor: getEventTypeColor(event.event_type) }
                              ]}
                            >
                              {getEventTypeIcon(event.event_type)} {event.event_type}
                            </Chip>
                            <Text 
                              style={{ fontSize: 20, marginLeft: 8 }}
                              onPress={() => handleDeleteEvent(event.id)}
                            >
                              🗑️
                            </Text>
                          </View>
                          <Text variant="titleMedium" style={styles.eventTitle}>
                            {event.title}
                          </Text>
                          {event.description && (
                            <Text variant="bodySmall" style={styles.eventDescription}>
                              {event.description}
                            </Text>
                          )}
                          <View style={styles.eventMeta}>
                            <Text variant="bodySmall" style={styles.eventDate}>
                              📅 {formatDate(event.start_date)}
                            </Text>
                            {event.location && (
                              <Text variant="bodySmall" style={styles.eventLocation}>
                                📍 {event.location}
                              </Text>
                            )}
                          </View>
                        </Card.Content>
                      </Card>
                    ))}
                  </View>
                )}
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Custody Schedule View */}
        {viewMode === 'schedule' && (
          <View style={styles.scheduleView}>
            <Card style={styles.sectionCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  👨‍👩‍👧‍👦 Custody Schedule
                </Text>
                
                {custodySchedule.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text variant="bodyMedium" style={styles.emptyText}>
                      No custody schedule set up yet. Create your first schedule!
                    </Text>
                    <Button
                      mode="contained"
                      onPress={handleCreateCustodySchedule}
                      style={styles.createButton}
                    >
                      Create Schedule
                    </Button>
                  </View>
                ) : (
                  <View style={styles.scheduleList}>
                    {Array.from({ length: 7 }, (_, dayOfWeek) => {
                      const daySchedules = getCustodyByDay(dayOfWeek);
                      return (
                        <Card key={dayOfWeek} style={styles.scheduleCard}>
                          <Card.Content>
                            <Text variant="titleMedium" style={styles.dayTitle}>
                              {getDayName(dayOfWeek)}
                            </Text>
                            {daySchedules.length === 0 ? (
                              <Text variant="bodySmall" style={styles.noScheduleText}>
                                No schedule set
                              </Text>
                            ) : (
                              <View style={styles.scheduleItems}>
                                {daySchedules.map((schedule) => (
                                  <View key={schedule.id} style={styles.scheduleItem}>
                                    <Avatar.Text 
                                      size={30} 
                                      label={getParentName(schedule.parent_id).charAt(0)} 
                                    />
                                    <View style={styles.scheduleDetails}>
                                      <Text variant="bodyMedium" style={styles.parentName}>
                                        {getParentName(schedule.parent_id)}
                                      </Text>
                                      <Text variant="bodySmall" style={styles.scheduleTime}>
                                        {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                      </Text>
                                      <Text variant="bodySmall" style={styles.childName}>
                                        {getChildName(schedule.child_id)}
                                      </Text>
                                    </View>
                                    {schedule.is_primary && (
                                      <Chip style={styles.primaryChip}>
                                        Primary
                                      </Chip>
                                    )}
                                  </View>
                                ))}
                              </View>
                            )}
                          </Card.Content>
                        </Card>
                      );
                    })}
                  </View>
                )}
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Communication View */}
        {viewMode === 'communication' && (
          <View style={styles.communicationView}>
            <Card style={styles.sectionCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  💬 Communication Center
                </Text>
                
                <View style={styles.communicationStats}>
                  <View style={styles.commStat}>
                    <Text variant="titleLarge" style={styles.commStatNumber}>
                      {unreadMessages}
                    </Text>
                    <Text variant="bodySmall">Unread Messages</Text>
                  </View>
                  <View style={styles.commStat}>
                    <Text variant="titleLarge" style={styles.commStatNumber}>
                      {familyMembers.length}
                    </Text>
                    <Text variant="bodySmall">Family Members</Text>
                  </View>
                </View>

                <Text variant="bodyMedium" style={styles.emptyText}>
                  Message management coming soon! Send and receive messages with co-parents.
                </Text>
                
                <Button
                  mode="contained"
                  onPress={handleViewMessages}
                  style={styles.createButton}
                >
                  View Messages
                </Button>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Expenses View */}
        {viewMode === 'expenses' && (
          <View style={styles.expensesView}>
            <Card style={styles.sectionCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  💰 Shared Expenses
                </Text>
                
                <View style={styles.expenseStats}>
                  <View style={styles.expenseStat}>
                    <Text variant="titleLarge" style={styles.expenseStatNumber}>
                      {pendingExpenses}
                    </Text>
                    <Text variant="bodySmall">Pending</Text>
                  </View>
                  <View style={styles.expenseStat}>
                    <Text variant="titleLarge" style={styles.expenseStatNumber}>
                      $0
                    </Text>
                    <Text variant="bodySmall">Total</Text>
                  </View>
                </View>

                <Text variant="bodyMedium" style={styles.emptyText}>
                  Expense tracking coming soon! Track and split shared expenses.
                </Text>
                
                <Button
                  mode="contained"
                  onPress={handleViewExpenses}
                  style={styles.createButton}
                >
                  View Expenses
                </Button>
              </Card.Content>
            </Card>
          </View>
        )}
      </ScrollView>

      <FAB
        icon={() => <Text style={{ fontSize: 20 }}>➕</Text>}
        style={styles.fab}
        onPress={handleCreateEvent}
        label="Add Event"
      />

      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add event</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.addDialogScroll} keyboardShouldPersistTaps="handled">
              <TextInput
                label="Title *"
                value={newEvent.title}
                onChangeText={(text) => setNewEvent((s) => ({ ...s, title: text }))}
                mode="outlined"
                style={styles.addDialogField}
              />
              <TextInput
                label="Description"
                value={newEvent.description}
                onChangeText={(text) => setNewEvent((s) => ({ ...s, description: text }))}
                mode="outlined"
                multiline
                style={styles.addDialogField}
              />
              <Text variant="labelLarge" style={styles.addDialogLabel}>
                Event type
              </Text>
              <View style={styles.eventTypeChips}>
                {CALENDAR_EVENT_TYPES.map((t) => (
                  <Chip
                    key={t}
                    selected={newEvent.event_type === t}
                    onPress={() => setNewEvent((s) => ({ ...s, event_type: t }))}
                  >
                    {t}
                  </Chip>
                ))}
              </View>
              <TextInput
                label="Start date * (YYYY-MM-DD or ISO)"
                value={newEvent.start_date}
                onChangeText={(text) => setNewEvent((s) => ({ ...s, start_date: text }))}
                mode="outlined"
                placeholder="2025-04-10"
                style={styles.addDialogField}
              />
              <TextInput
                label="End date (optional)"
                value={newEvent.end_date}
                onChangeText={(text) => setNewEvent((s) => ({ ...s, end_date: text }))}
                mode="outlined"
                style={styles.addDialogField}
              />
              <TextInput
                label="Location"
                value={newEvent.location}
                onChangeText={(text) => setNewEvent((s) => ({ ...s, location: text }))}
                mode="outlined"
                style={styles.addDialogField}
              />
              <View style={styles.allDayRow}>
                <Text variant="bodyLarge">All day</Text>
                <Switch
                  value={newEvent.is_all_day}
                  onValueChange={(v) => setNewEvent((s) => ({ ...s, is_all_day: v }))}
                />
              </View>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onPress={() => void handleAddEvent()}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    marginBottom: 10,
  },
  headerContent: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  modeCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 10,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  calendarView: {
    padding: 20,
    paddingTop: 0,
  },
  scheduleView: {
    padding: 20,
    paddingTop: 0,
  },
  communicationView: {
    padding: 20,
    paddingTop: 0,
  },
  expensesView: {
    padding: 20,
    paddingTop: 0,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  createButton: {
    marginTop: 8,
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    elevation: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTypeChip: {
    alignSelf: 'flex-start',
  },
  eventTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDescription: {
    color: '#666',
    marginBottom: 8,
  },
  eventMeta: {
    gap: 4,
  },
  eventDate: {
    fontWeight: '500',
  },
  eventLocation: {
    color: '#666',
  },
  scheduleList: {
    gap: 12,
  },
  scheduleCard: {
    elevation: 1,
  },
  dayTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  noScheduleText: {
    color: '#666',
    fontStyle: 'italic',
  },
  scheduleItems: {
    gap: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  scheduleDetails: {
    flex: 1,
    marginLeft: 12,
  },
  parentName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  scheduleTime: {
    color: '#666',
    marginBottom: 2,
  },
  childName: {
    color: '#666',
    fontSize: 12,
  },
  primaryChip: {
    backgroundColor: '#4CAF50',
  },
  communicationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  commStat: {
    alignItems: 'center',
  },
  commStatNumber: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  expenseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  expenseStat: {
    alignItems: 'center',
  },
  expenseStatNumber: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  addDialogScroll: {
    maxHeight: 420,
  },
  addDialogField: {
    marginBottom: 8,
  },
  addDialogLabel: {
    marginBottom: 8,
  },
  eventTypeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  allDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
}); 