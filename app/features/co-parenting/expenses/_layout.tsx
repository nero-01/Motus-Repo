import { Stack } from 'expo-router';

export default function CoParentingExpensesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Shared Expenses',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Add expense',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
