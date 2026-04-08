import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Surface,
  Avatar,
  FAB,
  TextInput,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useFamilyStore } from '../../../../stores/familyStore';
import { useAuthStore } from '../../../../stores/authStore';
import type { FamilyMember } from '../../../../services/supabase/family';
import {
  getAllMessagesForFamily,
  sendMessage as sendCoparentMessage,
  markMessageAsRead,
  type CoParentingMessage,
} from '../../../../services/supabase/coparenting';

type ConversationRow = {
  partnerId: string;
  coParentName: string;
  coParentAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
};

function memberDisplayName(m: FamilyMember): string {
  if (m.user) {
    const name = `${m.user.first_name || ''} ${m.user.last_name || ''}`.trim();
    return name || m.user.email || 'Member';
  }
  return 'Member';
}

function memberInitials(m: FamilyMember): string {
  if (m.user) {
    const fn = m.user.first_name?.[0] || '';
    const ln = m.user.last_name?.[0] || '';
    if (fn || ln) return `${fn}${ln}`.toUpperCase().slice(0, 2);
    return (m.user.email?.[0] || '?').toUpperCase();
  }
  return '?';
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  if (diffM < 1) return 'Just now';
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString();
}

function buildConversations(
  rows: CoParentingMessage[],
  myId: string,
  members: FamilyMember[]
): ConversationRow[] {
  const byPartner = new Map<string, CoParentingMessage[]>();
  for (const m of rows) {
    if (!m.recipient_id) continue;
    const other = m.sender_id === myId ? m.recipient_id : m.sender_id;
    if (!other || other === myId) continue;
    const list = byPartner.get(other) || [];
    list.push(m);
    byPartner.set(other, list);
  }

  const memberMap = new Map(members.map((x) => [x.user_id, x]));
  const out: ConversationRow[] = [];
  for (const [partnerId, msgs] of Array.from(byPartner.entries())) {
    const sorted = [...msgs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const last = sorted[0];
    const unread = sorted.filter(
      (x) => x.recipient_id === myId && !x.is_read && x.sender_id === partnerId
    ).length;
    const mem = memberMap.get(partnerId);
    out.push({
      partnerId,
      coParentName: mem ? memberDisplayName(mem) : 'Co-parent',
      coParentAvatar: mem ? memberInitials(mem) : '?',
      lastMessage: last.content,
      lastMessageTime: formatRelativeTime(last.created_at),
      unreadCount: unread,
    });
  }
  return out;
}

/** Sort by latest message time (partner b vs a) — uses last timestamps from rows. */
function sortConversationRows(rows: CoParentingMessage[], list: ConversationRow[], myId: string): ConversationRow[] {
  const latest = (partnerId: string) => {
    let t = 0;
    for (const r of rows) {
      if (!r.recipient_id) continue;
      const other = r.sender_id === myId ? r.recipient_id : r.sender_id;
      if (other !== partnerId) continue;
      const ts = new Date(r.created_at).getTime();
      if (ts > t) t = ts;
    }
    return t;
  };
  return [...list].sort((a, b) => latest(b.partnerId) - latest(a.partnerId));
}

export default function MessagesScreen() {
  const { user } = useAuthStore();
  const { currentFamily, familyMembers, isLoading: familyLoading, error: familyError, loadFamilies } =
    useFamilyStore();
  const params = useLocalSearchParams<{ to?: string | string[] }>();
  const toParam = params.to;
  const toUserId = Array.isArray(toParam) ? toParam[0] : toParam;

  const [allMessages, setAllMessages] = useState<CoParentingMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedThreadUserId, setSelectedThreadUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [newDialogVisible, setNewDialogVisible] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!currentFamily?.id) return;
    setLoadingMessages(true);
    try {
      const rows = await getAllMessagesForFamily(currentFamily.id);
      setAllMessages(rows);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not load messages.');
    } finally {
      setLoadingMessages(false);
    }
  }, [currentFamily?.id]);

  useEffect(() => {
    if (user?.id) {
      void loadFamilies(user.id);
    }
  }, [user?.id, loadFamilies]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id && currentFamily?.id) {
        void loadMessages();
      }
    }, [user?.id, currentFamily?.id, loadMessages])
  );

  useEffect(() => {
    if (typeof toUserId === 'string' && toUserId.length > 0) {
      setSelectedThreadUserId(toUserId);
    }
  }, [toUserId]);

  const conversations = useMemo(() => {
    if (!user?.id) return [];
    const raw = buildConversations(allMessages, user.id, familyMembers);
    return sortConversationRows(allMessages, raw, user.id);
  }, [allMessages, familyMembers, user?.id]);

  const threadMessages = useMemo(() => {
    if (!user?.id || !selectedThreadUserId) return [];
    const partner = selectedThreadUserId;
    return allMessages.filter((m) => {
      if (!m.recipient_id) return false;
      return (
        (m.sender_id === user.id && m.recipient_id === partner) ||
        (m.sender_id === partner && m.recipient_id === user.id)
      );
    });
  }, [allMessages, selectedThreadUserId, user?.id]);

  const threadMessagesDisplay = useMemo(() => {
    return [...threadMessages].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [threadMessages]);

  const activePartnerMember = useMemo(
    () => familyMembers.find((m) => m.user_id === selectedThreadUserId),
    [familyMembers, selectedThreadUserId]
  );

  useEffect(() => {
    if (!user?.id || !selectedThreadUserId) return;
    const unread = threadMessages.filter(
      (m) => m.recipient_id === user.id && !m.is_read && m.sender_id === selectedThreadUserId
    );
    if (unread.length === 0) return;
    void (async () => {
      try {
        await Promise.all(unread.map((m) => markMessageAsRead(m.id)));
        setAllMessages((prev) =>
          prev.map((x) =>
            unread.some((u) => u.id === x.id) ? { ...x, is_read: true } : x
          )
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedThreadUserId, threadMessages, user?.id]);

  const send = async () => {
    const text = newMessage.trim();
    if (!text || !user?.id || !currentFamily?.id || !selectedThreadUserId) return;
    setSending(true);
    try {
      const created = await sendCoparentMessage({
        family_id: currentFamily.id,
        sender_id: user.id,
        recipient_id: selectedThreadUserId,
        subject: null,
        content: text,
        message_type: 'general',
        is_read: false,
      });
      setAllMessages((prev) => [...prev, created]);
      setNewMessage('');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: CoParentingMessage }) => {
    const isMyMessage = !!user && item.sender_id === user.id;
    const senderMember = familyMembers.find((m) => m.user_id === item.sender_id);
    const senderName = senderMember ? memberDisplayName(senderMember) : 'Co-parent';
    const senderAvatar = senderMember ? memberInitials(senderMember) : '?';
    const timeStr = new Date(item.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        {!isMyMessage && (
          <Avatar.Text size={32} label={senderAvatar} style={styles.messageAvatar} />
        )}
        <View style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.theirBubble]}>
          {!isMyMessage && (
            <Text variant="bodySmall" style={styles.senderName}>
              {senderName}
            </Text>
          )}
          <Text
            variant="bodyMedium"
            style={isMyMessage ? styles.lightText : styles.darkText}
          >
            {item.content}
          </Text>
          <Text variant="bodySmall" style={styles.messageTime}>
            {timeStr}
          </Text>
        </View>
      </View>
    );
  };

  const renderConversation = ({ item }: { item: ConversationRow }) => (
    <Card style={styles.conversationCard} onPress={() => setSelectedThreadUserId(item.partnerId)}>
      <Card.Content>
        <View style={styles.conversationHeader}>
          <View style={styles.conversationInfo}>
            <View style={styles.avatarContainer}>
              <Avatar.Text size={50} label={item.coParentAvatar} />
            </View>
            <View style={styles.conversationDetails}>
              <Text variant="titleMedium">{item.coParentName}</Text>
              <Text variant="bodySmall" style={styles.lastMessage} numberOfLines={2}>
                {item.lastMessage}
              </Text>
            </View>
          </View>
          <View style={styles.conversationMeta}>
            <Text variant="bodySmall" style={styles.lastMessageTime}>
              {item.lastMessageTime}
            </Text>
            {item.unreadCount > 0 && (
              <Chip mode="flat" compact style={styles.unreadChip}>
                {item.unreadCount}
              </Chip>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (familyLoading && !currentFamily) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading messages…</Text>
      </View>
    );
  }

  if (!currentFamily) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="titleMedium" style={styles.noFamilyTitle}>
          No family workspace yet
        </Text>
        <Text variant="bodyMedium" style={styles.noFamilyBody}>
          Create a family from Home (Family setup card) or Settings → Family setup & members, then return here.
        </Text>
        {familyError ? (
          <Text variant="bodySmall" style={styles.noFamilyError}>
            {familyError}
          </Text>
        ) : null}
        {user?.id ? (
          <Button mode="contained" style={styles.retryButton} onPress={() => void loadFamilies(user.id)}>
            Retry
          </Button>
        ) : null}
      </View>
    );
  }

  const otherMembers = familyMembers.filter((m) => m.user_id !== user?.id);

  if (selectedThreadUserId) {
    const title = activePartnerMember
      ? memberDisplayName(activePartnerMember)
      : 'Messages';
    const avatar = activePartnerMember ? memberInitials(activePartnerMember) : '?';

    return (
      <View style={styles.container}>
        <Surface style={styles.chatHeader} elevation={1}>
          <Text
            style={styles.backButton}
            onPress={() => {
              setSelectedThreadUserId(null);
              router.replace('/features/co-parenting/messages');
            }}
          >
            ⬅️
          </Text>
          <View style={styles.chatHeaderInfo}>
            <Avatar.Text size={40} label={avatar} />
            <View style={styles.chatHeaderDetails}>
              <Text variant="titleMedium">{title}</Text>
            </View>
          </View>
        </Surface>

        {loadingMessages ? (
          <View style={styles.threadLoading}>
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            data={threadMessagesDisplay}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            inverted
            ListEmptyComponent={
              <Text variant="bodyMedium" style={styles.emptyThread}>
                No messages yet. Say hello below.
              </Text>
            }
          />
        )}

        <Surface style={styles.inputContainer} elevation={2}>
          <TextInput
            mode="outlined"
            placeholder="Type a message…"
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.messageInput}
            multiline
            editable={!sending}
          />
          <Text
            style={[styles.sendButton, { opacity: newMessage.trim() && !sending ? 1 : 0.3 }]}
            onPress={() => void send()}
          >
            📤
          </Text>
        </Surface>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={1}>
        <Text variant="headlineSmall">Messages</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Secure communication with co-parents
        </Text>
      </Surface>

      {loadingMessages ? (
        <View style={styles.threadLoading}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.partnerId}
          style={styles.conversationsList}
          contentContainerStyle={styles.conversationsContent}
          ListEmptyComponent={
            <Text variant="bodyMedium" style={styles.emptyList}>
              No conversations yet. Tap + to message a co-parent.
            </Text>
          }
        />
      )}

      <FAB
        icon={() => <Text style={{ fontSize: 20 }}>➕</Text>}
        style={styles.fab}
        onPress={() => {
          if (otherMembers.length === 0) {
            Alert.alert('No co-parents', 'Add another parent to your family to start a conversation.');
            return;
          }
          setNewDialogVisible(true);
        }}
      />

      <Portal>
        <Dialog visible={newDialogVisible} onDismiss={() => setNewDialogVisible(false)}>
          <Dialog.Title>New conversation</Dialog.Title>
          <Dialog.Content>
            {otherMembers.map((m) => (
              <Card
                key={m.user_id}
                style={styles.dialogRow}
                onPress={() => {
                  setNewDialogVisible(false);
                  router.replace(
                    `/features/co-parenting/messages?to=${encodeURIComponent(m.user_id)}`
                  );
                }}
              >
                <Card.Content style={styles.dialogRowInner}>
                  <Avatar.Text size={40} label={memberInitials(m)} />
                  <Text variant="titleSmall" style={styles.dialogName}>
                    {memberDisplayName(m)}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNewDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
  },
  noFamilyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  noFamilyBody: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 16,
  },
  noFamilyError: {
    color: '#c62828',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  conversationsList: {
    flex: 1,
  },
  conversationsContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyList: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 32,
  },
  emptyThread: {
    textAlign: 'center',
    opacity: 0.6,
    padding: 24,
  },
  threadLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationCard: {
    marginBottom: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  conversationInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  conversationDetails: {
    flex: 1,
  },
  lastMessage: {
    opacity: 0.6,
    marginTop: 4,
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  lastMessageTime: {
    opacity: 0.5,
    marginBottom: 4,
  },
  unreadChip: {
    backgroundColor: '#FF5722',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 24,
    marginHorizontal: 8,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  chatHeaderDetails: {
    marginLeft: 12,
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: '#2196F3',
  },
  theirBubble: {
    backgroundColor: '#fff',
  },
  senderName: {
    fontWeight: 'bold',
    marginBottom: 4,
    opacity: 0.8,
  },
  lightText: {
    color: '#fff',
  },
  darkText: {
    color: '#333',
  },
  messageTime: {
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
  },
  messageInput: {
    flex: 1,
    marginHorizontal: 8,
    maxHeight: 100,
  },
  sendButton: {
    fontSize: 24,
    marginHorizontal: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialogRow: {
    marginBottom: 8,
  },
  dialogRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dialogName: {
    marginLeft: 8,
    flex: 1,
  },
});
