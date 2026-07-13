import { IUser, LearnedWord } from '../models/User';
import { reviewWord, stripTime } from '../utils/spacedRepetition';

// applies an SRS review to a single learned-word subdocument and the point/streak bookkeeping
// that goes with it - shared by the manual /review route and the answer-checking route so the
// two don't drift on how points/streaks are awarded
export function applyWordReview(user: IUser, learnedWord: LearnedWord, quality: number): void {
  const result = reviewWord(
    {
      interval: learnedWord.interval ?? 0,
      repetitions: learnedWord.repetitions ?? 0,
      easeFactor: learnedWord.easeFactor ?? 2.5,
    },
    quality,
    {
      knownWordToDef: learnedWord.knownWordToDef ?? false,
      knownDefToWord: learnedWord.knownDefToWord ?? false,
    }
  );

  learnedWord.interval = result.interval;
  learnedWord.repetitions = result.repetitions;
  learnedWord.easeFactor = result.easeFactor;
  learnedWord.nextReviewDate = result.nextReviewDate;
  learnedWord.lastReviewedAt = result.lastReviewedAt;
  learnedWord.stage = result.stage;

  if (quality >= 3) {
    user.points += 1;
  }

  const todayDateOnly = stripTime(new Date());
  if (!user.lastStreakDate) {
    user.streakCount = 1;
  } else {
    const diffDays = Math.round((todayDateOnly.getTime() - stripTime(user.lastStreakDate).getTime()) / 86400000);
    if (diffDays === 1) {
      user.streakCount += 1;
    } else if (diffDays > 1) {
      user.streakCount = 1;
    }
    // diffDays <= 0 (user already reviewed today) does not change streakCount
  }
  user.lastStreakDate = todayDateOnly;
}
