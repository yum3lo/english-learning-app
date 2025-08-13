export const CATEGORIES = [
  'Politics',
  'Geography', 
  'Fauna',
  'Flora',
  'History',
  'Cinema',
  'Literature',
  'Sports',
  'Technology',
  'Science',
  'Art',
  'Music',
  'Food',
  'Travel',
  'Health',
  'Culture'
] as const;

export const CEFR_LEVELS = ['B2', 'C1', 'C2'] as const;

export const MEDIA_TYPES = ['video', 'article'] as const;

export type CEFRLevel = typeof CEFR_LEVELS[number];