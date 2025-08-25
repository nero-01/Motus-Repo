import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';

export interface Avatar {
  id: string;
  emoji: string;
  name: string;
  color: string;
}

const DEFAULT_AVATARS: Avatar[] = [
  { id: '1', emoji: '👶', name: 'Baby', color: '#FFB3BA' },
  { id: '2', emoji: '🧒', name: 'Child', color: '#BAE1FF' },
  { id: '3', emoji: '👧', name: 'Girl', color: '#FFB3D9' },
  { id: '4', emoji: '👦', name: 'Boy', color: '#B3FFBA' },
  { id: '5', emoji: '🦄', name: 'Unicorn', color: '#E1B3FF' },
  { id: '6', emoji: '🐱', name: 'Cat', color: '#FFD9B3' },
  { id: '7', emoji: '🐶', name: 'Dog', color: '#B3D9FF' },
  { id: '8', emoji: '🐼', name: 'Panda', color: '#FFE1B3' },
  { id: '9', emoji: '🦁', name: 'Lion', color: '#FFB3B3' },
  { id: '10', emoji: '🐸', name: 'Frog', color: '#B3FFB3' },
  { id: '11', emoji: '🐙', name: 'Octopus', color: '#FFB3E1' },
  { id: '12', emoji: '🦋', name: 'Butterfly', color: '#E1B3FF' },
  { id: '13', emoji: '🌟', name: 'Star', color: '#FFFFB3' },
  { id: '14', emoji: '🌈', name: 'Rainbow', color: '#B3FFFF' },
  { id: '15', emoji: '🚀', name: 'Rocket', color: '#FFB3A6' },
  { id: '16', emoji: '🎈', name: 'Balloon', color: '#B3A6FF' },
];

interface AvatarSelectorProps {
  selectedAvatar?: Avatar | null;
  onSelectAvatar: (avatar: Avatar) => void;
  size?: number;
  showSelector?: boolean;
  onPress?: () => void;
}

export default function AvatarSelector({
  selectedAvatar,
  onSelectAvatar,
  size = 60,
  showSelector = true,
  onPress,
}: AvatarSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleAvatarPress = () => {
    if (showSelector) {
      setModalVisible(true);
    } else if (onPress) {
      onPress();
    }
  };

  const handleSelectAvatar = (avatar: Avatar) => {
    onSelectAvatar(avatar);
    setModalVisible(false);
  };

  const currentAvatar = selectedAvatar || DEFAULT_AVATARS[0];

  return (
    <>
      <TouchableOpacity
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            backgroundColor: currentAvatar.color,
          },
        ]}
        onPress={handleAvatarPress}
      >
        <Text style={[styles.avatarEmoji, { fontSize: size * 0.5 }]}>
          {currentAvatar.emoji}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Avatar</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.avatarGrid}>
              {DEFAULT_AVATARS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarOption,
                    {
                      backgroundColor: avatar.color,
                      borderColor: selectedAvatar?.id === avatar.id ? '#006A60' : 'transparent',
                      borderWidth: selectedAvatar?.id === avatar.id ? 3 : 0,
                    },
                  ]}
                  onPress={() => handleSelectAvatar(avatar)}
                >
                  <Text style={styles.avatarOptionEmoji}>{avatar.emoji}</Text>
                  <Text style={styles.avatarOptionName}>{avatar.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarEmoji: {
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  avatarGrid: {
    flex: 1,
  },
  avatarOption: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarOptionEmoji: {
    fontSize: 32,
    textAlign: 'center',
  },
  avatarOptionName: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
});
