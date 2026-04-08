import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  Switch,
  List,
  Divider,
  Surface,
  Avatar,
  Chip,
  Dialog,
  Portal,
  RadioButton,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import {
  getCurrentFamily,
  getFamilyMembers,
  getFamilyMemberActiveMap,
  setFamilyMemberActivePreference,
  type FamilyMember as SupabaseFamilyMember,
} from '../../../services/supabase/family';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'co_parent' | 'child' | 'member';
  avatar: string;
  isActive: boolean;
}

const PREFERENCES_STORAGE_KEY = 'motustots:settings:preferences';
const NOTIFICATIONS_STORAGE_KEY = 'motustots:settings:notifications';

function formatMemberName(m: SupabaseFamilyMember): string {
  const u = m.user;
  if (!u) return 'Member';
  const parts = [u.first_name, u.last_name].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return u.email || 'Member';
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

function mapDbRoleToUi(role: string): FamilyMember['role'] {
  if (role === 'co_parent') return 'co_parent';
  if (role === 'member') return 'member';
  return 'parent';
}

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  isEnabled: boolean;
  category: 'routines' | 'chores' | 'education' | 'co_parenting' | 'general';
}

interface AppPreference {
  id: string;
  title: string;
  description: string;
  value: string | boolean;
  type: 'toggle' | 'select' | 'text';
  options?: string[];
}

export default function SettingsScreen() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);
  const [membersLoading, setMembersLoading] = useState(true);

  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: '1',
      title: 'Routine Reminders',
      description: 'Get notified when routines are due',
      isEnabled: true,
      category: 'routines'
    },
    {
      id: '2',
      title: 'Chore Assignments',
      description: 'Notifications for new chore assignments',
      isEnabled: true,
      category: 'chores'
    },
    {
      id: '3',
      title: 'Educational Progress',
      description: 'Updates on learning achievements',
      isEnabled: false,
      category: 'education'
    },
    {
      id: '4',
      title: 'Co-parenting Messages',
      description: 'New messages from co-parents',
      isEnabled: true,
      category: 'co_parenting'
    },
    {
      id: '5',
      title: 'Weekly Reports',
      description: 'Family progress summaries',
      isEnabled: true,
      category: 'general'
    }
  ]);

  const [preferences, setPreferences] = useState<AppPreference[]>([
    {
      id: '1',
      title: 'Dark Mode',
      description: 'Use dark theme throughout the app',
      value: false,
      type: 'toggle'
    },
    {
      id: '2',
      title: 'Auto-sync',
      description: 'Automatically sync data across devices',
      value: true,
      type: 'toggle'
    },
    {
      id: '3',
      title: 'Language',
      description: 'App language preference',
      value: 'English',
      type: 'select',
      options: ['English', 'Spanish', 'French', 'German']
    },
    {
      id: '4',
      title: 'Time Zone',
      description: 'Your local time zone',
      value: 'UTC-5 (Eastern Time)',
      type: 'select',
      options: ['UTC-8 (Pacific Time)', 'UTC-7 (Mountain Time)', 'UTC-6 (Central Time)', 'UTC-5 (Eastern Time)']
    }
  ]);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [preferencePicker, setPreferencePicker] = useState<AppPreference | null>(null);
  const [pickerDraft, setPickerDraft] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { id: string; value: string | boolean }[];
          if (Array.isArray(parsed)) {
            setPreferences((prev) =>
              prev.map((p) => {
                const hit = parsed.find((x) => x.id === p.id);
                return hit ? { ...p, value: hit.value } : p;
              })
            );
          }
        }
      } catch {
        /* ignore */
      }
      try {
        const rawN = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (!rawN) return;
        const parsedN = JSON.parse(rawN) as { id: string; isEnabled: boolean }[];
        if (!Array.isArray(parsedN)) return;
        setNotifications((prev) =>
          prev.map((n) => {
            const hit = parsedN.find((x) => x.id === n.id);
            return hit ? { ...n, isEnabled: hit.isEnabled } : n;
          })
        );
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setMembersLoading(true);
        try {
          const family = await getCurrentFamily();
          if (!alive) return;
          if (!family) {
            setCurrentFamilyId(null);
            setFamilyMembers([]);
            return;
          }
          setCurrentFamilyId(family.id);
          const rows = await getFamilyMembers(family.id);
          const activeMap = await getFamilyMemberActiveMap(family.id);
          if (!alive) return;
          const mapped: FamilyMember[] = rows.map((m) => ({
            id: m.id,
            name: formatMemberName(m),
            email: m.user?.email ?? '',
            role: mapDbRoleToUi(m.role),
            avatar: initialsFromName(formatMemberName(m)),
            isActive: activeMap[m.id] !== false,
          }));
          setFamilyMembers(mapped);
        } catch (e) {
          console.error('Settings: load family members', e);
          if (alive) {
            setFamilyMembers([]);
            setCurrentFamilyId(null);
          }
        } finally {
          if (alive) setMembersLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  const persistPreferenceSnapshot = (next: AppPreference[]) => {
    const snapshot = next.map((p) => ({ id: p.id, value: p.value }));
    void AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(snapshot));
  };

  const updatePreferences = (updater: (prev: AppPreference[]) => AppPreference[]) => {
    setPreferences((prev) => {
      const next = updater(prev);
      persistPreferenceSnapshot(next);
      return next;
    });
  };

  const persistNotificationSnapshot = (next: NotificationSetting[]) => {
    const snapshot = next.map((n) => ({ id: n.id, isEnabled: n.isEnabled }));
    void AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(snapshot));
  };

  const toggleNotification = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((notification) =>
        notification.id === id
          ? { ...notification, isEnabled: !notification.isEnabled }
          : notification
      );
      persistNotificationSnapshot(next);
      return next;
    });
  };

  const togglePreference = (id: string) => {
    updatePreferences((prev) =>
      prev.map((pref) =>
        pref.id === id && pref.type === 'toggle'
          ? { ...pref, value: !pref.value }
          : pref
      )
    );
  };

  const openPreferencePicker = (pref: AppPreference) => {
    if (pref.type !== 'select' || !pref.options?.length) return;
    setPreferencePicker(pref);
    setPickerDraft(String(pref.value));
  };

  const applyPreferencePicker = () => {
    if (!preferencePicker) return;
    updatePreferences((prev) =>
      prev.map((p) => (p.id === preferencePicker.id ? { ...p, value: pickerDraft } : p))
    );
    setPreferencePicker(null);
  };

  const getRoleColor = (role: string) => {
    const colors = {
      parent: '#2196F3',
      co_parent: '#4CAF50',
      child: '#FF9800',
      member: '#9E9E9E',
    };
    return colors[role as keyof typeof colors] || '#666';
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      parent: '👨‍👩‍👧‍👦',
      co_parent: '🤝',
      child: '👶',
      member: '👤',
    };
    return icons[role as keyof typeof icons] || '👤';
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(false);
    Alert.alert(
      'Account Deleted',
      'Your account has been permanently deleted.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
    );
  };

  const handleLogout = () => {
    setShowLogoutDialog(false);
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineSmall">Settings</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Manage your app preferences and family
          </Text>
        </Surface>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Family Management
        </Text>

        <Button
          mode="contained-tonal"
          icon="account-group"
          style={styles.familySetupNav}
          onPress={() => router.push('/features/settings/family')}
        >
          Family setup & members
        </Button>

        <Card style={styles.familyCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Family Members ({membersLoading ? '…' : familyMembers.length})
            </Text>
            <Text variant="bodySmall" style={styles.cardSubtitle}>
              Manage who has access to your family data. Active is stored on this device until the
              database supports member status.
            </Text>
            
            <View style={styles.membersList}>
              {membersLoading ? (
                <Text variant="bodyMedium" style={styles.hintText}>
                  Loading members…
                </Text>
              ) : familyMembers.length === 0 ? (
                <Text variant="bodyMedium" style={styles.hintText}>
                  No family members loaded. Join or create a family to see members here.
                </Text>
              ) : (
                familyMembers.map((member) => (
                  <View key={member.id} style={styles.memberItem}>
                    <View style={styles.memberInfo}>
                      <Avatar.Text size={40} label={member.avatar} />
                      <View style={styles.memberDetails}>
                        <Text variant="titleMedium">{member.name}</Text>
                        {member.email ? (
                          <Text variant="bodySmall" style={styles.memberEmail}>
                            {member.email}
                          </Text>
                        ) : null}
                        <View style={styles.memberRole}>
                          <Text style={styles.roleIcon}>{getRoleIcon(member.role)}</Text>
                          <Chip
                            mode="outlined"
                            compact
                            style={[styles.roleChip, { borderColor: getRoleColor(member.role) }]}
                          >
                            {member.role.replace('_', ' ')}
                          </Chip>
                        </View>
                      </View>
                    </View>
                    <Switch
                      value={member.isActive}
                      onValueChange={async (next) => {
                        if (!currentFamilyId) {
                          Alert.alert('Family', 'No family loaded; cannot update member status.');
                          return;
                        }
                        try {
                          await setFamilyMemberActivePreference(
                            currentFamilyId,
                            member.id,
                            next
                          );
                          setFamilyMembers((prev) =>
                            prev.map((m) =>
                              m.id === member.id ? { ...m, isActive: next } : m
                            )
                          );
                        } catch (e) {
                          console.error(e);
                          Alert.alert('Error', 'Could not save member status.');
                        }
                      }}
                    />
                  </View>
                ))
              )}
            </View>
            
            <Button 
              mode="outlined" 
              style={styles.addButton}
              onPress={() => {
                router.push('/features/settings/children');
              }}
            >
              Manage Children
            </Button>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Notifications
        </Text>

        <Card style={styles.notificationsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Push Notifications
            </Text>
            <Text variant="bodySmall" style={styles.cardSubtitle}>
              Choose what notifications you want to receive
            </Text>
            
            {notifications.map((notification) => (
              <View key={notification.id} style={styles.notificationItem}>
                <View style={styles.notificationInfo}>
                  <Text variant="titleMedium">{notification.title}</Text>
                  <Text variant="bodySmall" style={styles.notificationDescription}>
                    {notification.description}
                  </Text>
                </View>
                <Switch 
                  value={notification.isEnabled} 
                  onValueChange={() => toggleNotification(notification.id)}
                />
              </View>
            ))}
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          App Preferences
        </Text>

        <Card style={styles.preferencesCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              General Settings
            </Text>
            <Text variant="bodySmall" style={styles.cardSubtitle}>
              Customize your app experience
            </Text>
            
            {preferences.map((preference) => (
              <View key={preference.id} style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text variant="titleMedium">{preference.title}</Text>
                  <Text variant="bodySmall" style={styles.preferenceDescription}>
                    {preference.description}
                  </Text>
                  {preference.type === 'select' && (
                    <Text variant="bodySmall" style={styles.currentValue}>
                      Current: {preference.value}
                    </Text>
                  )}
                </View>
                {preference.type === 'toggle' && (
                  <Switch 
                    value={preference.value as boolean} 
                    onValueChange={() => togglePreference(preference.id)}
                  />
                )}
                {preference.type === 'select' && (
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => openPreferencePicker(preference)}
                  >
                    Change
                  </Button>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Account & Privacy
        </Text>

        <Card style={styles.accountCard}>
          <Card.Content>
            <List.Item
              title="Edit Profile"
              description="Update your personal information"
              left={(props) => <Text style={{ fontSize: 20, color: '#666' }}>✏️</Text>}
              right={(props) => <Text style={{ fontSize: 16, color: '#666' }}>▶️</Text>}
              onPress={() => {
                // TODO: Navigate to edit profile
                console.log('Edit profile');
              }}
            />
            <Divider />
            <List.Item
              title="Change Password"
              description="Update your account password"
              left={(props) => <Text style={{ fontSize: 20, color: '#666' }}>🔒</Text>}
              right={(props) => <Text style={{ fontSize: 16, color: '#666' }}>▶️</Text>}
              onPress={() => {
                // TODO: Navigate to change password
                console.log('Change password');
              }}
            />
            <Divider />
            <List.Item
              title="Privacy Settings"
              description="Manage data sharing and privacy"
              left={(props) => <Text style={{ fontSize: 20, color: '#666' }}>🛡️</Text>}
              right={(props) => <Text style={{ fontSize: 16, color: '#666' }}>▶️</Text>}
              onPress={() => {
                // TODO: Navigate to privacy settings
                console.log('Privacy settings');
              }}
            />
            <Divider />
            <List.Item
              title="Export Data"
              description="Download your family data"
              left={(props) => <Text style={{ fontSize: 20, color: '#666' }}>📥</Text>}
              right={(props) => <Text style={{ fontSize: 16, color: '#666' }}>▶️</Text>}
              onPress={() => router.push('/features/settings/export-data')}
            />
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Support & About
        </Text>

        <Card style={styles.supportCard}>
          <Card.Content>
            <List.Item
              title="Help & FAQ"
              description="Get help and find answers"
              left={(props) => <Text style={{ fontSize: 20, color: '#666' }}>❓</Text>}
              right={(props) => <Text style={{ fontSize: 16, color: '#666' }}>▶️</Text>}
              onPress={() => router.push('/features/settings/help')}
            />
            <Divider />
            <List.Item
              title="Contact Support"
              description="Get in touch with our team"
              left={(props) => <Text style={{ fontSize: 20, color: '#666' }}>💬</Text>}
              right={(props) => <Text style={{ fontSize: 16, color: '#666' }}>▶️</Text>}
              onPress={() => router.push('/features/settings/contact-support')}
            />
            <Divider />
            <List.Item
              title="About MotusTots"
              description={`Version ${Constants.expoConfig?.version || Constants.nativeApplicationVersion || '1.0.0'}`}
              left={(props) => <Text style={{ fontSize: 20, color: '#666' }}>ℹ️</Text>}
              right={(props) => <Text style={{ fontSize: 16, color: '#666' }}>▶️</Text>}
              onPress={() => router.push('/features/settings/about')}
            />
          </Card.Content>
        </Card>

        <View style={styles.dangerZone}>
          <Text variant="titleMedium" style={styles.dangerTitle}>
            Danger Zone
          </Text>
          
          <Button 
            mode="outlined" 
            textColor="#FF5722"
            style={[styles.dangerButton, { borderColor: '#FF5722' }]}
            onPress={() => setShowLogoutDialog(true)}
          >
            Sign Out
          </Button>
          
          <Button 
            mode="outlined" 
            textColor="#D32F2F"
            style={[styles.dangerButton, { borderColor: '#D32F2F' }]}
            onPress={() => setShowDeleteDialog(true)}
          >
            Delete Account
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
          <Dialog.Title>Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Are you sure you want to sign out?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLogoutDialog(false)}>Cancel</Button>
            <Button onPress={handleLogout}>Sign Out</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button textColor="#D32F2F" onPress={handleDeleteAccount}>Delete</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={!!preferencePicker}
          onDismiss={() => setPreferencePicker(null)}
        >
          <Dialog.Title>{preferencePicker?.title ?? 'Choose'}</Dialog.Title>
          <Dialog.ScrollArea style={styles.preferenceDialogScroll}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <RadioButton.Group
                value={pickerDraft}
                onValueChange={setPickerDraft}
              >
                {preferencePicker?.options?.map((opt) => (
                  <RadioButton.Item key={opt} label={opt} value={opt} />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setPreferencePicker(null)}>Cancel</Button>
            <Button onPress={applyPreferencePicker}>Save</Button>
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
    padding: 16,
  },
  header: {
    padding: 20,
    marginBottom: 24,
    borderRadius: 12,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  familySetupNav: {
    marginBottom: 16,
  },
  familyCard: {
    marginBottom: 24,
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardSubtitle: {
    opacity: 0.6,
    marginBottom: 16,
  },
  membersList: {
    marginBottom: 16,
  },
  hintText: {
    opacity: 0.7,
    paddingVertical: 8,
  },
  preferenceDialogScroll: {
    maxHeight: 320,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberDetails: {
    marginLeft: 12,
    flex: 1,
  },
  memberEmail: {
    opacity: 0.6,
    marginTop: 2,
  },
  memberRole: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  roleIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  roleChip: {
    height: 20,
  },
  addButton: {
    marginTop: 8,
  },
  notificationsCard: {
    marginBottom: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationDescription: {
    opacity: 0.6,
    marginTop: 2,
  },
  preferencesCard: {
    marginBottom: 24,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceDescription: {
    opacity: 0.6,
    marginTop: 2,
  },
  currentValue: {
    opacity: 0.8,
    marginTop: 4,
    fontStyle: 'italic',
  },
  accountCard: {
    marginBottom: 24,
  },
  supportCard: {
    marginBottom: 24,
  },
  dangerZone: {
    marginBottom: 24,
  },
  dangerTitle: {
    marginBottom: 16,
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  dangerButton: {
    marginBottom: 12,
  },
}); 