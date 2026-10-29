import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, FileText, Lock, Database, Volume2, Download,
  Copy, Check, Sparkles, Send, RefreshCw, Hand, ArrowRight
} from 'lucide-react';
import type { TranslationMessage, ChatMessage, Participant, UserProfile, DatasetSample, DatasetClassifyResult } from '../types';
import { AudioEngine } from '../services/audioEngine';
import { NotesService } from '../services/notesService';
import { DatasetService, ASL_LETTERS, ASL_LETTER_DESCRIPTIONS } from '../services/datasetService';

interface ResizableSidebarProps {
  sidebarWidth: number;
  onWidthChange: (newWidth: number) => void;
  messages: TranslationMessage[];
  onClearMessages: () => void;
  currentUser: UserProfile;
  participants: Participant[];
  onInjectSignGloss: (gloss: string) => void;
}

export const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  sidebarWidth,
  onWidthChange,
  messages,
  onClearMessages,
  currentUser,
  participants,
  onInjectSignGloss
}) => {
  const [activeTab, setActiveTab] = useState<'paragraphs' | 'notes' | 'common-chat' | 'personal-chat' | 'dataset'>('paragraphs');
  const [isResizing, setIsResizing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Common Chat State
  const [commonChatInput, setCommonChatInput] = useState('');
  const [commonMessages, setCommonMessages] = useState<ChatMessage[]>([
    {
      id: 'c-1',
      senderId: 'sarah-1',
      senderName: 'Prof. Sarah Jenkins',
      senderRole: 'teacher',
      text: 'Welcome everyone to today’s lecture on ASL Morphology and Real-Time Inclusive Classrooms! Feel free to ask questions or sign.',
      timestamp: Date.now() - 1000 * 60 * 10,
      isPrivate: false
    },
    {
      id: 'c-2',
      senderId: 'alex-1',
      senderName: 'Alex Rivera (Interpreter)',
      senderRole: 'interpreter',
      text: 'Live sign translation stream is active on the main video tile. Automated paragraph synthesis is synchronized.',
      timestamp: Date.now() - 1000 * 60 * 6,
      isPrivate: false
    }
  ]);

  // Personal Chat State
  const [selectedRecipient, setSelectedRecipient] = useState<Participant | null>(
    participants.find(p => p.id !== currentUser.id) || null
  );
  const [personalChatInput, setPersonalChatInput] = useState('');
  const [personalMessages, setPersonalMessages] = useState<ChatMessage[]>([
    {
      id: 'p-1',
      senderId: 'sarah-1',
      senderName: 'Prof. Sarah Jenkins',
      senderRole: 'teacher',
      recipientId: currentUser.id,
      recipientName: currentUser.name,
      text: `Hi ${currentUser.name}! Let me know if you would like me to pause on any slide or explain any finger-spelling pattern.`,
      timestamp: Date.now() - 1000 * 60 * 8,
      isPrivate: true
    }
  ]);

  // Dataset Lab State
  const [selectedLetter, setSelectedLetter] = useState<string>('A');
  const [datasetSamples, setDatasetSamples] = useState<DatasetSample[]>([]);
  const [activeSample, setActiveSample] = useState<DatasetSample | null>(null);
  const [datasetClassifyResult, setDatasetClassifyResult] = useState<DatasetClassifyResult | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const sampleCanvasRef = useRef<HTMLCanvasElement>(null);

  // Automated Notes
  const autoNotes = NotesService.generateNotesFromMessages(messages);

  // Drag resizer handling
  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);

    const startX = mouseDownEvent.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Invert delta because sidebar is on right side
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(780, Math.max(320, startWidth + delta));
      onWidthChange(newWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [onWidthChange, sidebarWidth]);

  // Load samples when letter changes in dataset tab
  useEffect(() => {
    let isMounted = true;
    DatasetService.getSamples(selectedLetter).then(res => {
      if (!isMounted) return;
      const list = Array.isArray(res) ? res : res[selectedLetter] || [];
      setDatasetSamples(list);
      if (list.length > 0) {
        setActiveSample(list[0]);
      }
    });
    return () => { isMounted = false; };
  }, [selectedLetter]);

  // Render pixels when activeSample changes
  useEffect(() => {
    if (activeSample && sampleCanvasRef.current) {
      DatasetService.renderPixelsToCanvas(sampleCanvasRef.current, activeSample.pixels);
    }
  }, [activeSample]);

  // Run classification on active dataset sample
  const handleIdentifySample = async (sample: DatasetSample) => {
    setIsClassifying(true);
    try {
      const res = await DatasetService.classifyPixels(sample.pixels);
      setDatasetClassifyResult(res);
    } finally {
      setIsClassifying(false);
    }
  };

  // Test a random sample from the Sign Language MNIST archive
  const handleRandomTest = async () => {
    setIsClassifying(true);
    try {
      const randSample = await DatasetService.getRandomSample();
      setSelectedLetter(randSample.letter);
      setActiveSample(randSample);
      const res = await DatasetService.classifyPixels(randSample.pixels);
      setDatasetClassifyResult(res);
    } finally {
      setIsClassifying(false);
    }
  };

  // Send message in Common Chat
  const handleSendCommonChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commonChatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `c-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: commonChatInput.trim(),
      timestamp: Date.now(),
      isPrivate: false
    };

    setCommonMessages(prev => [...prev, newMsg]);
    setCommonChatInput('');
  };

  // Send message in Personal Chat
  const handleSendPersonalChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalChatInput.trim() || !selectedRecipient) return;

    const newMsg: ChatMessage = {
      id: `p-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientId: selectedRecipient.id,
      recipientName: selectedRecipient.name,
      text: personalChatInput.trim(),
      timestamp: Date.now(),
      isPrivate: true
    };

    setPersonalMessages(prev => [...prev, newMsg]);
    setPersonalChatInput('');
  };

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export Notes
  const handleExportNotes = () => {
    const md = NotesService.exportNotesToMarkdown(autoNotes, 'Live Classroom Lecture');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transisstant-Lecture-Notes-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside
      style={{
        width: `${sidebarWidth}px`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'var(--bg-glass)',
        borderLeft: '1px solid var(--border-subtle)',
        height: '100%',
        minHeight: 0
      }}
    >
      {/* Draggable Vertical Resize Handle */}
      <div
        className={`resizer-handle ${isResizing ? 'is-resizing' : ''}`}
        onMouseDown={startResizing}
        title="Drag left or right to resize sidebar"
        style={{
          position: 'absolute',
          left: -4,
          top: 0,
          bottom: 0,
          cursor: 'col-resize'
        }}
      />

      {/* Sidebar Tabs Bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.1)',
          padding: '6px 8px',
          gap: '4px',
          overflowX: 'auto'
        }}
      >
        <button
          onClick={() => setActiveTab('paragraphs')}
          className="btn"
          style={{
            padding: '7px 10px',
            fontSize: '0.78rem',
            background: activeTab === 'paragraphs' ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
            color: activeTab === 'paragraphs' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            border: activeTab === 'paragraphs' ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid transparent',
            borderRadius: 'var(--radius-sm)'
          }}
          title="Real-Time Translated Paragraphs"
        >
          <FileText size={14} />
          <span>Live Paragraphs</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className="btn"
          style={{
            padding: '7px 10px',
            fontSize: '0.78rem',
            background: activeTab === 'notes' ? 'rgba(0, 255, 163, 0.12)' : 'transparent',
            color: activeTab === 'notes' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
            border: activeTab === 'notes' ? '1px solid rgba(0, 255, 163, 0.3)' : '1px solid transparent',
            borderRadius: 'var(--radius-sm)'
          }}
          title="Automated Real-Time Lecture Notes"
        >
          <Sparkles size={14} />
          <span>Auto Notes</span>
          <span className="badge badge-emerald" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
            {autoNotes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('common-chat')}
          className="btn"
          style={{
            padding: '7px 10px',
            fontSize: '0.78rem',
            background: activeTab === 'common-chat' ? 'rgba(157, 78, 221, 0.15)' : 'transparent',
            color: activeTab === 'common-chat' ? '#d8b4fe' : 'var(--text-secondary)',
            border: activeTab === 'common-chat' ? '1px solid rgba(157, 78, 221, 0.35)' : '1px solid transparent',
            borderRadius: 'var(--radius-sm)'
          }}
          title="Public Meeting Chat"
        >
          <MessageSquare size={14} />
          <span>Meet Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('personal-chat')}
          className="btn"
          style={{
            padding: '7px 10px',
            fontSize: '0.78rem',
            background: activeTab === 'personal-chat' ? 'rgba(58, 134, 255, 0.15)' : 'transparent',
            color: activeTab === 'personal-chat' ? '#60a5fa' : 'var(--text-secondary)',
            border: activeTab === 'personal-chat' ? '1px solid rgba(58, 134, 255, 0.35)' : '1px solid transparent',
            borderRadius: 'var(--radius-sm)'
          }}
          title="Direct 1-on-1 Messages"
        >
          <Lock size={14} />
          <span>Direct 1:1</span>
        </button>

        <button
          onClick={() => setActiveTab('dataset')}
          className="btn"
          style={{
            padding: '7px 10px',
            fontSize: '0.78rem',
            background: activeTab === 'dataset' ? 'rgba(255, 183, 3, 0.15)' : 'transparent',
            color: activeTab === 'dataset' ? 'var(--accent-amber)' : 'var(--text-secondary)',
            border: activeTab === 'dataset' ? '1px solid rgba(255, 183, 3, 0.35)' : '1px solid transparent',
            borderRadius: 'var(--radius-sm)'
          }}
          title="Sign Language MNIST Archive Dataset Lab"
        >
          <Database size={14} />
          <span>Dataset Lab</span>
        </button>
      </div>

      {/* TAB CONTENT 1: LIVE PARAGRAPHS */}
      {activeTab === 'paragraphs' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={15} color="var(--accent-cyan)" />
                <span>Live Translation Stream</span>
              </h4>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Signs synthesized into complete, cohesive paragraphs
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => {
                  const allText = messages.map(m => m.text).join('\n\n');
                  handleCopyText(allText, 'all-paragraphs');
                }}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                title="Copy all paragraphs"
              >
                {copiedId === 'all-paragraphs' ? <Check size={12} color="#00ffa3" /> : <Copy size={12} />}
                <span>Copy</span>
              </button>
              <button
                onClick={onClearMessages}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                title="Clear transcript"
              >
                Clear
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-secondary)' }}>
                <Hand size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <p style={{ fontSize: '0.86rem', fontWeight: 600 }}>No live translation yet</p>
                <p style={{ fontSize: '0.76rem' }}>
                  Perform ASL gestures in front of the camera or test signs in the Dataset Lab to generate paragraphs.
                </p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    padding: '12px 14px',
                    background: msg.sender === 'signer' ? 'rgba(0, 240, 255, 0.04)' : 'rgba(157, 78, 221, 0.04)',
                    border: msg.sender === 'signer' ? '1px solid rgba(0, 240, 255, 0.2)' : '1px solid rgba(157, 78, 221, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                    <span style={{ fontWeight: 700, color: msg.sender === 'signer' ? 'var(--accent-emerald)' : '#d8b4fe' }}>
                      {msg.sender === 'signer' ? 'Deaf Signer' : 'Hearing Speaker'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                    {msg.text}
                  </p>

                  {/* Sign gloss badges */}
                  {msg.rawGlosses && msg.rawGlosses.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                      {msg.rawGlosses.map((g, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.66rem',
                            padding: '1px 6px',
                            background: 'rgba(0, 240, 255, 0.1)',
                            border: '1px solid rgba(0, 240, 255, 0.25)',
                            borderRadius: '4px',
                            color: 'var(--accent-cyan)',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                    <button
                      onClick={() => AudioEngine.speak(msg.text)}
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                      title="Speak paragraph aloud"
                    >
                      <Volume2 size={12} color="var(--accent-cyan)" />
                      <span>Speak</span>
                    </button>
                    <button
                      onClick={() => handleCopyText(msg.text, msg.id)}
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                      title="Copy paragraph"
                    >
                      {copiedId === msg.id ? <Check size={12} color="#00ffa3" /> : <Copy size={12} />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: AUTOMATED LECTURE NOTES */}
      {activeTab === 'notes' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={15} color="var(--accent-emerald)" />
                <span>Automated Live Notes</span>
              </h4>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Generated in real time as translation occurs
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleExportNotes}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                title="Download notes as Markdown file"
              >
                <Download size={12} />
                <span>Export</span>
              </button>
              <button
                onClick={() => {
                  const md = NotesService.exportNotesToMarkdown(autoNotes);
                  handleCopyText(md, 'all-notes');
                }}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                title="Copy all notes"
              >
                {copiedId === 'all-notes' ? <Check size={12} color="#00ffa3" /> : <Copy size={12} />}
                <span>Copy</span>
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {autoNotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-secondary)' }}>
                <FileText size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <p style={{ fontSize: '0.86rem', fontWeight: 600 }}>Notes will generate automatically</p>
                <p style={{ fontSize: '0.76rem' }}>
                  Key discussion points, sign gloss vocabulary, and action items will populate here dynamically.
                </p>
              </div>
            ) : (
              autoNotes.map(note => {
                const isTopic = note.category === 'topic';
                const isGloss = note.category === 'gloss';
                const isAction = note.category === 'action';

                const borderCol = isTopic
                  ? 'rgba(0, 240, 255, 0.3)'
                  : isGloss
                  ? 'rgba(0, 255, 163, 0.3)'
                  : isAction
                  ? 'rgba(255, 183, 3, 0.3)'
                  : 'rgba(255, 255, 255, 0.12)';

                const bgCol = isTopic
                  ? 'rgba(0, 240, 255, 0.04)'
                  : isGloss
                  ? 'rgba(0, 255, 163, 0.04)'
                  : isAction
                  ? 'rgba(255, 183, 3, 0.04)'
                  : 'rgba(255, 255, 255, 0.02)';

                return (
                  <div
                    key={note.id}
                    style={{
                      padding: '12px 14px',
                      background: bgCol,
                      border: `1px solid ${borderCol}`,
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: isTopic ? 'var(--accent-cyan)' : isGloss ? 'var(--accent-emerald)' : isAction ? 'var(--accent-amber)' : 'var(--text-secondary)'
                        }}
                      >
                        {isTopic ? '📌 Topic Summary' : isGloss ? '🤟 ASL Vocabulary' : isAction ? '✅ Action Item' : '💡 Key Point'}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {note.timeFormatted}
                      </span>
                    </div>

                    <h5 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {note.title}
                    </h5>

                    <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.45, color: 'var(--text-secondary)' }}>
                      {note.content}
                    </p>

                    {note.signGlosses && note.signGlosses.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {note.signGlosses.map((g, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.64rem',
                              padding: '1px 6px',
                              background: 'rgba(0, 255, 163, 0.1)',
                              border: '1px solid rgba(0, 255, 163, 0.25)',
                              borderRadius: '4px',
                              color: 'var(--accent-emerald)',
                              fontFamily: 'var(--font-mono)'
                            }}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: COMMON CHAT */}
      {activeTab === 'common-chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={15} color="#d8b4fe" />
              <span>Common Classroom Chat</span>
            </h4>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Visible to all participants in this room
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {commonMessages.map(msg => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '8px 12px',
                    background: isMe ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: isMe ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isMe ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>
                    {msg.text}
                  </p>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleSendCommonChat}
            style={{
              padding: '10px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.15)'
            }}
          >
            <input
              type="text"
              value={commonChatInput}
              onChange={e => setCommonChatInput(e.target.value)}
              placeholder="Send message to everyone..."
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem'
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '8px 12px' }}
              title="Send"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT 4: PERSONAL CHAT (1-ON-1) */}
      {activeTab === 'personal-chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Recipient Picker */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Chat with:</span>
            <select
              value={selectedRecipient?.id || ''}
              onChange={e => {
                const found = participants.find(p => p.id === e.target.value);
                if (found) setSelectedRecipient(found);
              }}
              style={{
                flex: 1,
                padding: '6px 10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem'
              }}
            >
              {participants.filter(p => p.id !== currentUser.id).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {personalMessages
              .filter(m => (m.senderId === currentUser.id && m.recipientId === selectedRecipient?.id) || (m.senderId === selectedRecipient?.id && m.recipientId === currentUser.id))
              .map(msg => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '8px 12px',
                      background: isMe ? 'rgba(58, 134, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: isMe ? '1px solid rgba(58, 134, 255, 0.3)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isMe ? '#60a5fa' : 'var(--text-primary)' }}>
                        {isMe ? 'You' : msg.senderName}
                      </span>
                      <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>
                      {msg.text}
                    </p>
                  </div>
                );
              })}
          </div>

          <form
            onSubmit={handleSendPersonalChat}
            style={{
              padding: '10px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.15)'
            }}
          >
            <input
              type="text"
              value={personalChatInput}
              onChange={e => setPersonalChatInput(e.target.value)}
              placeholder={`Private message to ${selectedRecipient?.name || 'user'}...`}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem'
              }}
            />
            <button
              type="submit"
              className="btn btn-secondary"
              style={{ padding: '8px 12px', background: 'rgba(58, 134, 255, 0.2)', color: '#60a5fa' }}
              title="Send Direct Message"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT 5: SIGN LANGUAGE MNIST ARCHIVE DATASET LAB */}
      {activeTab === 'dataset' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '14px', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={15} color="var(--accent-amber)" />
                <span>Sign Language MNIST Archive</span>
              </h4>
              <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>
                27,455 Samples
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Direct access to the 28x28 ASL alphabet dataset. Test & identify signs in real-time.
            </p>
          </div>

          {/* Letter Selector Grid (24 Letters A-Y) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Select ASL Letter from Dataset:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
              {ASL_LETTERS.map(letter => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  style={{
                    padding: '6px 2px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: selectedLetter === letter ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                    background: selectedLetter === letter ? 'rgba(255, 183, 3, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedLetter === letter ? 'var(--accent-amber)' : 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {/* Active Sample Preview & Classifier */}
          <div
            style={{
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Letter &ldquo;{selectedLetter}&rdquo; Archive Sample
              </span>
              <button
                onClick={handleRandomTest}
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.68rem', gap: '4px' }}
                title="Pick random test sample"
              >
                <RefreshCw size={11} />
                <span>Random Test</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* 28x28 Canvas Preview */}
              <div
                style={{
                  width: 84,
                  height: 84,
                  border: '2px solid var(--border-accent)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <canvas
                  ref={sampleCanvasRef}
                  width={84}
                  height={84}
                  style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
                />
              </div>

              <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {ASL_LETTER_DESCRIPTIONS[selectedLetter] || 'ASL hand gesture'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.68rem' }}>
                  Sample ID: {activeSample?.sampleId || 'Sample 1'} • 28×28 Grayscale
                </p>

                {datasetSamples.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0' }}>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Variations:</span>
                    {datasetSamples.map(s => (
                      <button
                        key={s.sampleId}
                        onClick={() => setActiveSample(s)}
                        style={{
                          padding: '1px 6px',
                          fontSize: '0.66rem',
                          borderRadius: '3px',
                          border: activeSample?.sampleId === s.sampleId ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                          background: activeSample?.sampleId === s.sampleId ? 'rgba(255, 183, 3, 0.2)' : 'transparent',
                          color: activeSample?.sampleId === s.sampleId ? 'var(--accent-amber)' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        #{s.sampleId.split('-')[1] || s.sampleId}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button
                    onClick={() => activeSample && handleIdentifySample(activeSample)}
                    disabled={isClassifying || !activeSample}
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                  >
                    <Sparkles size={12} />
                    <span>{isClassifying ? 'Analyzing...' : 'Identify Sign'}</span>
                  </button>

                  <button
                    onClick={() => onInjectSignGloss(selectedLetter)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                    title="Send to Live Paragraphs"
                  >
                    <span>Insert to Meet</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            </div>

            {/* Classification Prediction Display */}
            {datasetClassifyResult && (
              <div
                style={{
                  marginTop: '6px',
                  padding: '8px 10px',
                  background: 'rgba(0, 255, 163, 0.08)',
                  border: '1px solid rgba(0, 255, 163, 0.3)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    Prediction: Letter &ldquo;{datasetClassifyResult.predictedLetter}&rdquo;
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>
                    {Math.round(datasetClassifyResult.confidence * 100)}% Confidence
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {datasetClassifyResult.topPredictions.map((pred, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      <span>Rank #{i + 1}: Letter {pred.letter}</span>
                      <span>{Math.round(pred.score * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reference Image Links */}
          <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Dataset Reference Chart:
            </span>
            <img
              src="/dataset/american_sign_language.PNG"
              alt="ASL Reference Chart from dataset archive"
              style={{ width: '100%', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
    </aside>
  );
};
