import { Sprout, Leaf, Flower, type LucideIcon } from 'lucide-react';
import type { MasteryStage } from '@/data/vocabulary';

export interface StageConfig {
  icon: LucideIcon;
  label: string;
  iconColorClass: string;
  pipFilledClass: string;
  bgTintClass: string;
}

export const STAGE_CONFIG: Record<MasteryStage, StageConfig> = {
  seedling: {
    icon: Sprout,
    label: 'Seedling',
    iconColorClass: 'text-accent',
    pipFilledClass: 'bg-secondary',
    bgTintClass: 'bg-accent/15',
  },
  growing: {
    icon: Leaf,
    label: 'Growing',
    iconColorClass: 'text-secondary',
    pipFilledClass: 'bg-secondary',
    bgTintClass: 'bg-secondary/15',
  },
  bloomed: {
    icon: Flower,
    label: 'Bloomed',
    iconColorClass: 'text-bloom',
    pipFilledClass: 'bg-bloom',
    bgTintClass: 'bg-bloom/15',
  },
};
