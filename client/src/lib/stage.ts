import { Sprout, Leaf, Flower2, type LucideIcon } from 'lucide-react';
import type { MasteryStage } from '@/data/vocabulary';

export interface StageConfig {
  icon: LucideIcon;
  label: string;
  borderClass: string;
  iconColorClass: string;
  pipFilledClass: string;
  bgTintClass: string;
}

export const STAGE_CONFIG: Record<MasteryStage, StageConfig> = {
  seedling: {
    icon: Sprout,
    label: 'Seedling',
    borderClass: 'border-t-border',
    iconColorClass: 'text-accent',
    pipFilledClass: 'bg-secondary',
    bgTintClass: 'bg-accent/15',
  },
  growing: {
    icon: Leaf,
    label: 'Growing',
    borderClass: 'border-t-secondary',
    iconColorClass: 'text-secondary',
    pipFilledClass: 'bg-secondary',
    bgTintClass: 'bg-secondary/15',
  },
  bloomed: {
    icon: Flower2,
    label: 'Bloomed',
    borderClass: 'border-t-bloom',
    iconColorClass: 'text-bloom',
    pipFilledClass: 'bg-bloom',
    bgTintClass: 'bg-bloom/15',
  },
};
