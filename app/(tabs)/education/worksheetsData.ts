export interface Worksheet {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  age_range: string;
  estimated_time: number;
  type: string;
  content?: Record<string, unknown>;
  image_url?: string;
}

/** Difficulty is 1–10. Higher = more challenging content for that activity type. */
export const WORKSHEETS: Worksheet[] = [
  {
    id: '1',
    title: 'Letter Tracing - ABC',
    description: 'Practice tracing uppercase and lowercase letters',
    category: 'writing',
    difficulty: 1,
    age_range: '3-5',
    estimated_time: 10,
    type: 'letter_tracing',
    content: {
      letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
      instructions: 'Trace each letter carefully',
    },
  },
  {
    id: '2',
    title: 'Color Mixing Fun',
    description: 'Learn about primary and secondary colors',
    category: 'art',
    difficulty: 1,
    age_range: '4-6',
    estimated_time: 15,
    type: 'color_mixing',
    content: {
      colors: ['red', 'blue', 'yellow'],
      instructions: 'Mix colors to create new ones',
    },
  },
  {
    id: '3',
    title: 'Animal Habitats',
    description: 'Learn where different animals live',
    category: 'science',
    difficulty: 3,
    age_range: '5-7',
    estimated_time: 12,
    type: 'animal_habitats',
    content: {
      animals: ['lion', 'fish', 'bird', 'bear'],
      instructions: 'Match animals to their habitats',
    },
  },
  {
    id: '4',
    title: 'Community Helpers',
    description: 'Learn about people who help our community',
    category: 'social_studies',
    difficulty: 3,
    age_range: '4-6',
    estimated_time: 10,
    type: 'community_helpers',
    content: {
      helpers: ['doctor', 'teacher', 'firefighter', 'police'],
      instructions: 'Match helpers to their tools',
    },
  },
  {
    id: '5',
    title: 'Simple Addition',
    description: 'Practice adding numbers (difficulty by level)',
    category: 'math',
    difficulty: 2,
    age_range: '5-7',
    estimated_time: 8,
    type: 'math',
    content: {
      problems: ['1+2', '3+4', '5+1', '2+3'],
      instructions: 'Solve the addition problems',
    },
  },
  {
    id: '6',
    title: 'Sight Words',
    description: 'Learn common sight words',
    category: 'reading',
    difficulty: 2,
    age_range: '4-6',
    estimated_time: 10,
    type: 'reading',
    content: {
      words: ['the', 'and', 'is', 'in', 'it', 'to', 'of', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'at', 'be', 'this', 'have', 'from'],
      instructions: 'Read and recognize these words',
    },
  },
];
