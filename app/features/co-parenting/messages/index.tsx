import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, Card, Button, Chip, Surface, Avatar, FAB, TextInput, IconButton } from 'react-native-paper';
import { router } from 'expo-router';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  messageType: 'text' | 'image' | 'voice' | 'file';
  attachments?: string[];
}

interface Conversation {
  id: string;
  coParentName: string;
  coParentAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      coParentName: 'Sarah Johnson',
      coParentAvatar: 'SJ',
      lastMessage: 'Emma has a dentist appointment tomorrow at 2 PM',
      lastMessageTime: '2 hours ago',
      unreadCount: 3,
      isOnline: true
    },
    {
      id: '2',
      coParentName: 'Mike Wilson',
      coParentAvatar: 'MW',
      lastMessage: 'Can you pick up the new school supplies?',
      lastMessageTime: '1 day ago',
      unreadCount: 0,
      isOnline: false
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'coParent',
      senderName: 'Sarah Johnson',
      senderAvatar: 'SJ',
      content: 'Hi! How was Emma\'s day at school?',
      timestamp: '10:30 AM',
      isRead: true,
      messageType: 'text'
    },
    {
      id: '2',
      senderId: 'me',
      senderName: 'John Doe',
      senderAvatar: 'JD',
      content: 'She had a great day! Her teacher said she was very helpful with the new student.',
      timestamp: '10:32 AM',
      isRead: true,
      messageType: 'text'
    },
    {
      id: '3',
      senderId: 'coParent',
      senderName: 'Sarah Johnson',
      senderAvatar: 'SJ',
      content: 'That\'s wonderful! She has a dentist appointment tomorrow at 2 PM. Can you bring her?',
      timestamp: '10:35 AM',
      isRead: true,
      messageType: 'text'
    },
    {
      id: '4',
      senderId: 'me',
      senderName: 'John Doe',
      senderAvatar: 'JD',
      content: 'Of course! I\'ll make sure to bring her. Should I pick her up from school?',
      timestamp: '10:37 AM',
      isRead: true,
      messageType: 'text'
    },
    {
      id: '5',
      senderId: 'coParent',
      senderName: 'Sarah Johnson',
      senderAvatar: 'SJ',
      content: 'Yes, please. Here\'s the appointment reminder.',
      timestamp: '10:40 AM',
      isRead: false,
      messageType: 'file',
      attachments: ['appointment_reminder.pdf']
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        senderId: 'me',
        senderName: 'John Doe',
        senderAvatar: 'JD',
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        messageType: 'text'
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === 'me';
    
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        {!isMyMessage && (
          <Avatar.Text size={32} label={item.senderAvatar} style={styles.messageAvatar} />
        )}
        <View style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.theirBubble]}>
          {!isMyMessage && (
            <Text variant="bodySmall" style={styles.senderName}>
              {item.senderName}
            </Text>
          )}
          <Text variant="bodyMedium" style={styles.messageContent}>
            {item.content}
          </Text>
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {item.attachments.map((attachment, index) => (
                <Chip key={index} mode="outlined" compact style={styles.attachment}>
                  📎 {attachment}
                </Chip>
              ))}
            </View>
          )}
          <Text variant="bodySmall" style={styles.messageTime}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Card 
      style={styles.conversationCard}
      onPress={() => setSelectedConversation(item.id)}
    >
      <Card.Content>
        <View style={styles.conversationHeader}>
          <View style={styles.conversationInfo}>
            <View style={styles.avatarContainer}>
              <Avatar.Text size={50} label={item.coParentAvatar} />
              {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            <View style={styles.conversationDetails}>
              <Text variant="titleMedium">{item.coParentName}</Text>
              <Text variant="bodySmall" style={styles.lastMessage}>
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

  if (selectedConversation) {
    const conversation = conversations.find(c => c.id === selectedConversation);
    
    return (
      <View style={styles.container}>
        <Surface style={styles.chatHeader} elevation={1}>
          <Text 
            style={{ fontSize: 24, marginHorizontal: 8 }}
            onPress={() => setSelectedConversation(null)}
          >
            ⬅️
          </Text>
          <View style={styles.chatHeaderInfo}>
            <Avatar.Text size={40} label={conversation?.coParentAvatar || '?'} />
            <View style={styles.chatHeaderDetails}>
              <Text variant="titleMedium">{conversation?.coParentName}</Text>
              <Text variant="bodySmall" style={styles.onlineStatus}>
                {conversation?.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 24, marginHorizontal: 8 }}>📞</Text>
          <Text style={{ fontSize: 24, marginHorizontal: 8 }}>📹</Text>
        </Surface>

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          inverted
        />

        <Surface style={styles.inputContainer} elevation={2}>
          <Text style={{ fontSize: 24, marginHorizontal: 8 }}>📎</Text>
          <TextInput
            mode="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.messageInput}
            multiline
          />
          <Text style={{ fontSize: 24, marginHorizontal: 8 }}>🎤</Text>
          <Text 
            style={{ 
              fontSize: 24, 
              marginHorizontal: 8,
              opacity: newMessage.trim() ? 1 : 0.3
            }}
            onPress={sendMessage}
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

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={item => item.id}
        style={styles.conversationsList}
        contentContainerStyle={styles.conversationsContent}
      />

      <FAB
        icon={() => <Text style={{ fontSize: 20 }}>➕</Text>}
        style={styles.fab}
        onPress={() => {
          // TODO: Start new conversation
          if (__DEV__) console.log('Start new conversation');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
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
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  chatHeaderDetails: {
    marginLeft: 12,
  },
  onlineStatus: {
    opacity: 0.6,
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
  messageContent: {
    color: '#fff',
  },
  attachmentsContainer: {
    marginTop: 8,
  },
  attachment: {
    marginBottom: 4,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 