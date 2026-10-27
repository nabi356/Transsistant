import React, { useState } from 'react';
import { Header } from './components/Header';
import { CameraTracker } from './components/CameraTracker';
import { SpeechToSign } from './components/SpeechToSign';
import { PatternCoach } from './components/PatternCoach';
import { AssistiveCopilot } from './components/AssistiveCopilot';
import { SettingsModal } from './components/SettingsModal';
import { ConversationStream } from './components/ConversationStream';
import type { TranslationMessage } from './types';
import { NebiusService } from './services/nebiusService';
import { Bot, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sign-to-speech' | 'speech-to-sign' | 'pattern-coach' | 'assistive-copilot'>('sign-to-speech');
  const [selectedModel, setSelectedModel] = useState<string>(NebiusService.getSelectedModel());
  const [apiKey, setApiKey] = useState<string>(NebiusService.getApiKey());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<TranslationMessage[]>([
    {
      id: 'welcome-1',
      sender: 'signer',
      rawGlosses: ['HELLO', 'WELCOME'],
      text: 'Hello, welcome to Transsistant!',
      timestamp: Date.now() - 1000 * 60 * 2,
      modelUsed: 'nvidia/nemotron-3-nano',
      latencyMs: 54
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
    setMessages(prev => [msg, ...prev]);
  };

  const isSimulated = !apiKey.trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Navigation & System Status */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedModel={selectedModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSimulated={isSimulated}
      />

      {/* Main Feature Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'sign-to-speech' && (
          <CameraTracker
            onNewMessage={handleNewMessage}
            onEmergencyTrigger={() => setActiveTab('assistive-copilot')}
          />
        )}

        {activeTab === 'speech-to-sign' && (
          <SpeechToSign onNewMessage={handleNewMessage} />
        )}

        {activeTab === 'pattern-coach' && (
          <PatternCoach />
        )}

        {activeTab === 'assistive-copilot' && (
          <AssistiveCopilot />
        )}

        {/* Global Live Conversation Transcript Stream */}
        <ConversationStream
          messages={messages}
          onClear={() => setMessages([])}
        />
      </main>

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
          margin: '0 20px 14px 20px',
          padding: '12px 20px',
          background: 'rgba(5, 8, 15, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, color: '#f8fafc' }}>Transsistant</span>
          <span>•</span>
          <span>Nebius Global AI Hackathon Submission</span>
          <span>•</span>
          <span style={{ color: '#00ffa3' }}>Best Apps & Agents Track</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Bot size={13} color="#00f0ff" />
            <span>NVIDIA Nemotron (Ultra / Super / Nano) on Nebius Token Factory</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Heart size={13} color="#ff0054" />
            <span>Accessible Design for Deaf & Hard of Hearing</span>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
