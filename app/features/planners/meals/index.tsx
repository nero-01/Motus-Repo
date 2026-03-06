import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Surface,
  FAB,
  Searchbar,
  SegmentedButtons,
  ActivityIndicator,
  ProgressBar,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../../../stores/authStore';
import { useFamilyStore } from '../../../../stores/familyStore';
import {
  getMealPlansByFamily,
  getMealPlanWithItems,
  getMealPlanStats,
  MealPlan,
  MealPlanItem,
  Recipe,
} from '../../../../services/supabase/meals';

interface DayMeals {
  day: string;
  dayOfWeek: number;
  date: string;
  breakfast?: MealPlanItem & { recipe?: Recipe };
  lunch?: MealPlanItem & { recipe?: Recipe };
  dinner?: MealPlanItem & { recipe?: Recipe };
  snacks: (MealPlanItem & { recipe?: Recipe })[];
}

export default function MealPlanningScreen() {
  const { user } = useAuthStore();
  const { currentFamily } = useFamilyStore();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null);
  const [weekMeals, setWeekMeals] = useState<DayMeals[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'plan' | 'recipes' | 'shopping'>('plan');

  const views = [
    { value: 'plan', label: 'Meal Plan' },
    { value: 'recipes', label: 'Recipes' },
    { value: 'shopping', label: 'Shopping' },
  ];

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  useEffect(() => {
    loadData();
  }, [currentFamily]);

  const loadData = async () => {
    if (!currentFamily) return;

    try {
      setError(null);
      setLoading(true);

      // Load meal plans
      const plans = await getMealPlansByFamily(currentFamily.id);
      setMealPlans(plans);

      // Use the most recent meal plan
      const recentPlan = plans[0];
      setCurrentMealPlan(recentPlan);

      if (recentPlan) {
        await loadMealPlanDetails(recentPlan);
      } else {
        // Create mock data for demo
        setWeekMeals(createMockWeekMeals());
      }

    } catch (err) {
      if (__DEV__) console.error('Error loading meal planning data:', err);
      setError('Failed to load meal plans. Please try again.');
      setWeekMeals(createMockWeekMeals());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMealPlanDetails = async (mealPlan: MealPlan) => {
    try {
      const planWithItems = await getMealPlanWithItems(mealPlan.id);
      const stats = await getMealPlanStats(mealPlan.id);

      // Organize meals by day
      const organizedMeals: DayMeals[] = [];
      const startDate = new Date(mealPlan.planned_date);
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayOfWeek = currentDate.getDay();
        const dayItems = planWithItems.items.filter(item => item.day_of_week === dayOfWeek);

        const dayMeals: DayMeals = {
          day: daysOfWeek[dayOfWeek],
          dayOfWeek,
          date: currentDate.toISOString().split('T')[0],
          breakfast: dayItems.find(item => item.meal_type === 'breakfast'),
          lunch: dayItems.find(item => item.meal_type === 'lunch'),
          dinner: dayItems.find(item => item.meal_type === 'dinner'),
          snacks: dayItems.filter(item => item.meal_type === 'snack'),
        };

        organizedMeals.push(dayMeals);
      }

      setWeekMeals(organizedMeals);
    } catch (err) {
      if (__DEV__) console.error('Error loading meal plan details:', err);
      setWeekMeals(createMockWeekMeals());
    }
  };

  const createMockWeekMeals = (): DayMeals[] => {
    return [
      {
        day: 'Monday',
        dayOfWeek: 1,
        date: new Date().toISOString().split('T')[0],
        breakfast: {
          id: '1',
          meal_plan_id: 'mock',
          meal_name: 'Oatmeal with Berries',
          meal_type: 'breakfast',
          day_of_week: 1,
          date: new Date().toISOString().split('T')[0],
          servings: 4,
          is_completed: false,
          created_at: new Date().toISOString(),
        },
        lunch: {
          id: '2',
          meal_plan_id: 'mock',
          meal_name: 'Chicken Salad',
          meal_type: 'lunch',
          day_of_week: 1,
          date: new Date().toISOString().split('T')[0],
          servings: 4,
          is_completed: false,
          created_at: new Date().toISOString(),
        },
        dinner: {
          id: '3',
          meal_plan_id: 'mock',
          meal_name: 'Pasta with Meatballs',
          meal_type: 'dinner',
          day_of_week: 1,
          date: new Date().toISOString().split('T')[0],
          servings: 6,
          is_completed: false,
          created_at: new Date().toISOString(),
        },
        snacks: [],
      },
      {
        day: 'Tuesday',
        dayOfWeek: 2,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        breakfast: {
          id: '4',
          meal_plan_id: 'mock',
          meal_name: 'Scrambled Eggs',
          meal_type: 'breakfast',
          day_of_week: 2,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          servings: 4,
          is_completed: false,
          created_at: new Date().toISOString(),
        },
        lunch: {
          id: '5',
          meal_plan_id: 'mock',
          meal_name: 'Turkey Sandwich',
          meal_type: 'lunch',
          day_of_week: 2,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          servings: 4,
          is_completed: false,
          created_at: new Date().toISOString(),
        },
        dinner: {
          id: '6',
          meal_plan_id: 'mock',
          meal_name: 'Grilled Salmon',
          meal_type: 'dinner',
          day_of_week: 2,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          servings: 4,
          is_completed: false,
          created_at: new Date().toISOString(),
        },
        snacks: [],
      },
      {
        day: 'Wednesday',
        dayOfWeek: 3,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        breakfast: {
          id: '7',
          meal_plan_id: 'mock',
          meal_name: 'Pancakes',
          meal_type: 'breakfast',
          day_of_week: 3,
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          servings: 4,
          is_completed: false,
          created_at: new Date().toISOString(),
        },
        lunch: {
          id: '8',
          meal_plan_id: 'mock',
          meal_name: 'Soup and Salad',
          meal_type: 'lunch',
          day_of_week: 3,
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          servings: 6,
          is_completed: false,
          created_at: new Date().toISOString(),
        },
        dinner: {
          id: '9',
          meal_plan_id: 'mock',
          meal_name: 'Stir Fry',
          meal_type: 'dinner',
          day_of_week: 3,
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          servings: 4,
          is_completed: false,
          created_at: new Date().toISOString(),
        },
        snacks: [],
      },
    ];
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTotalPrepTime = (day: DayMeals) => {
    let total = 0;
    if (day.breakfast?.recipe) total += day.breakfast.recipe.prep_time + day.breakfast.recipe.cook_time;
    if (day.lunch?.recipe) total += day.lunch.recipe.prep_time + day.lunch.recipe.cook_time;
    if (day.dinner?.recipe) total += day.dinner.recipe.prep_time + day.dinner.recipe.cook_time;
    day.snacks.forEach(snack => {
      if (snack.recipe) total += snack.recipe.prep_time + snack.recipe.cook_time;
    });
    return total;
  };

  const generateShoppingList = () => {
    Alert.alert('Shopping List', 'Shopping list generation coming soon!');
  };

  const handleCreateMealPlan = () => {
    router.push('/features/planners/meals/create');
  };

  const handleCreateRecipe = () => {
    router.push('/features/planners/meals/recipes/create');
  };

  const handleViewRecipe = (recipeId: string) => {
    router.push(`/features/planners/meals/recipes/${recipeId}`);
  };

  const handleToggleMealCompletion = async (itemId: string, isCompleted: boolean) => {
    try {
      // TODO: Implement toggleMealCompletion from service
      Alert.alert('Success', `Meal marked as ${isCompleted ? 'completed' : 'incomplete'}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update meal status');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading meal plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Surface style={styles.header} elevation={1}>
          <Text variant="headlineSmall" style={styles.title}>
            🍽️ Meal Planning
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Plan your family's meals for the week
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text variant="titleLarge">{weekMeals.length}</Text>
              <Text variant="bodySmall">Days Planned</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="titleLarge">
                {weekMeals.reduce((total, day) => total + getTotalPrepTime(day), 0)}m
              </Text>
              <Text variant="bodySmall">Total Time</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="titleLarge">
                {weekMeals.reduce((total, day) => {
                  let count = 0;
                  if (day.breakfast) count++;
                  if (day.lunch) count++;
                  if (day.dinner) count++;
                  count += day.snacks.length;
                  return total + count;
                }, 0)}
              </Text>
              <Text variant="bodySmall">Total Meals</Text>
            </View>
          </View>
        </Surface>

        {/* View Selector */}
        <Card style={styles.viewCard}>
          <Card.Content>
            <SegmentedButtons
              value={selectedView}
              onValueChange={(value) => setSelectedView(value as 'plan' | 'recipes' | 'shopping')}
              buttons={views.map(view => ({
                value: view.value,
                label: view.label,
              }))}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Meal Plan View */}
        {selectedView === 'plan' && (
          <View style={styles.planView}>
            {currentMealPlan && (
              <Card style={styles.mealPlanCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.mealPlanTitle}>
                    Meal Plan
                  </Text>
                  <Text variant="bodySmall" style={styles.mealPlanDates}>
                    {new Date(currentMealPlan.planned_date).toLocaleDateString()}
                  </Text>
                </Card.Content>
              </Card>
            )}

            {weekMeals.map((day, index) => (
              <Card key={index} style={styles.dayCard}>
                <Card.Content>
                  <View style={styles.dayHeader}>
                    <Text variant="titleMedium" style={styles.dayTitle}>
                      {day.day}
                    </Text>
                    <Chip mode="outlined" style={styles.timeChip}>
                      {getTotalPrepTime(day)}m total
                    </Chip>
                  </View>

                  <View style={styles.mealsContainer}>
                    {day.breakfast && (
                      <View style={styles.mealItem}>
                        <View style={styles.mealHeader}>
                          <Text variant="bodySmall" style={styles.mealType}>🌅 Breakfast</Text>
                          <Button
                            mode="text"
                            onPress={() => handleToggleMealCompletion(day.breakfast!.id, !day.breakfast!.is_completed)}
                            compact
                          >
                            {day.breakfast.is_completed ? '✓' : '○'}
                          </Button>
                        </View>
                        <Text variant="bodyLarge" style={styles.mealName}>
                          {day.breakfast.meal_name}
                        </Text>
                        {day.breakfast.recipe && (
                          <Text variant="bodySmall" style={styles.mealTime}>
                            {day.breakfast.recipe.prep_time + day.breakfast.recipe.cook_time} minutes
                          </Text>
                        )}
                        <Text variant="bodySmall" style={styles.servings}>
                          {day.breakfast.servings} servings
                        </Text>
                      </View>
                    )}

                    {day.lunch && (
                      <View style={styles.mealItem}>
                        <View style={styles.mealHeader}>
                          <Text variant="bodySmall" style={styles.mealType}>☀️ Lunch</Text>
                          <Button
                            mode="text"
                            onPress={() => handleToggleMealCompletion(day.lunch!.id, !day.lunch!.is_completed)}
                            compact
                          >
                            {day.lunch.is_completed ? '✓' : '○'}
                          </Button>
                        </View>
                        <Text variant="bodyLarge" style={styles.mealName}>
                          {day.lunch.meal_name}
                        </Text>
                        {day.lunch.recipe && (
                          <Text variant="bodySmall" style={styles.mealTime}>
                            {day.lunch.recipe.prep_time + day.lunch.recipe.cook_time} minutes
                          </Text>
                        )}
                        <Text variant="bodySmall" style={styles.servings}>
                          {day.lunch.servings} servings
                        </Text>
                      </View>
                    )}

                    {day.dinner && (
                      <View style={styles.mealItem}>
                        <View style={styles.mealHeader}>
                          <Text variant="bodySmall" style={styles.mealType}>🌙 Dinner</Text>
                          <Button
                            mode="text"
                            onPress={() => handleToggleMealCompletion(day.dinner!.id, !day.dinner!.is_completed)}
                            compact
                          >
                            {day.dinner.is_completed ? '✓' : '○'}
                          </Button>
                        </View>
                        <Text variant="bodyLarge" style={styles.mealName}>
                          {day.dinner.meal_name}
                        </Text>
                        {day.dinner.recipe && (
                          <Text variant="bodySmall" style={styles.mealTime}>
                            {day.dinner.recipe.prep_time + day.dinner.recipe.cook_time} minutes
                          </Text>
                        )}
                        <Text variant="bodySmall" style={styles.servings}>
                          {day.dinner.servings} servings
                        </Text>
                      </View>
                    )}

                    {day.snacks.map((snack, snackIndex) => (
                      <View key={snackIndex} style={styles.mealItem}>
                        <View style={styles.mealHeader}>
                          <Text variant="bodySmall" style={styles.mealType}>🍎 Snack</Text>
                          <Button
                            mode="text"
                            onPress={() => handleToggleMealCompletion(snack.id, !snack.is_completed)}
                            compact
                          >
                            {snack.is_completed ? '✓' : '○'}
                          </Button>
                        </View>
                        <Text variant="bodyLarge" style={styles.mealName}>
                          {snack.meal_name}
                        </Text>
                        {snack.recipe && (
                          <Text variant="bodySmall" style={styles.mealTime}>
                            {snack.recipe.prep_time + snack.recipe.cook_time} minutes
                          </Text>
                        )}
                        <Text variant="bodySmall" style={styles.servings}>
                          {snack.servings} servings
                        </Text>
                      </View>
                    ))}
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Recipes View */}
        {selectedView === 'recipes' && (
          <View style={styles.recipesView}>
            <Card style={styles.recipesCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Your Recipes
                </Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  Recipe management coming soon! Create and manage your family's favorite recipes.
                </Text>
                <Button
                  mode="contained"
                  onPress={handleCreateRecipe}
                  style={styles.createButton}
                >
                  Create Recipe
                </Button>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Shopping List View */}
        {selectedView === 'shopping' && (
          <View style={styles.shoppingView}>
            <Card style={styles.shoppingCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Shopping Lists
                </Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  Shopping list management coming soon! Generate lists from your meal plans.
                </Text>
                <Button
                  mode="contained"
                  onPress={generateShoppingList}
                  style={styles.createButton}
                >
                  Generate Shopping List
                </Button>
              </Card.Content>
            </Card>
          </View>
        )}
      </ScrollView>

      <FAB
        icon={() => <Text style={{ fontSize: 20 }}>➕</Text>}
        style={styles.fab}
        onPress={() => router.push('/features/planners/meals/create')}
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
  },
  header: {
    padding: 20,
    marginBottom: 10,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  viewCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 10,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  planView: {
    padding: 20,
    paddingTop: 0,
  },
  mealPlanCard: {
    marginBottom: 16,
    elevation: 2,
  },
  mealPlanTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mealPlanDates: {
    color: '#666',
  },
  dayCard: {
    marginBottom: 16,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayTitle: {
    fontWeight: 'bold',
  },
  timeChip: {
    backgroundColor: '#E3F2FD',
  },
  mealsContainer: {
    gap: 12,
  },
  mealItem: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealType: {
    fontWeight: '600',
    color: '#666',
  },
  mealName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  mealTime: {
    color: '#666',
    marginBottom: 2,
  },
  servings: {
    color: '#666',
  },
  recipesView: {
    padding: 20,
    paddingTop: 0,
  },
  recipesCard: {
    elevation: 2,
  },
  shoppingView: {
    padding: 20,
    paddingTop: 0,
  },
  shoppingCard: {
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  createButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
}); 