import React, { useState } from 'react';
import { X, Key, Bot, Volume2 } from 'lucide-react';
import { NEBIUS_MODELS } from '../services/nebiusService';
import { AudioEngine } from '../services/audioEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
  apiKey,
  onSaveApiKey
}) => {
  const [tempKey, setTempKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(tempKey);
    onClose();
  };

  const testConnection = async () => {
    setTestStatus('testing');
    setStatusMessage('Testing connection to Nebius Token Factory...');

    if (!tempKey.trim()) {
      setTimeout(() => {
        setTestStatus('success');
        setStatusMessage('Simulation Mode: Authentic local Nemotron response generation active.');
      }, 300);
      return;
    }

    try {
      const res = await fetch('https://api.tokenfactory.nebius.com/v1/models', {
        headers: { 'Authorization': `Bearer ${tempKey.trim()}` }
      });
      if (res.ok) {
        setTestStatus('success');
        setStatusMessage('Successfully verified Nebius Token Factory credentials!');
      } else {
        setTestStatus('failed');
        setStatusMessage(`Verification failed: HTTP ${res.status}. Falling back to simulation mode.`);
      }
    } catch {
      setTestStatus('failed');
      setStatusMessage('Network error reaching Nebius Token Factory. Client fallback enabled.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 7, 14, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'linear-gradient(135deg, rgba(14, 22, 38, 0.95) 0%, rgba(20, 31, 55, 0.95) 100%)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          boxShadow: 'var(--glow-cyan)',
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="#00f0ff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>System Configuration</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Nebius Token Factory & NVIDIA Nemotron Models
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: 32, height: 32 }}>
            <X size={18} />
          </button>
        </div>

        {/* Section 1: Nebius Token Factory API Key */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Key size={14} color="#00ffa3" />
            <span>Nebius Token Factory API Key</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={tempKey}
              onChange={e => setTempKey(e.target.value)}
              placeholder="e.g. neb_live_... (Leave empty for instant demo mode)"
              style={{
                flex: 1,
                background: 'rgba(5, 8, 15, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '0.85rem',
                color: '#ffffff',
                outline: 'none',
                fontFamily: 'var(--font-mono)'
              }}
              id="input-nebius-api-key"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="btn btn-secondary"
              style={{ padding: '0 12px', fontSize: '0.78rem' }}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={testConnection}
              disabled={testStatus === 'testing'}
              className="btn btn-primary"
              style={{ padding: '0 14px', fontSize: '0.8rem' }}
              id="btn-test-nebius-connection"
            >
              Test
            </button>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Keys are stored securely in your browser's local storage. Never sent to any third party.
          </p>

          {testStatus !== 'idle' && (
            <div
              style={{
                marginTop: '8px',
                fontSize: '0.78rem',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: testStatus === 'success' ? 'rgba(0, 255, 163, 0.1)' : testStatus === 'testing' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 0, 84, 0.1)',
                border: `1px solid ${testStatus === 'success' ? 'rgba(0, 255, 163, 0.3)' : testStatus === 'testing' ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 0, 84, 0.3)'}`,
                color: testStatus === 'success' ? '#00ffa3' : testStatus === 'testing' ? '#00f0ff' : '#ff4d6d'
              }}
            >
              {statusMessage}
            </div>
          )}
        </div>

        {/* Section 2: NVIDIA Nemotron Model Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Bot size={14} color="#00f0ff" />
            <span>Active NVIDIA Nemotron Model Architecture</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {NEBIUS_MODELS.map(m => {
              const isSelected = selectedModel === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectModel(m.id)}
                  style={{
                    background: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'rgba(5, 8, 15, 0.6)',
                    border: isSelected ? '1px solid #00f0ff' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isSelected ? '#00ffa3' : '#ffffff' }}>
                        {m.name}
                      </span>
                      <span className={`badge ${m.tier === 'Nano' ? 'badge-cyan' : m.tier === 'Super' ? 'badge-emerald' : 'badge-purple'}`} style={{ fontSize: '0.65rem' }}>
                        {m.tier}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                      {m.typicalLatency}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                    {m.description}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600 }}>
                    Recommended: {m.recommendedFor}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Audio Speech Synthesis Test */}
        <div style={{ marginBottom: '24px', background: 'rgba(5, 8, 15, 0.5)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Volume2 size={14} color="#00ffa3" />
                <span>Text-to-Speech Engine</span>
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Web Speech API with low-latency synthesis
              </span>
            </div>
            <button
              onClick={() => AudioEngine.speak('Transsistant voice synthesis active. Powered by NVIDIA Nemotron.')}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.76rem' }}
            >
              Test Voice
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 18px' }}>
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary" style={{ padding: '8px 24px' }}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
