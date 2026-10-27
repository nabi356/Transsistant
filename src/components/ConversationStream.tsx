import React from 'react';
import { Volume2, Hand, MessageSquare, Download, Trash2, Cpu, Clock } from 'lucide-react';
import type { TranslationMessage } from '../types';
import { AudioEngine } from '../services/audioEngine';

interface ConversationStreamProps {
  messages: TranslationMessage[];
  onClear: () => void;
}

export const ConversationStream: React.FC<ConversationStreamProps> = ({ messages, onClear }) => {
  const exportTranscript = () => {
    if (messages.length === 0) return;
    const transcriptText = messages.map(m => {
      const time = new Date(m.timestamp).toLocaleTimeString();
      const role = m.sender === 'signer' ? 'DEAF SIGNER' : 'HEARING SPEAKER';
      const glosses = m.rawGlosses ? ` [Glosses: ${m.rawGlosses.join(', ')}]` : '';
      return `[${time}] ${role}: "${m.text}"${glosses}`;
    }).join('\n\n');

    const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transsistant-transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (messages.length === 0) return null;

  return (
    <div className="glass-panel" style={{ margin: '0 20px 20px 20px', padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} color="#00f0ff" />
          <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700 }}>
            Live Conversation Transcript
          </h3>
          <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
            {messages.length} Exchanges
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={exportTranscript}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.74rem' }}
            title="Download Transcript"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
          <button
            onClick={onClear}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
            title="Clear History"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto', paddingRight: '6px' }}>
        {messages.map(msg => {
          const isSigner = msg.sender === 'signer';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '10px 14px',
                background: isSigner ? 'rgba(0, 240, 255, 0.05)' : 'rgba(157, 78, 221, 0.05)',
                border: isSigner ? '1px solid rgba(0, 240, 255, 0.2)' : '1px solid rgba(157, 78, 221, 0.2)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              {/* Avatar Icon */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isSigner ? 'rgba(0, 255, 163, 0.15)' : 'rgba(157, 78, 221, 0.15)',
                  border: isSigner ? '1px solid rgba(0, 255, 163, 0.3)' : '1px solid rgba(157, 78, 221, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {isSigner ? <Hand size={15} color="#00ffa3" /> : <MessageSquare size={15} color="#d8b4fe" />}
              </div>

              {/* Message Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isSigner ? '#00ffa3' : '#d8b4fe' }}>
                      {isSigner ? 'Deaf Signer' : 'Hearing Partner'}
                    </span>
                    {msg.modelUsed && (
                      <span style={{ fontSize: '0.66rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Cpu size={10} />
                        {msg.modelUsed.replace('nvidia/', '')}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={10} />
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', color: '#f8fafc', margin: '2px 0 4px 0', lineHeight: 1.4 }}>
                  &ldquo;{msg.text}&rdquo;
                </p>

                {/* Gloss pills if available */}
                {msg.rawGlosses && msg.rawGlosses.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {msg.rawGlosses.map((g, idx) => (
                      <span key={idx} style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.08)', padding: '1px 6px', borderRadius: 4, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Speak button */}
              <button
                onClick={() => AudioEngine.speak(msg.text)}
                className="btn btn-secondary btn-icon"
                style={{ width: 28, height: 28, alignSelf: 'center' }}
                title="Speak text"
              >
                <Volume2 size={13} color="#38bdf8" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
