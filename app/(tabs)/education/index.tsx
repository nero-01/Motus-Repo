import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { WORKSHEETS, type Worksheet } from './worksheetsData';
import { getEducationLevel, setEducationLevel, MIN_LEVEL, MAX_LEVEL, clampLevel } from './educationLevel';

interface EducationStats {
  totalWorksheets: number;
  currentLevel: number;
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'math', label: 'Math' },
  { value: 'reading', label: 'Reading' },
  { value: 'writing', label: 'Writing' },
  { value: 'science', label: 'Science' },
  { value: 'art', label: 'Art' },
  { value: 'social_studies', label: 'Social' },
];

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'math': return '🔢';
    case 'reading': return '📖';
    case 'writing': return '✏️';
    case 'science': return '🔬';
    case 'art': return '🎨';
    case 'social_studies': return '🌍';
    default: return '📚';
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'math': return '#FF6B6B';
    case 'reading': return '#4ECDC4';
    case 'writing': return '#45B7D1';
    case 'science': return '#96CEB4';
    case 'art': return '#FFEAA7';
    case 'social_studies': return '#DDA0DD';
    default: return '#95A5A6';
  }
}

export default function EducationScreen() {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stats, setStats] = useState<EducationStats | null>(null);
  const [educationLevel, setEducationLevelState] = useState<number>(MIN_LEVEL);
  const { width } = useWindowDimensions();

  const loadData = async () => {
    try {
      setLoading(true);
      const [level] = await Promise.all([
        getEducationLevel(),
        new Promise<void>((r) => setTimeout(r, 200)),
      ]);
      setEducationLevelState(level);
      setWorksheets(WORKSHEETS);
      setStats({ totalWorksheets: WORKSHEETS.length, currentLevel: level });
    } catch (e) {
      console.error('Education load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleLevelChange = async (level: number) => {
    const clamped = clampLevel(level);
    setEducationLevelState(clamped);
    setStats((prev) => (prev ? { ...prev, currentLevel: clamped } : null));
    await setEducationLevel(clamped);
  };

  const filtered = worksheets.filter((w) =>
    selectedCategory === 'all' || w.category === selectedCategory
  );

  const openWorksheet = (worksheet: Worksheet) => {
    router.push({
      pathname: '/education/worksheet',
      params: { id: worksheet.id, _t: String(Date.now()), level: String(educationLevel) },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006A60" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const padding = 16;
  const gap = 12;
  const tileWidth = (width - padding * 2 - gap) / 2;
  const tileHeight = tileWidth * 0.95;

  return (
    <View style={styles.container}>
      {/* Compact header */}
      <View style={styles.header}>
        <Text style={styles.title}>📚 Learning</Text>
        {stats && (
          <Text style={styles.subtitle}>
            {stats.totalWorksheets} activities · Level {educationLevel} of {MAX_LEVEL}
          </Text>
        )}
      </View>

      {/* Level selector: choose your comfort level (1–10) */}
      <View style={styles.levelSection}>
        <Text style={styles.levelLabel}>Your level (tap to change)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelChips}
        >
          {Array.from({ length: MAX_LEVEL - MIN_LEVEL + 1 }, (_, i) => MIN_LEVEL + i).map((lvl) => {
            const active = educationLevel === lvl;
            return (
              <TouchableOpacity
                key={lvl}
                style={[styles.levelChip, active && styles.levelChipActive]}
                onPress={() => handleLevelChange(lvl)}
                activeOpacity={0.8}
              >
                <Text style={[styles.levelChipText, active && styles.levelChipTextActive]}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Single row of category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {CATEGORIES.map((c) => {
          const active = selectedCategory === c.value;
          return (
            <TouchableOpacity
              key={c.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSelectedCategory(c.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Worksheet grid – main content, minimal scroll */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
      >
        <View style={styles.grid}>
          {filtered.map((worksheet) => {
            const icon = getCategoryIcon(worksheet.category);
            const color = getCategoryColor(worksheet.category);
            return (
              <TouchableOpacity
                key={worksheet.id}
                style={[styles.tile, { width: tileWidth, height: tileHeight }]}
                onPress={() => openWorksheet(worksheet)}
                activeOpacity={0.85}
              >
                <View style={[styles.tileIconWrap, { backgroundColor: color }]}>
                  <Text style={styles.tileIcon}>{icon}</Text>
                </View>
                <Text style={styles.tileTitle} numberOfLines={2}>
                  {worksheet.title}
                </Text>
                <Text style={styles.tilePlay}>Play →</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#006A60',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  chipsScroll: {
    maxHeight: 44,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  chipsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  chipActive: {
    backgroundColor: '#006A60',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  chipTextActive: {
    color: '#fff',
  },
  levelSection: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  levelLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  levelChips: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  levelChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelChipActive: {
    backgroundColor: '#006A60',
  },
  levelChipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#555',
  },
  levelChipTextActive: {
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    alignContent: 'flex-start',
  },
  tile: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tileIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileIcon: {
    fontSize: 28,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  tilePlay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006A60',
  },
});
