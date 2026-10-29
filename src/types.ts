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

// User Authentication & Profile
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'interpreter' | 'guest';
  avatar?: string;
  preferredSignLang: 'ASL' | 'BSL' | 'ISL';
}

// Live Classroom / Meeting Session
export interface MeetingRoom {
  id: string;
  code: string;
  joinLink: string;
  title: string;
  hostName: string;
  startedAt: number;
  isRecording: boolean;
}

export interface Participant {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'interpreter' | 'guest';
  avatar?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  hasHandRaised: boolean;
  isSpeaking: boolean;
}

// Meeting Chat (Common Room Chat and 1-on-1 Personal Chat)
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'teacher' | 'interpreter' | 'guest';
  text: string;
  timestamp: number;
  isPrivate: boolean;
  recipientId?: string;
  recipientName?: string;
}

// Automated Live Lecture Notes
export interface AutoNoteItem {
  id: string;
  timestamp: number;
  timeFormatted: string;
  category: 'topic' | 'keypoint' | 'gloss' | 'action';
  title: string;
  content: string;
  signGlosses?: string[];
}

// Recorded Classes Library
export interface RecordedClass {
  id: string;
  title: string;
  instructor: string;
  date: string;
  duration: string;
  tag: string;
  transcript: {
    id: string;
    time: string;
    seconds: number;
    speaker: string;
    text: string;
    glosses?: string[];
  }[];
  notes: AutoNoteItem[];
}

// Sign Language MNIST Dataset Types
export interface DatasetSample {
  sampleId: string;
  letter: string;
  label: number;
  pixels: number[];
}

export interface DatasetClassifyResult {
  predictedLetter: string;
  confidence: number;
  topPredictions: {
    letter: string;
    score: number;
    description: string;
  }[];
  description: string;
}

export interface DatasetStats {
  name: string;
  source: string;
  totalTrainSamples: number;
  totalTestSamples: number;
  classCount: number;
  letters: string[];
  letterDescriptions: Record<string, string>;
}

