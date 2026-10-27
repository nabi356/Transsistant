import React from 'react';
import { Bot, Settings, ShieldAlert, BookOpen, MessageSquare, Hand } from 'lucide-react';
import { NEBIUS_MODELS } from '../services/nebiusService';

interface HeaderProps {
  activeTab: 'sign-to-speech' | 'speech-to-sign' | 'pattern-coach' | 'assistive-copilot';
  setActiveTab: (tab: 'sign-to-speech' | 'speech-to-sign' | 'pattern-coach' | 'assistive-copilot') => void;
  selectedModel: string;
  onOpenSettings: () => void;
  isSimulated: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedModel,
  onOpenSettings,
  isSimulated
}) => {
  const currentModelInfo = NEBIUS_MODELS.find(m => m.id === selectedModel) || NEBIUS_MODELS[0];

  return (
    <header className="glass-panel" style={{ margin: '14px 20px 10px 20px', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', zIndex: 10 }}>
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <img src="/logo.svg" alt="Transsistant Logo" style={{ width: 44, height: 44, borderRadius: 12, boxShadow: 'var(--glow-cyan)' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(90deg, #00f0ff, #00ffa3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
              Transsistant
            </h1>
            <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
              v1.0 • AI Agent
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
            Bidirectional Sign Language Copilot & Pattern Agent • Powered by NVIDIA Nemotron
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', background: 'rgba(5, 8, 15, 0.7)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', gap: '4px' }}>
        <button
          onClick={() => setActiveTab('sign-to-speech')}
          className={`btn ${activeTab === 'sign-to-speech' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.84rem' }}
          id="tab-sign-to-speech"
        >
          <Hand size={16} />
          <span>Sign to Speech</span>
        </button>

        <button
          onClick={() => setActiveTab('speech-to-sign')}
          className={`btn ${activeTab === 'speech-to-sign' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.84rem' }}
          id="tab-speech-to-sign"
        >
          <MessageSquare size={16} />
          <span>Speech to Sign</span>
        </button>

        <button
          onClick={() => setActiveTab('pattern-coach')}
          className={`btn ${activeTab === 'pattern-coach' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.84rem' }}
          id="tab-pattern-coach"
        >
          <BookOpen size={16} />
          <span>Pattern Coach</span>
        </button>

        <button
          onClick={() => setActiveTab('assistive-copilot')}
          className={`btn ${activeTab === 'assistive-copilot' ? 'btn-danger' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.84rem' }}
          id="tab-assistive-copilot"
        >
          <ShieldAlert size={16} />
          <span>SOS & Copilot</span>
        </button>
      </nav>

      {/* Right Controls: Nebius Model Pill & Settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(157, 78, 221, 0.1)',
            border: '1px solid rgba(157, 78, 221, 0.35)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Nebius Token Factory Model Configuration"
        >
          <Bot size={15} color="#d8b4fe" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Nebius Token Factory
            </span>
            <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 700 }}>
              {currentModelInfo.tier} ({currentModelInfo.name.replace('NVIDIA ', '')})
            </span>
          </div>
          <span className="pulse-dot" style={{ background: isSimulated ? '#ffb703' : '#00ffa3' }} title={isSimulated ? 'Running in Instant Simulation Mode' : 'Connected to Nebius Token Factory'} />
        </div>

        <button
          onClick={onOpenSettings}
          className="btn btn-secondary btn-icon"
          title="Application & Model Settings"
          id="btn-open-settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
