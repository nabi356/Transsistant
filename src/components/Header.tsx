import React from 'react';
import {
  Bot, Settings, ShieldAlert, BookOpen,
  Video, Disc, Sun, Moon, LogIn
} from 'lucide-react';
import { NEBIUS_MODELS } from '../services/nebiusService';
import type { UserProfile } from '../types';

export type MainTab = 'live-meet' | 'recorded-classes' | 'sign-to-speech' | 'speech-to-sign' | 'pattern-coach' | 'assistive-copilot';

interface HeaderProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  selectedModel: string;
  onOpenSettings: () => void;
  isSimulated: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedModel,
  onOpenSettings,
  isSimulated,
  theme,
  onToggleTheme,
  currentUser,
  onOpenAuth
}) => {
  const currentModelInfo = NEBIUS_MODELS.find(m => m.id === selectedModel) || NEBIUS_MODELS[0];

  return (
    <header
      className="glass-panel"
      style={{
        margin: '10px 16px 8px 16px',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        zIndex: 10
      }}
    >
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src="/logo.svg"
          alt="Transsistant Logo"
          style={{ width: 38, height: 38, borderRadius: 10, boxShadow: 'var(--glow-cyan)' }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                margin: 0
              }}
            >
              Transisstant
            </h1>
            <span className="badge badge-cyan" style={{ fontSize: '0.64rem', padding: '1px 6px' }}>
              Sign MNIST Engine
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
            Live ASL Classroom Translator, Auto Notes & MNIST Archive
          </p>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.15)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          gap: '4px'
        }}
      >
        {/* Live Classroom / Meet */}
        <button
          onClick={() => setActiveTab('live-meet')}
          className={`btn ${activeTab === 'live-meet' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '7px 12px', fontSize: '0.8rem' }}
          id="tab-live-meet"
        >
          <Video size={14} />
          <span>Live Meet</span>
        </button>

        {/* Recorded Classes */}
        <button
          onClick={() => setActiveTab('recorded-classes')}
          className={`btn ${activeTab === 'recorded-classes' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '7px 12px', fontSize: '0.8rem' }}
          id="tab-recorded-classes"
        >
          <Disc size={14} />
          <span>Recorded Classes</span>
        </button>

        {/* Standalone Gesture Coach */}
        <button
          onClick={() => setActiveTab('pattern-coach')}
          className={`btn ${activeTab === 'pattern-coach' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '7px 12px', fontSize: '0.8rem' }}
          id="tab-pattern-coach"
        >
          <BookOpen size={14} />
          <span>Pattern Coach</span>
        </button>

        {/* SOS Emergency Copilot */}
        <button
          onClick={() => setActiveTab('assistive-copilot')}
          className={`btn ${activeTab === 'assistive-copilot' ? 'btn-danger' : 'btn-secondary'}`}
          style={{ padding: '7px 12px', fontSize: '0.8rem' }}
          id="tab-assistive-copilot"
        >
          <ShieldAlert size={14} />
          <span>SOS Copilot</span>
        </button>
      </nav>

      {/* Right Controls: Theme Toggle + User Profile + Settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Theme Toggle (Dark / Light) */}
        <button
          onClick={onToggleTheme}
          className="btn btn-secondary btn-icon"
          style={{ width: 36, height: 36 }}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          id="btn-toggle-theme"
        >
          {theme === 'dark' ? <Sun size={17} color="#ffb703" /> : <Moon size={17} color="#6366f1" />}
        </button>

        {/* User Account / Profile Badge */}
        {currentUser ? (
          <div
            onClick={onOpenAuth}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}
            title="Click to Switch User / Account Details"
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-emerald))',
                color: '#050a12',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.74rem'
              }}
            >
              {currentUser.avatar || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentUser.name.split(' ')[0]}
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                {currentUser.role}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
        )}

        {/* Model Badge */}
        <div
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(157, 78, 221, 0.1)',
            border: '1px solid rgba(157, 78, 221, 0.35)',
            padding: '5px 10px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer'
          }}
          title="Nebius Token Factory Model Configuration"
        >
          <Bot size={14} color="#d8b4fe" />
          <span style={{ fontSize: '0.76rem', color: '#c084fc', fontWeight: 600 }}>
            {currentModelInfo.tier}
          </span>
          <span
            className="pulse-dot"
            style={{ background: isSimulated ? '#ffb703' : '#00ffa3' }}
            title={isSimulated ? 'Simulation Mode' : 'Nebius API Connected'}
          />
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="btn btn-secondary btn-icon"
          style={{ width: 36, height: 36 }}
          title="Settings"
          id="btn-open-settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
};

