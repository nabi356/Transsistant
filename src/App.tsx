import React, { useState, useEffect } from 'react';
import { Header, type MainTab } from './components/Header';
import { LiveMeetView } from './components/LiveMeetView';
import { RecordedClassesView } from './components/RecordedClassesView';
import { PatternCoach } from './components/PatternCoach';
import { AssistiveCopilot } from './components/AssistiveCopilot';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import type { TranslationMessage, UserProfile, RecordedClass } from './types';
import { NebiusService } from './services/nebiusService';
import { Bot, Heart, Database } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('live-meet');
  const [selectedModel, setSelectedModel] = useState<string>(NebiusService.getSelectedModel());
  const [apiKey, setApiKey] = useState<string>(NebiusService.getApiKey());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Theme Management (Dark / Light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('transisstant_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('transisstant_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('transisstant_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }
    // Default demo authenticated profile
    return {
      id: 'usr-default',
      name: 'Maya Lin',
      email: 'maya.student@deafedu.org',
      role: 'student',
      preferredSignLang: 'ASL',
      avatar: 'ML'
    };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Live Messages / Translation Stream
  const [messages, setMessages] = useState<TranslationMessage[]>([
    {
      id: 'welcome-1',
      sender: 'signer',
      rawGlosses: ['HELLO', 'WELCOME'],
      text: 'Hello, welcome to today’s inclusive classroom session! I am signing through the real-time AI copilot.',
      timestamp: Date.now() - 1000 * 60 * 3,
      modelUsed: 'nvidia/nemotron-3-nano',
      latencyMs: 48
    },
    {
      id: 'welcome-2',
      sender: 'speaker',
      text: 'Good morning Maya! Your sign glosses are generating clear, grammatically cohesive paragraphs in the sidebar.',
      timestamp: Date.now() - 1000 * 60 * 1,
      modelUsed: 'nvidia/nemotron-3-nano',
      latencyMs: 52
    }
  ]);

  // Recorded Classes Library State
  const [recordedClasses, setRecordedClasses] = useState<RecordedClass[]>([
    {
      id: 'rec-1',
      title: 'ASL Morphology & Spatial Phrasing Masterclass',
      instructor: 'Prof. Sarah Jenkins',
      date: 'Oct 24, 2026',
      duration: '48:15',
      tag: 'Linguistics',
      transcript: [
        {
          id: 't-1',
          time: '00:15',
          seconds: 15,
          speaker: 'Prof. Sarah Jenkins',
          text: 'Welcome class. Today we explore how spatial indexing and facial grammatical markers shape American Sign Language syntax.'
        },
        {
          id: 't-2',
          time: '00:45',
          seconds: 45,
          speaker: 'Deaf Signer (Student)',
          text: 'Does topic-comment structure in ASL always place the primary spatial anchor at the beginning of the sentence?',
          glosses: ['TOPIC', 'ASL', 'STRUCTURE', 'SENTENCE']
        },
        {
          id: 't-3',
          time: '01:20',
          seconds: 80,
          speaker: 'Prof. Sarah Jenkins',
          text: 'Exactly! In standard ASL grammar, the topic is established first with raised eyebrows, followed by the explanatory comment.'
        },
        {
          id: 't-4',
          time: '02:05',
          seconds: 125,
          speaker: 'Alex Rivera (Interpreter)',
          text: 'Notice also how the handshape transitions between letters in finger spelling maintain consistent palm orientation.'
        }
      ],
      notes: [
        {
          id: 'n-1',
          timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
          timeFormatted: '00:15',
          category: 'topic',
          title: 'ASL Sentence Architecture: Topic-Comment Structure',
          content: 'ASL utilizes spatial anchors and non-manual signals (raised eyebrows for topic) to structure sentences efficiently without English prepositions.'
        },
        {
          id: 'n-2',
          timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
          timeFormatted: '00:45',
          category: 'gloss',
          title: 'Core Glosses Examined',
          content: 'Key terms: [TOPIC], [STRUCTURE], [GRAMMAR], [PALM ORIENTATION]. Hand positions align with Sign Language MNIST canonical profiles.',
          signGlosses: ['TOPIC', 'STRUCTURE', 'GRAMMAR']
        },
        {
          id: 'n-3',
          timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
          timeFormatted: '02:05',
          category: 'action',
          title: 'Practice Assignment',
          content: 'Practice signing 5 topic-comment sentences using the Pattern Coach and verify recognition accuracy against the dataset model.'
        }
      ]
    },
    {
      id: 'rec-2',
      title: 'Emergency Sign Recognition & Critical Health Dispatch',
      instructor: 'Alex Rivera (Certified ASL Interpreter)',
      date: 'Oct 21, 2026',
      duration: '32:40',
      tag: 'Critical Care',
      transcript: [
        {
          id: 't2-1',
          time: '00:10',
          seconds: 10,
          speaker: 'Alex Rivera',
          text: 'In emergency situations, standard communication channels often fail deaf individuals. Speed and accuracy of gesture recognition are vital.'
        },
        {
          id: 't2-2',
          time: '00:50',
          seconds: 50,
          speaker: 'Deaf Signer',
          text: 'The international Signal for Help: open palm, thumb tucked into palm, then four fingers folded down over thumb.',
          glosses: ['HELP_SOS', 'EMERGENCY', 'DOCTOR']
        },
        {
          id: 't2-3',
          time: '01:30',
          seconds: 90,
          speaker: 'Alex Rivera',
          text: 'Transisstant automatically triggers the Assistive Copilot when this gesture is maintained for 700 milliseconds, formatting a 911 dispatch.'
        }
      ],
      notes: [
        {
          id: 'n2-1',
          timestamp: Date.now() - 1000 * 60 * 60 * 24 * 6,
          timeFormatted: '00:10',
          category: 'topic',
          title: 'Distress Signal Protocol',
          content: 'Emergency triage requires rapid detection of trapped thumb gesture and pulse-tap doctor signs with zero false positives.'
        },
        {
          id: 'n2-2',
          timestamp: Date.now() - 1000 * 60 * 60 * 24 * 6,
          timeFormatted: '01:30',
          category: 'action',
          title: 'Copilot Verification',
          content: 'Test dispatch simulated alerts in SOS Copilot tab to ensure rapid emergency script generation.'
        }
      ]
    }
  ]);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    NebiusService.setSelectedModel(modelId);
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    NebiusService.setApiKey(key);
  };

  const handleNewMessage = (msg: TranslationMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleSaveRecordedClass = (recorded: RecordedClass) => {
    setRecordedClasses(prev => [recorded, ...prev]);
  };

  const isSimulated = !apiKey.trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Navigation & System Status Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedModel={selectedModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSimulated={isSimulated}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main View Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Live Classroom / Meeting View with Resizable Sidebar */}
        {activeTab === 'live-meet' && (
          <LiveMeetView
            currentUser={currentUser || {
              id: 'guest-1',
              name: 'Guest Attendee',
              email: 'guest@transisstant.ai',
              role: 'guest',
              preferredSignLang: 'ASL',
              avatar: 'GA'
            }}
            messages={messages}
            onNewMessage={handleNewMessage}
            onClearMessages={() => setMessages([])}
            onSaveRecordedClass={handleSaveRecordedClass}
            onSwitchToRecorded={() => setActiveTab('recorded-classes')}
          />
        )}

        {/* Recorded Classes Library */}
        {activeTab === 'recorded-classes' && (
          <RecordedClassesView
            recordedClasses={recordedClasses}
            onBackToLive={() => setActiveTab('live-meet')}
          />
        )}

        {/* ASL Pattern Coach & Posture Alignment */}
        {activeTab === 'pattern-coach' && (
          <PatternCoach />
        )}

        {/* Emergency SOS Copilot */}
        {activeTab === 'assistive-copilot' && (
          <AssistiveCopilot />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
        currentUser={currentUser}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      {/* Footer Banner */}
      <footer
        style={{
          margin: '4px 16px 8px 16px',
          padding: '8px 16px',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '0.74rem',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Transisstant</span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Database size={12} color="var(--accent-amber)" />
            <span>Sign Language MNIST Archive (27,455 samples)</span>
          </span>
          <span>•</span>
          <span style={{ color: 'var(--accent-emerald)' }}>Live Meet & Resizable Translation Sidebar Active</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Bot size={12} color="var(--accent-cyan)" />
            <span>NVIDIA Nemotron on Nebius Token Factory</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Heart size={12} color="#ff0054" />
            <span>Inclusive Classroom for Deaf & Hard of Hearing</span>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;

