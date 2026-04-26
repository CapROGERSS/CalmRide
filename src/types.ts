export type TrafficState = 'Light' | 'Moderate Steady' | 'Heavy' | 'Jammed';

export interface StressProfile {
  age: number;
  commuteTime: number;
  sleepHours: number;
  trafficState: TrafficState;
  mood: string;
}

export interface PredictionResult {
  stressScore: number;
  confidence: number;
  primaryStressors: string[];
  remedies: string[];
  stressReasons?: {
    factor: string;
    delta: number;
  }[];
  whatIfScenarios: {
    title: string;
    description: string;
    projectedScore: number;
    trend: 'up' | 'down';
  }[];
}
