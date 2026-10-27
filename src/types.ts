export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface RecognizedSign {
  name: string;
  confidence: number;
  timestamp: number;
  category: 'alphabet' | 'word' | 'emergency' | 'number';
  description: string;
  hint?: string;
}

export interface NebiusModelOption {
  id: string;
  name: string;
  tier: 'Nano' | 'Super' | 'Ultra' | 'Vision';
  description: string;
  contextWindow: string;
  typicalLatency: string;
  recommendedFor: string;
}

export interface TranslationMessage {
  id: string;
  sender: 'signer' | 'speaker' | 'system';
  rawGlosses?: string[];
  text: string;
  translatedText?: string;
  targetLanguage?: string;
  timestamp: number;
  confidence?: number;
  modelUsed?: string;
  latencyMs?: number;
}

export interface SignPattern {
  id: string;
  label: string;
  category: 'Alphabet' | 'Emergency' | 'Daily Words' | 'Numbers';
  description: string;
  guideSteps: string[];
  landmarksHint: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Critical';
}

export interface CoachingFeedback {
  score: number; // 0 - 100
  isMatch: boolean;
  accuracyLabel: 'Exact Match' | 'Close Match' | 'Adjust Position' | 'No Hand Detected';
  tips: string[];
  missingFeatures?: string[];
}

export interface EmergencyDispatch {
  urgency: 'HIGH' | 'CRITICAL';
  type: 'MEDICAL' | 'FIRE' | 'POLICE' | 'GENERAL_HELP';
  headline: string;
  spokenScript: string;
  smsMessage: string;
  vitalDetails: string[];
  timestamp: string;
}
