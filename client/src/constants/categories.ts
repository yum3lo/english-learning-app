export const CATEGORIES = [
  'General',
  'Language',
  'Economy',
  'Environment',
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

export const CEFR_LEVELS = ['B1', 'B2', 'C1', 'C2'] as const;

export const MEDIA_TYPES = ['video', 'article'] as const;

export const DURATIONS = ['Short (< 15 min)', 'Medium (15-30 min)', 'Long (> 30 min)'] as const;

export type Category = typeof CATEGORIES[number];
export type CEFRLevel = typeof CEFR_LEVELS[number];
export type Duration = typeof DURATIONS[number];
export type MediaType = typeof MEDIA_TYPES[number];

export const formatDuration = (duration: string | number): string => {
  if (typeof duration !== 'number') {
    return duration;
  }

  const totalSeconds = Math.round(duration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const categorizeDuration = (duration: string | number): Duration => {
  let totalMinutes: number;

  if (typeof duration === 'number') {
    totalMinutes = duration / 60;
  } else {
    const [minutes, seconds] = duration.split(':').map(Number);
    totalMinutes = minutes + (seconds / 60);
  }

  if (totalMinutes < 15) {
    return 'Short (< 15 min)';
  } else if (totalMinutes <= 30) {
    return 'Medium (15-30 min)';
  } else {
    return 'Long (> 30 min)';
  }
};