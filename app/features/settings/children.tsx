import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Card, Button, FAB, Portal, Dialog } from 'react-native-paper';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import AvatarSelector, { Avatar } from '../../../components/ui/AvatarSelector';
import { 
  getFamilyChildren, 
  addChild, 
  updateChild, 
  deleteChild,
  parseAvatarData,
  Child 
} from '../../../services/supabase/family';
import { useFamilyStore } from '../../../stores/familyStore';
import Toast, { ToastType } from '../../../components/ui/Toast';

export default function ChildrenManagementScreen() {
  const { currentFamily } = useFamilyStore();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'info',
  });

  useEffect(() => {
    loadChildren();
  }, [currentFamily]);

  const loadChildren = async () => {
    if (!currentFamily) return;
    
    try {
      setLoading(true);
      const familyChildren = await getFamilyChildren(currentFamily.id);
      
      // Parse avatar data for each child
      const childrenWithAvatars = familyChildren.map(child => ({
        ...child,
        avatar_data: parseAvatarData(child.avatar_url) || undefined,
      }));
      
      setChildren(childrenWithAvatars);
    } catch (error) {
      console.error('Error loading children:', error);
      setToast({
        visible: true,
        message: 'Failed to load children',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = () => {
    setEditingChild(null);
    setChildName('');
    setBirthDate(new Date());
    setSelectedAvatar(null);
    setModalVisible(true);
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setChildName(child.name);
    setBirthDate(new Date(child.birth_date));
    setSelectedAvatar(child.avatar_data || null);
    setModalVisible(true);
  };

  const handleDeleteChild = (child: Child) => {
    Alert.alert(
      'Delete Child',
      `Are you sure you want to delete ${child.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteChild(child.id);
              if (success) {
                setChildren(children.filter(c => c.id !== child.id));
                setToast({
                  visible: true,
                  message: `${child.name} has been removed`,
                  type: 'success',
                });
              } else {
                setToast({
                  visible: true,
                  message: 'Failed to delete child',
                  type: 'error',
                });
              }
            } catch (error) {
              console.error('Error deleting child:', error);
              setToast({
                visible: true,
                message: 'Failed to delete child',
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  const handleSaveChild = async () => {
    if (!childName.trim()) {
      setToast({
        visible: true,
        message: 'Please enter a name for the child',
        type: 'warning',
      });
      return;
    }

    if (!currentFamily) {
      setToast({
        visible: true,
        message: 'No family selected',
        type: 'error',
      });
      return;
    }

    try {
      const childData = {
        family_id: currentFamily.id,
        name: childName.trim(),
        birth_date: birthDate.toISOString().split('T')[0],
        avatar_data: selectedAvatar || undefined,
      };

      if (editingChild) {
        // Update existing child
        const updatedChild = await updateChild(editingChild.id, childData);
        if (updatedChild) {
          setChildren(children.map(c => 
            c.id === editingChild.id 
              ? { ...updatedChild, avatar_data: selectedAvatar || undefined }
              : c
          ));
          setToast({
            visible: true,
            message: `${childName} has been updated`,
            type: 'success',
          });
        } else {
          setToast({
            visible: true,
            message: 'Failed to update child',
            type: 'error',
          });
        }
      } else {
        // Add new child
        const newChild = await addChild(childData);
        if (newChild) {
          setChildren([{ ...newChild, avatar_data: selectedAvatar || undefined }, ...children]);
          setToast({
            visible: true,
            message: `${childName} has been added`,
            type: 'success',
          });
        } else {
          setToast({
            visible: true,
            message: 'Failed to add child',
            type: 'error',
          });
        }
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Error saving child:', error);
      setToast({
        visible: true,
        message: 'Failed to save child',
        type: 'error',
      });
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading children...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Family Children</Text>
          <Text style={styles.subtitle}>
            Manage your children's profiles and avatars
          </Text>
        </View>

        {children.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyTitle}>No Children Added</Text>
              <Text style={styles.emptyText}>
                Add your children to get started with personalized features
              </Text>
            </Card.Content>
          </Card>
        ) : (
          children.map((child) => (
            <Card key={child.id} style={styles.childCard}>
              <Card.Content>
                <View style={styles.childHeader}>
                  <AvatarSelector
                    selectedAvatar={child.avatar_data}
                    onSelectAvatar={() => {}} // Read-only in list
                    size={60}
                    showSelector={false}
                  />
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childAge}>
                      {calculateAge(child.birth_date)} years old
                    </Text>
                    <Text style={styles.childBirthDate}>
                      Born {new Date(child.birth_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.childActions}>
                    <TouchableOpacity
                      onPress={() => handleEditChild(child)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteChild(child)}
                      style={[styles.actionButton, styles.deleteButton]}
                    >
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddChild}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingChild ? 'Edit Child' : 'Add Child'}
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Child Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={childName}
                  onChangeText={setChildName}
                  placeholder="Enter child's name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Birth Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {birthDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Avatar</Text>
                <View style={styles.avatarSection}>
                  <AvatarSelector
                    selectedAvatar={selectedAvatar}
                    onSelectAvatar={setSelectedAvatar}
                    size={80}
                  />
                  <Text style={styles.avatarHint}>
                    Choose an avatar for {childName || 'your child'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              mode="outlined"
              onPress={() => setModalVisible(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveChild}
              style={styles.saveButton}
            >
              {editingChild ? 'Update' : 'Add Child'}
            </Button>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={birthDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setBirthDate(selectedDate);
            }
          }}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  emptyCard: {
    margin: 16,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  childCard: {
    margin: 16,
    marginBottom: 8,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
    marginLeft: 16,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  childAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  childBirthDate: {
    fontSize: 12,
    color: '#999',
  },
  childActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#006A60',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  deleteButtonText: {
    color: 'white',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#006A60',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  avatarHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#006A60',
  },
});
