import { supabase } from './client';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'education'
  | 'entertainment'
  | 'health'
  | 'other';

export interface FamilyExpenseRow {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  amount: number;
  category: ExpenseCategory;
  child_id: string | null;
  paid_by: string | null;
  expense_date: string;
  created_at: string;
}

export async function getExpensesByFamily(familyId: string): Promise<FamilyExpenseRow[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('family_id', familyId)
    .order('expense_date', { ascending: false });

  if (error) throw error;
  return (data || []) as FamilyExpenseRow[];
}

export async function createFamilyExpense(input: {
  family_id: string;
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategory;
  expense_date: string;
  child_id?: string | null;
  paid_by: string;
}): Promise<FamilyExpenseRow> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      family_id: input.family_id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      amount: input.amount,
      category: input.category,
      expense_date: input.expense_date,
      child_id: input.child_id ?? null,
      paid_by: input.paid_by,
    })
    .select()
    .single();

  if (error) throw error;
  return data as FamilyExpenseRow;
}
