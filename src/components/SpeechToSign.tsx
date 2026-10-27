import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Pause, SkipBack, SkipForward, Sparkles, MessageSquare, Info } from 'lucide-react';
import { SignVisualizer } from './SignVisualizer';
import { NebiusService } from '../services/nebiusService';
import type { TranslationMessage } from '../types';

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: () => void;
  onresult: (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechToSignProps {
  onNewMessage: (msg: TranslationMessage) => void;
}

export const SpeechToSign: React.FC<SpeechToSignProps> = ({ onNewMessage }) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // ASL Breakdown results from Nemotron
  const [currentGlosses, setCurrentGlosses] = useState<string[]>(['HELLO', 'I_LOVE_YOU', 'THANK_YOU']);
  const [aslExplanation, setAslExplanation] = useState<string>(
    'In ASL, greet with an open hand, followed by spatial sign positioning and warm eye contact.'
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1800); // ms per sign

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const playTimerRef = useRef<number | null>(null);

  // Cycle animation steps
  useEffect(() => {
    if (isPlaying && currentGlosses.length > 0) {
      playTimerRef.current = window.setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= currentGlosses.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, playSpeed);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, currentGlosses, playSpeed]);

  // Speech Recognition setup (Web Speech API)
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current && typeof recognitionRef.current.stop === 'function') {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    setRecognitionError(null);
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setRecognitionError('Speech recognition is not supported in this browser. Please type your message below.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        processSpokenSentence(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: { error: string }) => {
        console.error('Speech recognition error:', event);
        setRecognitionError(`Recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error(err);
      setRecognitionError('Could not start microphone.');
      setIsListening(false);
    }
  };

  // Convert spoken sentence into ASL grammar with NVIDIA Nemotron
  const processSpokenSentence = async (textToProcess?: string) => {
    const query = (textToProcess || inputText).trim();
    if (!query || isProcessing) return;

    setIsProcessing(true);
    try {
      const res = await NebiusService.translateSpeechToSignGuide(query);
      
      // Clean and normalize glosses to matching known signs if possible
      const normalizedGlosses = res.glosses.map(g => {
        const upper = g.toUpperCase().replace(/[^A-Z_]/g, '');
        if (upper.includes('HELLO')) return 'HELLO';
        if (upper.includes('LOVE')) return 'I_LOVE_YOU';
        if (upper.includes('THANK')) return 'THANK_YOU';
        if (upper.includes('WATER')) return 'WATER';
        if (upper.includes('HELP')) return 'HELP_SOS';
        if (upper.includes('YES')) return 'YES';
        if (upper.includes('NO')) return 'NO';
        return upper || 'HELLO';
      });

      setCurrentGlosses(normalizedGlosses.length > 0 ? normalizedGlosses : ['HELLO']);
      setAslExplanation(res.explanation);
      setCurrentStepIndex(0);
      setIsPlaying(true);

      // Log to conversation history
      const newMsg: TranslationMessage = {
        id: `msg-${Date.now()}`,
        sender: 'speaker',
        text: query,
        rawGlosses: normalizedGlosses,
        timestamp: Date.now(),
        modelUsed: res.model,
        latencyMs: res.latencyMs
      };
      onNewMessage(newMsg);
      setInputText('');
    } catch (err) {
      console.error('Failed to translate speech to sign:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeSignId = currentGlosses[currentStepIndex] || 'HELLO';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1.3fr)', gap: '20px', padding: '0 20px 20px 20px' }}>
      {/* Left Column: Speech Input & ASL Breakdown */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="#00f0ff" />
              <span>Hearing Partner Speech Input</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Speak or type to generate animated sign language gestures & ASL grammar.
            </p>
          </div>
        </div>

        {/* Input Bar with Mic & Send */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && processSpokenSentence()}
              placeholder={isListening ? 'Listening to voice...' : 'Type spoken sentence (e.g. "Can I help you find water?")...'}
              style={{
                width: '100%',
                background: 'rgba(5, 8, 15, 0.8)',
                border: isListening ? '1px solid #00ffa3' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '0.9rem',
                color: '#ffffff',
                outline: 'none',
                boxShadow: isListening ? 'var(--glow-emerald)' : 'none',
                transition: 'all 0.2s ease'
              }}
              id="input-speech-to-sign"
            />
          </div>

          <button
            onClick={toggleListening}
            className={`btn btn-icon ${isListening ? 'btn-danger' : 'btn-secondary'}`}
            title={isListening ? 'Stop Listening' : 'Speak into Microphone'}
            id="btn-toggle-mic"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            onClick={() => processSpokenSentence()}
            disabled={!inputText.trim() || isProcessing}
            className="btn btn-primary"
            style={{ padding: '0 18px' }}
            id="btn-submit-speech-to-sign"
          >
            <Sparkles size={16} />
            <span>{isProcessing ? 'Analyzing...' : 'Translate'}</span>
          </button>
        </div>

        {recognitionError && (
          <div style={{ fontSize: '0.8rem', color: '#ff4d6d', background: 'rgba(255, 0, 84, 0.1)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
            {recognitionError}
          </div>
        )}

        {/* Quick Example Sentences */}
        <div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
            Try Quick Conversational Prompts
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              'Hello, nice to meet you!',
              'Do you need medical help or water?',
              'Thank you so much for your assistance.',
              'I am happy to communicate with you.'
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => {
                  setInputText(prompt);
                  processSpokenSentence(prompt);
                }}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.82rem', textAlign: 'left' }}
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Nemotron ASL Linguistic Breakdown Card */}
        <div style={{ background: 'rgba(10, 15, 28, 0.7)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: 'var(--radius-md)', padding: '14px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Info size={15} color="#00f0ff" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              Nemotron ASL Grammar Breakdown
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
            {aslExplanation}
          </p>
        </div>
      </div>

      {/* Right Column: Animated Hand Skeletal Avatar & Timeline Player */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pulse-dot" style={{ background: '#00f0ff' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
              Live Sign Avatar Guide
            </span>
          </div>
          <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
            Sign {currentStepIndex + 1} of {currentGlosses.length}
          </span>
        </div>

        {/* 2D/3D Animated Hand Skeletal Avatar */}
        <SignVisualizer signId={activeSignId} width={340} height={310} showLabels={false} />

        {/* Active Sign Title & Highlight */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00ffa3', letterSpacing: '0.04em' }}>
            {activeSignId.replace(/_/g, ' ')}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Topic-Comment Sign Token
          </span>
        </div>

        {/* Playback Controls */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Timeline Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px' }}>
            {currentGlosses.map((gloss, idx) => (
              <button
                key={`${gloss}-${idx}`}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setIsPlaying(false);
                }}
                style={{
                  background: idx === currentStepIndex ? 'linear-gradient(135deg, #00f0ff, #00ffa3)' : 'rgba(255, 255, 255, 0.08)',
                  color: idx === currentStepIndex ? '#060a12' : '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {gloss}
              </button>
            ))}
          </div>

          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
              disabled={currentStepIndex === 0}
              className="btn btn-secondary btn-icon"
              title="Previous Sign"
            >
              <SkipBack size={16} />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn btn-primary btn-icon"
              style={{ width: 48, height: 48 }}
              title={isPlaying ? 'Pause' : 'Play Sign Sequence'}
              id="btn-play-sign-sequence"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
            </button>

            <button
              onClick={() => setCurrentStepIndex(prev => Math.min(currentGlosses.length - 1, prev + 1))}
              disabled={currentStepIndex === currentGlosses.length - 1}
              className="btn btn-secondary btn-icon"
              title="Next Sign"
            >
              <SkipForward size={16} />
            </button>

            {/* Speed Selector */}
            <select
              value={playSpeed}
              onChange={e => setPlaySpeed(Number(e.target.value))}
              style={{
                background: 'rgba(20, 28, 48, 0.8)',
                color: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 8px',
                fontSize: '0.78rem',
                outline: 'none',
                marginLeft: '8px'
              }}
            >
              <option value={2400}>Slow (0.5x)</option>
              <option value={1800}>Normal (1.0x)</option>
              <option value={1000}>Fast (1.5x)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
