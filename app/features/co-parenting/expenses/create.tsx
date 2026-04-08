import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, TextInput, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../../../services/supabase/client';
import { createFamilyExpense, type ExpenseCategory } from '../../../../services/supabase/expenses';
import { useFamilyStore } from '../../../../stores/familyStore';

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' },
];

export default function AddExpenseScreen() {
  const { currentFamily, children } = useFamilyStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [childId, setChildId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!currentFamily) {
      Alert.alert('No family', 'Create a family from Home or Settings first.');
      return;
    }
    const n = parseFloat(amount.replace(',', '.'));
    if (!title.trim() || Number.isNaN(n) || n <= 0) {
      Alert.alert('Check fields', 'Enter a title and a valid amount.');
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Sign in', 'You must be signed in.');
      return;
    }
    setSubmitting(true);
    try {
      await createFamilyExpense({
        family_id: currentFamily.id,
        title,
        description: description.trim() || undefined,
        amount: n,
        category,
        expense_date: expenseDate.toISOString().slice(0, 10),
        child_id: childId,
        paid_by: user.id,
      });
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save expense. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="titleMedium" style={styles.section}>
        Details
      </Text>
      <TextInput
        mode="outlined"
        label="Title *"
        value={title}
        onChangeText={setTitle}
        style={styles.field}
      />
      <TextInput
        mode="outlined"
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        style={styles.field}
      />
      <TextInput
        mode="outlined"
        label="Amount *"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        style={styles.field}
      />

      <Text variant="labelLarge" style={styles.label}>
        Category
      </Text>
      <View style={styles.chips}>
        {CATEGORY_OPTIONS.map((c) => (
          <Chip
            key={c.value}
            selected={category === c.value}
            onPress={() => setCategory(c.value)}
            style={styles.chip}
          >
            {c.label}
          </Chip>
        ))}
      </View>

      <Text variant="labelLarge" style={styles.label}>
        Expense date
      </Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
        <Text variant="bodyLarge">{expenseDate.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker ? (
        <DateTimePicker
          value={expenseDate}
          mode="date"
          display="default"
          onChange={(_, d) => {
            setShowDatePicker(false);
            if (d) setExpenseDate(d);
          }}
          maximumDate={new Date()}
        />
      ) : null}

      {children.length > 0 ? (
        <>
          <Text variant="labelLarge" style={styles.label}>
            Related child (optional)
          </Text>
          <View style={styles.chips}>
            <Chip selected={childId === null} onPress={() => setChildId(null)} style={styles.chip}>
              None
            </Chip>
            {children.map((ch) => (
              <Chip
                key={ch.id}
                selected={childId === ch.id}
                onPress={() => setChildId(ch.id)}
                style={styles.chip}
              >
                {ch.name}
              </Chip>
            ))}
          </View>
        </>
      ) : null}

      <Button
        mode="contained"
        onPress={() => void handleSave()}
        loading={submitting}
        disabled={submitting}
        style={styles.save}
        buttonColor="#006A60"
      >
        Save expense
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginBottom: 4,
  },
  dateBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  save: {
    marginTop: 24,
  },
});
