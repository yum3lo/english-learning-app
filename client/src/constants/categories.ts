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

export const DURATIONS = ['Short (< 15 min)', 'Medium (15-30 min)', 'Long (> 30 min)'] as const;

export const ACTIVITY_TYPES = [
  'read',
  'watched', 
  'vocabulary_click',
  'flashcard_review'
] as const;

export const MEDIA_TYPES = ['video', 'article'] as const;

export type Category = typeof CATEGORIES[number];
export type CEFRLevel = typeof CEFR_LEVELS[number];
export type Duration = typeof DURATIONS[number];
export type ActivityType = typeof ACTIVITY_TYPES[number];
export type MediaType = typeof MEDIA_TYPES[number];

export const categorizeDuration = (duration: string): Duration => {
  const [minutes, seconds] = duration.split(':').map(Number);
  const totalMinutes = minutes + (seconds / 60);
  
  if (totalMinutes < 15) {
    return 'Short (< 15 min)';
  } else if (totalMinutes <= 30) {
    return 'Medium (15-30 min)';
  } else {
    return 'Long (> 30 min)';
  }
};
