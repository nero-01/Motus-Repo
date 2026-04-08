import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Surface,
  FAB,
  TextInput,
  SegmentedButtons,
  Portal,
  Dialog,
} from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { useFamilyStore } from '../../../../stores/familyStore';
import { useAuthStore } from '../../../../stores/authStore';
import { supabase } from '../../../../services/supabase/client';
import {
  getExpensesByFamily,
  type FamilyExpenseRow,
  type ExpenseCategory,
} from '../../../../services/supabase/expenses';

type TimeFilter = 'all' | 'this_month' | 'last_month';

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    food: '🍽️',
    transport: '🚗',
    education: '📚',
    entertainment: '🎉',
    health: '🏥',
    other: '📋',
  };
  return icons[category] || '📋';
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    food: '#795548',
    transport: '#607D8B',
    education: '#2196F3',
    entertainment: '#FF9800',
    health: '#F44336',
    other: '#666',
  };
  return colors[category] || '#666';
}

function filterByTime(rows: FamilyExpenseRow[], f: TimeFilter): FamilyExpenseRow[] {
  if (f === 'all') return rows;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (f === 'this_month') {
    return rows.filter((r) => {
      const d = new Date(r.expense_date);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }
  const lm = new Date(y, m - 1, 1);
  return rows.filter((r) => {
    const d = new Date(r.expense_date);
    return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
  });
}

function computeSummary(rows: FamilyExpenseRow[], userId: string | undefined) {
  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const thisMonth = rows
    .filter((r) => {
      const d = new Date(r.expense_date);
      return d.getFullYear() === y && d.getMonth() === m;
    })
    .reduce((s, r) => s + Number(r.amount), 0);
  const lm = new Date(y, m - 1, 1);
  const lastMonth = rows
    .filter((r) => {
      const d = new Date(r.expense_date);
      return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
    })
    .reduce((s, r) => s + Number(r.amount), 0);
  const yours = rows
    .filter((r) => r.paid_by && userId && r.paid_by === userId)
    .reduce((s, r) => s + Number(r.amount), 0);
  return {
    totalExpenses: total,
    thisMonth,
    lastMonth,
    yourShare: yours,
    theirShare: Math.max(0, total - yours),
  };
}

function payerLabel(
  paidBy: string | null,
  userId: string | undefined,
  members: { user_id: string; user?: { first_name?: string; last_name?: string; email?: string } }[]
): string {
  if (!paidBy) return 'Unknown';
  if (userId && paidBy === userId) return 'You';
  const m = members.find((x) => x.user_id === paidBy);
  if (m?.user) {
    const fn = m.user.first_name || '';
    const ln = m.user.last_name || '';
    const name = `${fn} ${ln}`.trim();
    return name || m.user.email || 'Member';
  }
  return 'Co-parent';
}

function buildReportText(rows: FamilyExpenseRow[]): string {
  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const byCat: Partial<Record<ExpenseCategory, number>> = {};
  rows.forEach((r) => {
    const a = Number(r.amount);
    byCat[r.category] = (byCat[r.category] || 0) + a;
  });
  const lines = [
    `MotusTots — expense report`,
    `Generated ${new Date().toLocaleString()}`,
    '',
    `Total: ${formatCurrency(total)}`,
    '',
    'By category:',
  ];
  (Object.entries(byCat) as [string, number][]).forEach(([k, v]) => {
    lines.push(`  ${k}: ${formatCurrency(v)}`);
  });
  lines.push('', `Count: ${rows.length} expense(s)`);
  return lines.join('\n');
}

function toCsv(rows: FamilyExpenseRow[]): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = 'title,amount,category,expense_date,description,paid_by';
  const body = rows.map((r) =>
    [
      esc(r.title),
      Number(r.amount).toFixed(2),
      r.category,
      r.expense_date,
      esc(r.description || ''),
      r.paid_by || '',
    ].join(',')
  );
  return [header, ...body].join('\n');
}

export default function ExpensesScreen() {
  const { user } = useAuthStore();
  const { currentFamily, familyMembers, children, loadFamilies } = useFamilyStore();
  const [rows, setRows] = useState<FamilyExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');

  const load = useCallback(async () => {
    if (!currentFamily) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getExpensesByFamily(currentFamily.id);
      setRows(data);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not load expenses.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [currentFamily]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  React.useEffect(() => {
    (async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (u?.id) await loadFamilies(u.id);
    })();
  }, [loadFamilies]);

  const summary = computeSummary(rows, user?.id);
  const timeFiltered = filterByTime(rows, filter);
  const filtered = searchQuery
    ? timeFiltered.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : timeFiltered;

  const openReport = () => {
    const source = searchQuery ? filtered : timeFiltered;
    if (source.length === 0) {
      Alert.alert('Report', 'No expenses in the current view.');
      return;
    }
    setReportText(buildReportText(source));
    setReportOpen(true);
  };

  const exportCsv = async () => {
    const source = searchQuery ? filtered : timeFiltered;
    if (source.length === 0) {
      Alert.alert('Export', 'No expenses to export.');
      return;
    }
    const csv = toCsv(source);
    try {
      await Share.share({
        title: 'MotusTots expenses',
        message: csv,
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Export', 'Sharing is not available on this device.');
    }
  };

  if (!currentFamily && !loading) {
    return (
      <View style={styles.centered}>
        <Text variant="titleMedium" style={styles.muted}>
          No family workspace
        </Text>
        <Text variant="bodyMedium" style={styles.hint}>
          Create a family from Home or Settings, then add shared expenses here.
        </Text>
        <Button mode="contained" onPress={() => router.push('/features/settings/family')}>
          Family setup
        </Button>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#006A60" />
        <Text style={styles.muted}>Loading expenses…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineSmall">Shared Expenses</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Track and split expenses with your co-parent
          </Text>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="titleLarge">{formatCurrency(summary.totalExpenses)}</Text>
                <Text variant="bodySmall">Total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="titleLarge">{formatCurrency(summary.thisMonth)}</Text>
                <Text variant="bodySmall">This month</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="titleLarge" style={styles.yourShare}>
                  {formatCurrency(summary.yourShare)}
                </Text>
                <Text variant="bodySmall">Paid by you</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="titleLarge" style={styles.theirShare}>
                  {formatCurrency(summary.theirShare)}
                </Text>
                <Text variant="bodySmall">Paid by others</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="titleLarge">{formatCurrency(summary.lastMonth)}</Text>
                <Text variant="bodySmall">Last month</Text>
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
            onValueChange={(v) => setFilter(v as TimeFilter)}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'this_month', label: 'This month' },
              { value: 'last_month', label: 'Last month' },
            ]}
            style={styles.filterButtons}
          />
        </View>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Expenses ({filtered.length})
        </Text>

        <View style={styles.expensesContainer}>
          {filtered.length === 0 ? (
            <Text variant="bodyMedium" style={styles.muted}>
              No expenses yet. Tap + to add one.
            </Text>
          ) : (
            filtered.map((expense) => (
              <Card key={expense.id} style={styles.expenseCard}>
                <Card.Content>
                  <View style={styles.expenseHeader}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.categoryIcon}>{getCategoryIcon(expense.category)}</Text>
                      <View style={styles.expenseDetails}>
                        <Text variant="titleMedium">{expense.title}</Text>
                        {expense.description ? (
                          <Text variant="bodySmall" style={styles.expenseDescription}>
                            {expense.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.expenseAmount}>
                      <Text variant="titleLarge" style={styles.amount}>
                        {formatCurrency(Number(expense.amount))}
                      </Text>
                      <Chip
                        mode="outlined"
                        compact
                        style={[
                          styles.statusChip,
                          { borderColor: getCategoryColor(expense.category) },
                        ]}
                      >
                        {expense.category}
                      </Chip>
                    </View>
                  </View>

                  <View style={styles.metaBlock}>
                    <View style={styles.detailRow}>
                      <Text variant="bodySmall" style={styles.detailLabel}>
                        Paid by:
                      </Text>
                      <Text variant="bodySmall" style={styles.detailValue}>
                        {payerLabel(expense.paid_by, user?.id, familyMembers)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text variant="bodySmall" style={styles.detailLabel}>
                        Date:
                      </Text>
                      <Text variant="bodySmall" style={styles.detailValue}>
                        {expense.expense_date}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        <View style={styles.actionsContainer}>
          <Button mode="contained" style={styles.actionButton} onPress={openReport}>
            Generate report
          </Button>

          <Button mode="outlined" style={styles.actionButton} onPress={() => void exportCsv()}>
            Export data (CSV)
          </Button>
        </View>
      </ScrollView>

      <FAB
        icon={() => <Text style={{ fontSize: 20 }}>➕</Text>}
        style={styles.fab}
        onPress={() => router.push('/features/co-parenting/expenses/create')}
        label="Add"
      />

      <Portal>
        <Dialog visible={reportOpen} onDismiss={() => setReportOpen(false)}>
          <Dialog.Title>Expense report</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <Dialog.Content>
              <Text selectable style={styles.reportBody}>
                {reportText}
              </Text>
            </Dialog.Content>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setReportOpen(false)}>Close</Button>
            <Button
              onPress={() => {
                void Share.share({ message: reportText, title: 'MotusTots report' });
              }}
            >
              Share
            </Button>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  hint: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
    lineHeight: 22,
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
  metaBlock: {
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
    backgroundColor: '#006A60',
  },
  muted: {
    color: '#666',
    marginTop: 8,
  },
  dialogScroll: {
    maxHeight: 360,
  },
  reportBody: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
});
