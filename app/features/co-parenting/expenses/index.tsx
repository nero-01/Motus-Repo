import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Chip, Surface, Avatar, FAB, TextInput, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';

interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  paidBy: string;
  splitPercentage: number;
  date: string;
  receiptUrl?: string;
  isApproved: boolean;
  tags: string[];
}

interface ExpenseSummary {
  totalExpenses: number;
  pendingApproval: number;
  yourShare: number;
  theirShare: number;
  thisMonth: number;
  lastMonth: number;
}

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      title: 'School Supplies',
      description: 'Backpack, notebooks, pencils for Emma',
      amount: 85.50,
      category: 'education',
      paidBy: 'John',
      splitPercentage: 50,
      date: '2024-01-15',
      isApproved: true,
      tags: ['school', 'back-to-school']
    },
    {
      id: '2',
      title: 'Dentist Appointment',
      description: 'Regular checkup for Liam',
      amount: 120.00,
      category: 'healthcare',
      paidBy: 'Sarah',
      splitPercentage: 50,
      date: '2024-01-12',
      isApproved: false,
      tags: ['medical', 'dental']
    },
    {
      id: '3',
      title: 'Soccer Registration',
      description: 'Spring season registration fee',
      amount: 150.00,
      category: 'activities',
      paidBy: 'John',
      splitPercentage: 50,
      date: '2024-01-10',
      isApproved: true,
      tags: ['sports', 'registration']
    },
    {
      id: '4',
      title: 'Birthday Party Supplies',
      description: 'Decorations and cake for Emma\'s party',
      amount: 65.25,
      category: 'entertainment',
      paidBy: 'Sarah',
      splitPercentage: 50,
      date: '2024-01-08',
      isApproved: true,
      tags: ['birthday', 'party']
    }
  ]);

  const [summary, setSummary] = useState<ExpenseSummary>({
    totalExpenses: 420.75,
    pendingApproval: 120.00,
    yourShare: 210.38,
    theirShare: 210.37,
    thisMonth: 420.75,
    lastMonth: 385.50
  });

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryIcon = (category: string) => {
    const icons = {
      education: '📚',
      healthcare: '🏥',
      activities: '⚽',
      entertainment: '🎉',
      clothing: '👕',
      food: '🍽️',
      transportation: '🚗',
      other: '📋'
    };
    return icons[category as keyof typeof icons] || '📋';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      education: '#2196F3',
      healthcare: '#F44336',
      activities: '#4CAF50',
      entertainment: '#FF9800',
      clothing: '#9C27B0',
      food: '#795548',
      transportation: '#607D8B',
      other: '#666'
    };
    return colors[category as keyof typeof colors] || '#666';
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getFilteredExpenses = () => {
    let filtered = expenses;
    
    if (filter === 'pending') {
      filtered = filtered.filter(expense => !expense.isApproved);
    } else if (filter === 'approved') {
      filtered = filtered.filter(expense => expense.isApproved);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(expense => 
        expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const approveExpense = (expenseId: string) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === expenseId 
        ? { ...expense, isApproved: true }
        : expense
    ));
  };

  const filteredExpenses = getFilteredExpenses();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineSmall">Shared Expenses</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Track and split expenses with co-parent
          </Text>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="titleLarge">{formatCurrency(summary.totalExpenses)}</Text>
                <Text variant="bodySmall">Total Expenses</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="titleLarge">{formatCurrency(summary.pendingApproval)}</Text>
                <Text variant="bodySmall">Pending Approval</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="titleLarge" style={styles.yourShare}>
                  {formatCurrency(summary.yourShare)}
                </Text>
                <Text variant="bodySmall">Your Share</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="titleLarge" style={styles.theirShare}>
                  {formatCurrency(summary.theirShare)}
                </Text>
                <Text variant="bodySmall">Their Share</Text>
              </View>
            </View>
          </View>
        </Surface>

        <View style={styles.filtersContainer}>
          <TextInput
            mode="outlined"
            placeholder="Search expenses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            left={<Text style={{ fontSize: 20, color: '#666' }}>🔍</Text>}
          />
          
          <SegmentedButtons
            value={filter}
            onValueChange={setFilter}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' }
            ]}
            style={styles.filterButtons}
          />
        </View>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Recent Expenses
        </Text>

        <View style={styles.expensesContainer}>
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} style={styles.expenseCard}>
              <Card.Content>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.categoryIcon}>
                      {getCategoryIcon(expense.category)}
                    </Text>
                    <View style={styles.expenseDetails}>
                      <Text variant="titleMedium">{expense.title}</Text>
                      <Text variant="bodySmall" style={styles.expenseDescription}>
                        {expense.description}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.expenseAmount}>
                    <Text variant="titleLarge" style={styles.amount}>
                      {formatCurrency(expense.amount)}
                    </Text>
                    <Chip 
                      mode="outlined" 
                      compact
                      style={[
                        styles.statusChip, 
                        { backgroundColor: expense.isApproved ? '#4CAF50' + '20' : '#FF9800' + '20' }
                      ]}
                    >
                      {expense.isApproved ? 'Approved' : 'Pending'}
                    </Chip>
                  </View>
                </View>

                <View style={styles.expenseDetails}>
                  <View style={styles.detailRow}>
                    <Text variant="bodySmall" style={styles.detailLabel}>Paid by:</Text>
                    <Text variant="bodySmall" style={styles.detailValue}>
                      {expense.paidBy}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text variant="bodySmall" style={styles.detailLabel}>Split:</Text>
                    <Text variant="bodySmall" style={styles.detailValue}>
                      {expense.splitPercentage}% each
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text variant="bodySmall" style={styles.detailLabel}>Date:</Text>
                    <Text variant="bodySmall" style={styles.detailValue}>
                      {expense.date}
                    </Text>
                  </View>
                </View>

                <View style={styles.tagsContainer}>
                  {expense.tags.map((tag, index) => (
                    <Chip key={index} mode="outlined" compact style={styles.tag}>
                      {tag}
                    </Chip>
                  ))}
                </View>
              </Card.Content>
              <Card.Actions>
                {!expense.isApproved && (
                  <Button 
                    mode="contained-tonal" 
                    compact
                    onPress={() => approveExpense(expense.id)}
                  >
                    Approve
                  </Button>
                )}
                <Button mode="outlined" compact>
                  View Receipt
                </Button>
                <Button mode="outlined" compact>
                  Edit
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>

        <View style={styles.actionsContainer}>
          <Button 
            mode="contained" 
            style={styles.actionButton}
            onPress={() => {
              // TODO: Generate report
              if (__DEV__) console.log('Generate report');
            }}
          >
            Generate Report
          </Button>
          
          <Button 
            mode="outlined" 
            style={styles.actionButton}
            onPress={() => {
              // TODO: Export data
              if (__DEV__) console.log('Export data');
            }}
          >
            Export Data
          </Button>
        </View>
      </ScrollView>

      <FAB
        icon={() => <Text style={{ fontSize: 20 }}>➕</Text>}
        style={styles.fab}
        onPress={() => {
          // TODO: Navigate to add expense screen
          if (__DEV__) console.log('Add new expense');
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
    marginBottom: 16,
    opacity: 0.7,
  },
  summaryContainer: {
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  yourShare: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  theirShare: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  filtersContainer: {
    marginBottom: 24,
  },
  searchInput: {
    marginBottom: 12,
  },
  filterButtons: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  expensesContainer: {
    gap: 16,
    marginBottom: 24,
  },
  expenseCard: {
    marginBottom: 8,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  expenseInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    opacity: 0.6,
    marginTop: 2,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusChip: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 80,
    opacity: 0.7,
  },
  detailValue: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    marginRight: 4,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 