export const mentalStatGroups = {
  'Activity Weekly Average': {
    sleep: 'Sleep',
    readingHours: 'Reading Hours',
  },
  'Mental Stats': {
    acuity: 'Acuity*',
    focus: 'Focus*',
    delayedRecall: 'Delayed Recall',
    readingSpeed: 'Reading Speed',
  },
  'Personality (Big Five)': {
    extroversion: 'Extroversion',
    emotionalStability: 'Emotional Stability',
    agreeableness: 'Agreeableness',
    conscientiousness: 'Conscientiousness',
    intellect: 'Intellect/Imagination',
  },
} as const;

type MentalStatKey =
  | keyof (typeof mentalStatGroups)['Activity Weekly Average']
  | keyof (typeof mentalStatGroups)['Mental Stats']
  | keyof (typeof mentalStatGroups)['Personality (Big Five)'];

export const mentalStatKeys = Object.values(mentalStatGroups).flatMap(
  (fields) => Object.keys(fields),
) as MentalStatKey[];

export type MentalStats = Partial<Record<MentalStatKey, string>>;
export const sentiments = ['positive', 'negative', 'neutral'] as const;
export type Sentiment = (typeof sentiments)[number];

export interface MentalLogEntry {
  id: string;
  at: number;
  title: string;
  description: string;
  sentiment: Sentiment;
}

export interface MentalProfile {
  stats: MentalStats;
  logs: MentalLogEntry[];
}
