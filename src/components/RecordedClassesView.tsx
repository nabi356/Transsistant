import React, { useState, useEffect } from 'react';
import {
  Play, Pause, RotateCcw, Volume2, Download, Search,
  Sparkles, ArrowLeft, Check, Copy
} from 'lucide-react';
import type { RecordedClass } from '../types';
import { AudioEngine } from '../services/audioEngine';
import { NotesService } from '../services/notesService';
import { SignVisualizer } from './SignVisualizer';

interface RecordedClassesViewProps {
  recordedClasses: RecordedClass[];
  onBackToLive: () => void;
}

export const RecordedClassesView: React.FC<RecordedClassesViewProps> = ({
  recordedClasses,
  onBackToLive
}) => {
  const [selectedClass, setSelectedClass] = useState<RecordedClass>(recordedClasses[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Playback timer simulation
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeSec(prev => {
          if (prev >= 180) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // When class changes, reset playback
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTimeSec(0);
  }, [selectedClass]);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filter transcript
  const filteredTranscript = selectedClass.transcript.filter(t =>
    t.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
    t.speaker.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
    (t.glosses && t.glosses.some(g => g.toLowerCase().includes(transcriptSearch.toLowerCase())))
  );

  // Find active transcript index based on currentTimeSec
  const activeTranscriptIndex = selectedClass.transcript.findIndex((t, idx) => {
    const nextT = selectedClass.transcript[idx + 1];
    if (!nextT) return true;
    return currentTimeSec >= t.seconds && currentTimeSec < nextT.seconds;
  });

  const handleExportNotes = () => {
    const md = NotesService.exportNotesToMarkdown(selectedClass.notes, selectedClass.title);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedClass.title.replace(/[^a-zA-Z0-9]/g, '_')}-Notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyNotes = () => {
    const md = NotesService.exportNotesToMarkdown(selectedClass.notes, selectedClass.title);
    navigator.clipboard.writeText(md);
    setCopiedNoteId('all-recorded-notes');
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', overflow: 'hidden' }}>
      {/* Header Bar */}
      <div
        style={{
          padding: '12px 20px',
          background: 'rgba(5, 8, 15, 0.4)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBackToLive}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
          >
            <ArrowLeft size={14} />
            <span>Return to Live Classroom</span>
          </button>

          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recorded Classes & Lecture Archive
            </h3>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Watch past sessions with synchronized sign captions and automated lecture summaries
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExportNotes}
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <Download size={13} />
            <span>Download Lecture Notes</span>
          </button>
        </div>
      </div>

      {/* Main Container: Left Class Selector + Center Player + Right Transcript & Notes */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left Column: Recorded Class List */}
        <div
          style={{
            width: '280px',
            borderRight: '1px solid var(--border-subtle)',
            background: 'var(--bg-glass)',
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Available Lectures ({recordedClasses.length})
          </span>

          {recordedClasses.map(cls => {
            const isSelected = cls.id === selectedClass.id;
            return (
              <div
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                    {cls.tag}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {cls.duration}
                  </span>
                </div>

                <h5 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                  {cls.title}
                </h5>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>{cls.instructor}</span>
                  <span>{cls.date}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center: Video Player & Timeline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '14px', overflowY: 'auto' }}>
          {/* Lecture Player Frame */}
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: '#04070e',
              border: '1px solid var(--border-subtle)',
              aspectRatio: '16 / 9',
              maxHeight: '420px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            {/* Visual Classroom Canvas simulation */}
            {isPlaying ? (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 8px',
                    background: 'rgba(0, 255, 163, 0.15)',
                    border: '1px solid rgba(0, 255, 163, 0.4)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    color: 'var(--accent-emerald)',
                    fontWeight: 600,
                    zIndex: 5
                  }}
                >
                  <span className="pulse-dot" style={{ background: 'var(--accent-emerald)' }} />
                  <span>PLAYING • ASL SYNCHRONIZED VIDEO STREAM</span>
                </div>

                {/* Animated ASL gesture for the current spoken segment */}
                <SignVisualizer
                  signId={
                    selectedClass.transcript[activeTranscriptIndex]?.glosses?.[0] || 'HELLO'
                  }
                  width={340}
                  height={240}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div
                  onClick={() => setIsPlaying(true)}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                    cursor: 'pointer',
                    boxShadow: 'var(--glow-cyan)',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  title="Play recorded session"
                >
                  <Play size={28} color="#ffffff" style={{ marginLeft: 3 }} />
                </div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                  {selectedClass.title}
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Lecturer: {selectedClass.instructor} • Recorded in High-Definition ASL
                </p>
              </div>
            )}

            {/* Synchronized Closed Caption Banner at bottom of player */}
            {selectedClass.transcript[activeTranscriptIndex] && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 20,
                  right: 20,
                  padding: '10px 16px',
                  background: 'rgba(5, 8, 15, 0.88)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'block', marginBottom: '2px' }}>
                  {selectedClass.transcript[activeTranscriptIndex].speaker}:
                </span>
                <p style={{ margin: 0, fontSize: '0.94rem', color: '#ffffff', fontWeight: 500 }}>
                  &ldquo;{selectedClass.transcript[activeTranscriptIndex].text}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Player Controls Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '12px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            {/* Scrubber Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {formatSeconds(currentTimeSec)}
              </span>
              <input
                type="range"
                min={0}
                max={180}
                value={currentTimeSec}
                onChange={e => setCurrentTimeSec(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {selectedClass.duration}
              </span>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setIsPlaying(prev => !prev)}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.84rem' }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isPlaying ? 'Pause' : 'Play Class'}</span>
                </button>

                <button
                  onClick={() => setCurrentTimeSec(0)}
                  className="btn btn-secondary btn-icon"
                  style={{ width: 34, height: 34 }}
                  title="Rewind to start"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {selectedClass.transcript[activeTranscriptIndex] && (
                <button
                  onClick={() => AudioEngine.speak(selectedClass.transcript[activeTranscriptIndex].text)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.76rem', gap: '6px' }}
                >
                  <Volume2 size={13} color="var(--accent-cyan)" />
                  <span>Speak Caption Aloud</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Synchronized Transcript & Automated Notes */}
        <div
          style={{
            width: '380px',
            borderLeft: '1px solid var(--border-subtle)',
            background: 'var(--bg-glass)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Transcript Search Bar */}
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
              <input
                type="text"
                value={transcriptSearch}
                onChange={e => setTranscriptSearch(e.target.value)}
                placeholder="Search transcript & sign glosses..."
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem'
                }}
              />
            </div>
          </div>

          {/* Transcript List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Synchronized Transcript ({filteredTranscript.length})
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Click to jump
              </span>
            </div>

            {filteredTranscript.map((t, idx) => {
              const isActive = idx === activeTranscriptIndex;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setCurrentTimeSec(t.seconds);
                    setIsPlaying(true);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: isActive ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ fontWeight: 700, color: t.speaker.includes('Deaf') ? 'var(--accent-emerald)' : '#d8b4fe' }}>
                      {t.speaker}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {t.time}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>
                    {t.text}
                  </p>

                  {t.glosses && t.glosses.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
                      {t.glosses.map((g, gIdx) => (
                        <span
                          key={gIdx}
                          style={{
                            fontSize: '0.62rem',
                            padding: '1px 5px',
                            background: 'rgba(0, 240, 255, 0.1)',
                            borderRadius: '3px',
                            color: 'var(--accent-cyan)',
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
            })}
          </div>

          {/* Class Notes Preview */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={12} color="var(--accent-emerald)" />
                <span>Automated Notes Summary</span>
              </span>
              <button
                onClick={handleCopyNotes}
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.68rem', gap: '4px' }}
              >
                {copiedNoteId === 'all-recorded-notes' ? <Check size={11} color="#00ffa3" /> : <Copy size={11} />}
                <span>Copy</span>
              </button>
            </div>

            <div style={{ maxHeight: '110px', overflowY: 'auto', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {selectedClass.notes.map(note => (
                <div key={note.id} style={{ marginBottom: '6px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{note.title}: </strong>
                  <span>{note.content}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
