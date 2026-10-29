import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Copy, Check,
  Share2, Plus, Sparkles, Smile, Disc, StopCircle,
  Key, Cpu, AlertCircle, RefreshCw, Hand
} from 'lucide-react';
import type { HandLandmark, RecognizedSign, TranslationMessage, UserProfile, Participant, MeetingRoom, RecordedClass } from '../types';
import { recognizeSign, HAND_CONNECTIONS, LM, SIGN_CATALOG } from '../services/gestureEngine';
import { NebiusService } from '../services/nebiusService';
import { AudioEngine } from '../services/audioEngine';
import { ResizableSidebar } from './ResizableSidebar';
import { createHandsInstance, startHandTrackingLoop } from '../services/mediapipeService';
import { SignVisualizer } from './SignVisualizer';

interface LiveMeetViewProps {
  currentUser: UserProfile;
  messages: TranslationMessage[];
  onNewMessage: (msg: TranslationMessage) => void;
  onClearMessages: () => void;
  onSaveRecordedClass: (recorded: RecordedClass) => void;
  onSwitchToRecorded: () => void;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  leftPercent: number;
}

export const LiveMeetView: React.FC<LiveMeetViewProps> = ({
  currentUser,
  messages,
  onNewMessage,
  onClearMessages,
  onSaveRecordedClass,
  onSwitchToRecorded
}) => {
  // Meeting Room Information
  const [room, setRoom] = useState<MeetingRoom>({
    id: 'room-1',
    code: 'TRANS-8492',
    joinLink: window.location.origin + '?meet=TRANS-8492',
    title: 'ASL Inclusive Classroom: Sign Language Syntax & Machine Translation',
    hostName: 'Prof. Sarah Jenkins',
    startedAt: Date.now() - 1000 * 60 * 15,
    isRecording: false
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [inputJoinCode, setInputJoinCode] = useState('');

  // Meeting Media Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showReactionsBar, setShowReactionsBar] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Resizable Sidebar width state
  const [sidebarWidth, setSidebarWidth] = useState(420);

  // Camera & Hand Tracking State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const isActiveRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const onResultsRef = useRef<(results: any) => void>(() => {});
  const showLandmarksRef = useRef<boolean>(true);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [demoActiveSign, setDemoActiveSign] = useState<string>('HELLO');

  // Keep showLandmarksRef in sync with showLandmarks state
  useEffect(() => {
    showLandmarksRef.current = showLandmarks;
  }, [showLandmarks]);

  // Active Sign Tracking & Synthesis
  const [currentSign, setCurrentSign] = useState<RecognizedSign | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [glossBuffer, setGlossBuffer] = useState<string[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Participants
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: currentUser.id,
      name: `${currentUser.name} (You)`,
      role: currentUser.role,
      avatar: currentUser.avatar || 'ME',
      isMuted,
      isVideoOff,
      hasHandRaised: isHandRaised,
      isSpeaking: !isMuted
    },
    {
      id: 'sarah-1',
      name: 'Prof. Sarah Jenkins',
      role: 'teacher',
      avatar: 'SJ',
      isMuted: false,
      isVideoOff: false,
      hasHandRaised: false,
      isSpeaking: true
    },
    {
      id: 'alex-1',
      name: 'Alex Rivera (ASL Interpreter)',
      role: 'interpreter',
      avatar: 'AR',
      isMuted: true,
      isVideoOff: false,
      hasHandRaised: false,
      isSpeaking: false
    },
    {
      id: 'elena-1',
      name: 'Elena Rostova',
      role: 'student',
      avatar: 'ER',
      isMuted: true,
      isVideoOff: false,
      hasHandRaised: false,
      isSpeaking: false
    }
  ]);

  // Sync current user states with participants list
  useEffect(() => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === currentUser.id
          ? { ...p, isMuted, isVideoOff, hasHandRaised: isHandRaised, isSpeaking: !isMuted }
          : p
      )
    );
  }, [currentUser.id, isMuted, isVideoOff, isHandRaised]);

  // Recording Timer
  useEffect(() => {
    let timer: any = null;
    if (isRecording) {
      timer = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // MediaPipe Hands setup
  const lastSignRef = useRef<string | null>(null);
  const signHoldStartRef = useRef<number>(0);

  // Synthesize buffer into complete paragraph
  const triggerParagraphSynthesis = useCallback(async (glossesToTranslate?: string[]) => {
    const list = glossesToTranslate || glossBuffer;
    if (list.length === 0 || isSynthesizing) return;

    setIsSynthesizing(true);
    try {
      const result = await NebiusService.synthesizeSignGlosses(
        list,
        'casual',
        'English',
        'nano'
      );

      // Create new translation message for the live paragraph stream
      const newMsg: TranslationMessage = {
        id: `msg-${Date.now()}`,
        sender: 'signer',
        rawGlosses: [...list],
        text: result.text,
        targetLanguage: 'English',
        timestamp: Date.now(),
        confidence: 0.95,
        modelUsed: result.model,
        latencyMs: result.latencyMs
      };

      onNewMessage(newMsg);
      AudioEngine.speak(result.text);
      setGlossBuffer([]);
    } catch (err) {
      console.error('Synthesis error:', err);
    } finally {
      setIsSynthesizing(false);
    }
  }, [glossBuffer, isSynthesizing, onNewMessage]);

  // Handle hand landmark frame from MediaPipe
  const onResults = useCallback((results: { multiHandLandmarks?: HandLandmark[][] }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Draw hand landmarks if enabled
      if (showLandmarksRef.current) {
        // Draw bones
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
          const p1 = landmarks[startIdx];
          const p2 = landmarks[endIdx];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
            ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
            ctx.stroke();
          }
        });

        // Draw joint circles
        landmarks.forEach((p, idx) => {
          ctx.beginPath();
          ctx.arc(p.x * canvas.width, p.y * canvas.height, idx === LM.WRIST ? 5 : 3.5, 0, 2 * Math.PI);
          ctx.fillStyle = idx === LM.THUMB_TIP || idx === LM.INDEX_TIP ? '#00ffa3' : '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#050a12';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }

      // Recognize sign gesture
      const recognized = recognizeSign(landmarks);
      const now = Date.now();

      if (recognized) {
        if (lastSignRef.current === recognized.name) {
          const elapsed = now - signHoldStartRef.current;
          const progress = Math.min(100, Math.round((elapsed / 700) * 100));
          setHoldProgress(progress);

          if (progress >= 100) {
            setGlossBuffer(prev => {
              if (prev[prev.length - 1] !== recognized.name) {
                return [...prev, recognized.name];
              }
              return prev;
            });
            signHoldStartRef.current = now;
            setHoldProgress(0);
          }
        } else {
          lastSignRef.current = recognized.name;
          signHoldStartRef.current = now;
          setHoldProgress(0);
        }
        setCurrentSign(recognized);
      } else {
        lastSignRef.current = null;
        setHoldProgress(0);
        setCurrentSign(null);
      }
    } else {
      lastSignRef.current = null;
      setHoldProgress(0);
      setCurrentSign(null);
    }
  }, []);

  // Keep onResultsRef updated
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  // Start MediaPipe camera
  const startCamera = useCallback(async () => {
    if (isActiveRef.current || isStartingRef.current) return;
    isStartingRef.current = true;
    setIsCameraLoading(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth || 1280;
            canvasRef.current.height = videoRef.current.videoHeight || 720;
          }
        };

        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play interrupted:', playErr);
        }
      }

      isActiveRef.current = true;
      setIsCameraActive(true);

      // Initialize MediaPipe hands detection
      const hands = await createHandsInstance((results) => {
        onResultsRef.current(results);
      });

      if (hands && videoRef.current && isActiveRef.current) {
        handsRef.current = hands;
        stopLoopRef.current = startHandTrackingLoop(videoRef.current, hands, isActiveRef);
      }
    } catch (err: any) {
      console.warn('Camera initiation failed:', err);
      const errMsg = err?.name === 'NotAllowedError'
        ? 'Camera permission denied. Allow camera access in browser to see your live feed.'
        : err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError'
        ? 'No webcam detected on your device. Interactive demo signer mode enabled.'
        : 'Webcam unavailable. Interactive demo signer mode enabled.';
      setCameraError(errMsg);
      setIsCameraActive(false);
    } finally {
      isStartingRef.current = false;
      setIsCameraLoading(false);
    }
  }, []);

  // Stop camera media tracks & tracking loop
  const stopCamera = useCallback(() => {
    isActiveRef.current = false;
    isStartingRef.current = false;

    if (stopLoopRef.current) {
      try { stopLoopRef.current(); } catch { }
      stopLoopRef.current = null;
    }

    if (handsRef.current?.close) {
      try { handsRef.current.close(); } catch { }
      handsRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(t => t.stop());
      } catch { }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setIsCameraActive(false);
  }, []);

  // Initialize camera when meet begins or when video toggled
  useEffect(() => {
    if (!isVideoOff) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isVideoOff, startCamera, stopCamera]);

  // Demo Signer trigger for interactive testing without a camera
  const handleTriggerDemoSign = (signId: string) => {
    setDemoActiveSign(signId);
    const signMeta = SIGN_CATALOG.find(s => s.id === signId);
    const signLabel = signMeta ? signMeta.label : signId;

    const catMap: Record<string, 'alphabet' | 'word' | 'emergency' | 'number'> = {
      'Emergency': 'emergency',
      'Alphabet': 'alphabet',
      'Numbers': 'number',
      'Daily Words': 'word'
    };
    const mappedCategory = signMeta ? (catMap[signMeta.category] || 'word') : 'word';

    setCurrentSign({
      name: signLabel,
      confidence: 0.98,
      timestamp: Date.now(),
      category: mappedCategory,
      description: signMeta ? signMeta.description : 'Demo ASL gesture'
    });
    setHoldProgress(100);

    setGlossBuffer(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === signId) return prev;
      return [...prev, signId];
    });

    AudioEngine.playRecognizeChime();
    setTimeout(() => {
      setHoldProgress(0);
    }, 400);
  };

  // Auto-translate buffer when user stops adding signs for 1.8 seconds
  useEffect(() => {
    if (glossBuffer.length === 0) return;
    const timer = setTimeout(() => {
      triggerParagraphSynthesis();
    }, 1800);
    return () => clearTimeout(timer);
  }, [glossBuffer, triggerParagraphSynthesis]);

  // Copy helpers
  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(room.joinLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Join Room by Code
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputJoinCode.trim()) return;
    setRoom(prev => ({
      ...prev,
      code: inputJoinCode.toUpperCase().trim(),
      joinLink: `${window.location.origin}?meet=${inputJoinCode.toUpperCase().trim()}`
    }));
    setIsJoinCodeModalOpen(false);
    setInputJoinCode('');
  };

  // Create New Room
  const handleCreateNewRoom = () => {
    const randomCode = `TRANS-${Math.floor(1000 + Math.random() * 9000)}`;
    setRoom({
      id: `room-${Date.now()}`,
      code: randomCode,
      joinLink: `${window.location.origin}?meet=${randomCode}`,
      title: 'Transisstant ASL Meeting Session',
      hostName: currentUser.name,
      startedAt: Date.now(),
      isRecording: false
    });
  };

  // Trigger floating reaction
  const triggerReaction = (emoji: string) => {
    const id = `react-${Date.now()}-${Math.random()}`;
    const leftPercent = 15 + Math.random() * 70;
    setFloatingReactions(prev => [...prev, { id, emoji, leftPercent }]);

    // Broadcast in common chat as well
    if (emoji === '✋') {
      setIsHandRaised(prev => !prev);
    }

    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2400);
  };

  // Recording Start / Stop
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      // Save recorded lecture into recorded classes library
      setIsRecording(false);
      const minutes = Math.floor(recordingSeconds / 60);
      const seconds = recordingSeconds % 60;
      const durationStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      const newRecordedClass: RecordedClass = {
        id: `rec-${Date.now()}`,
        title: room.title,
        instructor: room.hostName,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        duration: durationStr,
        tag: 'Live Recorded Session',
        transcript: messages.map((m, idx) => ({
          id: m.id,
          time: new Date(m.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          seconds: idx * 25,
          speaker: m.sender === 'signer' ? 'Deaf Signer' : 'Hearing Speaker',
          text: m.text,
          glosses: m.rawGlosses
        })),
        notes: [
          {
            id: `note-${Date.now()}-1`,
            timestamp: Date.now(),
            timeFormatted: '00:00',
            category: 'topic',
            title: `Recorded Class: ${room.title}`,
            content: `Captured session with ${messages.length} live signed exchanges and full synchronised transcript.`,
            signGlosses: glossBuffer
          }
        ]
      };

      onSaveRecordedClass(newRecordedClass);
      alert(`Class recording saved! You can watch it anytime in the "Recorded Classes" tab.`);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', overflow: 'hidden' }}>
      {/* Top Meeting Room Status & Invite Bar */}
      <div
        style={{
          padding: '8px 20px',
          background: 'rgba(5, 8, 15, 0.4)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot" style={{ background: '#00ffa3' }} />
            <h3 style={{ fontSize: '0.92rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>
              {room.title}
            </h3>
          </div>

          {/* Recording Indicator */}
          {isRecording && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 8px',
                background: 'rgba(255, 0, 84, 0.15)',
                border: '1px solid rgba(255, 0, 84, 0.4)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.74rem',
                color: '#ff4d6d'
              }}
            >
              <span className="pulse-dot" style={{ background: '#ff0054' }} />
              <span>REC {formatTime(recordingSeconds)}</span>
            </div>
          )}
        </div>

        {/* Meeting Invite Link & Code Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Room Code Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem'
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>Code:</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              {room.code}
            </span>
            <button
              onClick={handleCopyCode}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-cyan)', padding: 0 }}
              title="Copy Room Code"
            >
              {copiedCode ? <Check size={13} color="#00ffa3" /> : <Copy size={13} />}
            </button>
          </div>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.74rem' }}
            title="Copy Direct Join Link"
          >
            <Share2 size={13} />
            <span>{copiedLink ? 'Copied Link!' : 'Share Link'}</span>
          </button>

          {/* Join with Code */}
          <button
            onClick={() => setIsJoinCodeModalOpen(true)}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.74rem' }}
            title="Enter another room code"
          >
            <Key size={13} />
            <span>Join with Code</span>
          </button>

          {/* New Room */}
          <button
            onClick={handleCreateNewRoom}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.74rem' }}
            title="Generate a new classroom meet"
          >
            <Plus size={13} />
            <span>New Meet</span>
          </button>

          {/* Switch to Recorded Classes */}
          <button
            onClick={onSwitchToRecorded}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.74rem', background: 'rgba(157, 78, 221, 0.15)', color: '#d8b4fe', borderColor: 'rgba(157, 78, 221, 0.3)' }}
          >
            <Disc size={13} />
            <span>Recorded Library</span>
          </button>
        </div>
      </div>

      {/* Main Classroom Stage Area + Resizable Sidebar */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {/* Left: Video Stage & Participants Grid */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '14px',
            gap: '12px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.1)'
          }}
        >
          {cameraError && (
            <div
              style={{
                padding: '8px 14px',
                background: 'rgba(255, 183, 3, 0.12)',
                border: '1px solid rgba(255, 183, 3, 0.35)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} />
                <span>{cameraError}</span>
              </div>
              <button
                onClick={startCamera}
                disabled={isCameraLoading}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.72rem', gap: '4px' }}
              >
                <RefreshCw size={12} className={isCameraLoading ? 'spin' : ''} />
                <span>{isCameraLoading ? 'Connecting...' : 'Retry Webcam'}</span>
              </button>
            </div>
          )}

          {/* Main Presenter Video Tile (Active Signer with MediaPipe) */}
          <div
            className={`video-tile ${!isMuted ? 'speaking' : ''} ${isHandRaised ? 'hand-raised' : ''}`}
            style={{
              flex: 1,
              minHeight: '360px',
              position: 'relative',
              background: '#04070e',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Live Camera Video & Real-time Skeleton Canvas */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: 'scaleX(-1)', // Mirror for intuitive signing
                display: !isVideoOff && isCameraActive ? 'block' : 'none'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: 'scaleX(-1)',
                pointerEvents: 'none',
                display: !isVideoOff && isCameraActive ? 'block' : 'none'
              }}
            />

            {/* Video Turned Off State */}
            {isVideoOff && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: '#ffffff'
                  }}
                >
                  {currentUser.avatar || 'U'}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                    {currentUser.name}
                  </p>
                  <span className="badge" style={{ marginTop: '4px', background: 'rgba(255, 255, 255, 0.1)' }}>
                    Video Turned Off
                  </span>
                </div>
                <button
                  onClick={() => setIsVideoOff(false)}
                  className="btn btn-primary"
                  style={{ marginTop: '4px', padding: '6px 14px', fontSize: '0.78rem', gap: '6px' }}
                >
                  <Video size={14} />
                  <span>Turn Video On</span>
                </button>
              </div>
            )}

            {/* Camera Connecting / Loading State */}
            {!isVideoOff && isCameraLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', zIndex: 5 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '3px solid rgba(0, 240, 255, 0.2)',
                    borderTopColor: 'var(--accent-cyan)',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    Initializing Camera & AI Hand Tracking...
                  </p>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Connecting webcam feed and calibrating gesture recognition
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Demo Signer Mode (When Webcam is Unavailable or in Demo Mode) */}
            {!isVideoOff && !isCameraActive && !isCameraLoading && (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  zIndex: 4
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                    padding: '4px 12px',
                    background: 'rgba(0, 240, 255, 0.12)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.76rem',
                    color: 'var(--accent-cyan)'
                  }}
                >
                  <Hand size={14} />
                  <span style={{ fontWeight: 600 }}>Interactive ASL Signer Active</span>
                </div>

                {/* Animated Hand Gesture Visualization */}
                <SignVisualizer signId={demoActiveSign} width={280} height={200} />

                {/* Quick Interactive Sign Buttons to Test Machine Translation */}
                <div style={{ marginTop: '12px', textAlign: 'center', maxWidth: '520px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Test ASL signs to generate paragraph translations with NVIDIA Nemotron:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                    {[
                      { id: 'HELLO', label: '👋 HELLO' },
                      { id: 'THANK_YOU', label: '🙏 THANK YOU' },
                      { id: 'HELP_SOS', label: '🆘 HELP / SOS' },
                      { id: 'I_LOVE_YOU', label: '🤟 I LOVE YOU' },
                      { id: 'YES', label: '👍 YES' },
                      { id: 'NO', label: '👎 NO' },
                      { id: 'WATER', label: '💧 WATER' }
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleTriggerDemoSign(s.id)}
                        className="btn btn-secondary"
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.74rem',
                          background: demoActiveSign === s.id ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          borderColor: demoActiveSign === s.id ? 'var(--accent-cyan)' : 'var(--border-subtle)'
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tile Info Badge */}
            <div className="tile-badge">
              <span style={{ fontWeight: 700 }}>{currentUser.name} (Active Signer)</span>
              {isMuted && <MicOff size={13} color="#ff0054" />}
              {isHandRaised && <span title="Hand Raised">✋ Hand Raised</span>}
            </div>

            {/* Top Right Live Sign Recognition Overlay */}
            {currentSign && !isVideoOff && (
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  padding: '8px 14px',
                  background: 'rgba(5, 8, 15, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--glow-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  zIndex: 10
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="pulse-dot" style={{ background: '#00ffa3' }} />
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {currentSign.name}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: 'rgba(255, 255, 255, 0.15)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${holdProgress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))',
                        transition: 'width 0.05s linear'
                      }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {Math.round(currentSign.confidence * 100)}%
                </span>
              </div>
            )}

            {/* Gloss Buffer Live Pill Strip */}
            {glossBuffer.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 50,
                  left: 14,
                  right: 14,
                  padding: '8px 12px',
                  background: 'rgba(5, 8, 15, 0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>Signing Buffer:</span>
                  {glossBuffer.map((g, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '2px 8px',
                        background: 'rgba(0, 240, 255, 0.15)',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--accent-cyan)',
                        fontSize: '0.74rem',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => triggerParagraphSynthesis()}
                  disabled={isSynthesizing}
                  className="btn btn-primary"
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                >
                  <Sparkles size={12} />
                  <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize Now'}</span>
                </button>
              </div>
            )}

            {/* Floating Emojis Layer */}
            {floatingReactions.map(r => (
              <span
                key={r.id}
                className="floating-emoji"
                style={{ left: `${r.leftPercent}%`, bottom: '60px' }}
              >
                {r.emoji}
              </span>
            ))}
          </div>

          {/* Secondary Participant Tiles Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', height: '110px' }}>
            {participants.filter(p => p.id !== currentUser.id).map(p => (
              <div
                key={p.id}
                className={`video-tile ${p.isSpeaking ? 'speaking' : ''} ${p.hasHandRaised ? 'hand-raised' : ''}`}
                style={{ height: '100%', background: '#0a0f1d' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: p.role === 'teacher' ? 'rgba(0, 255, 163, 0.2)' : p.role === 'interpreter' ? 'rgba(157, 78, 221, 0.2)' : 'rgba(0, 240, 255, 0.2)',
                      border: p.role === 'teacher' ? '1px solid #00ffa3' : p.role === 'interpreter' ? '1px solid #9d4edd' : '1px solid #00f0ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#ffffff'
                    }}
                  >
                    {p.avatar}
                  </div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#f8fafc' }}>
                    {p.name.split(' ')[0]}
                  </span>
                </div>

                <div className="tile-badge" style={{ bottom: 6, left: 6, padding: '2px 6px', fontSize: '0.68rem' }}>
                  <span>{p.role.toUpperCase()}</span>
                  {p.isMuted && <MicOff size={10} color="#ff0054" />}
                  {p.hasHandRaised && <span>✋</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Meeting Control Toolbar */}
          <div
            style={{
              padding: '10px 16px',
              background: 'rgba(5, 8, 15, 0.65)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            {/* Audio & Video Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Mic Mute / Unmute */}
              <button
                onClick={() => setIsMuted(prev => !prev)}
                className={`btn ${isMuted ? 'btn-danger' : 'btn-secondary'} btn-icon`}
                title={isMuted ? 'Unmute Microphone (M)' : 'Mute Microphone (M)'}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Video Turn Off / On */}
              <button
                onClick={() => setIsVideoOff(prev => !prev)}
                className={`btn ${isVideoOff ? 'btn-danger' : 'btn-secondary'} btn-icon`}
                title={isVideoOff ? 'Turn Video On (V)' : 'Turn Video Off (V)'}
              >
                {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
              </button>

              {/* Hand Landmarks Toggle */}
              <button
                onClick={() => setShowLandmarks(prev => !prev)}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.78rem' }}
                title="Toggle MediaPipe Hand Skeleton Overlay"
              >
                <Cpu size={14} color={showLandmarks ? 'var(--accent-cyan)' : 'var(--text-secondary)'} />
                <span>{showLandmarks ? 'Landmarks ON' : 'Landmarks OFF'}</span>
              </button>
            </div>

            {/* Raise Hand & Emoji Reactions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
              {/* Raise Hand Button */}
              <button
                onClick={() => triggerReaction('✋')}
                className={`btn ${isHandRaised ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                title="Raise or Lower Hand"
              >
                <span style={{ fontSize: '1rem' }}>✋</span>
                <span>{isHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
              </button>

              {/* Emojis Reaction Launcher */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowReactionsBar(prev => !prev)}
                  className="btn btn-secondary btn-icon"
                  title="Emoji Reactions"
                >
                  <Smile size={18} color="var(--accent-amber)" />
                </button>

                {/* Reactions Popup Bar */}
                {showReactionsBar && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 50,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '8px 12px',
                      background: 'rgba(5, 8, 15, 0.95)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid var(--border-accent)',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      gap: '8px',
                      boxShadow: 'var(--glow-cyan)',
                      zIndex: 100
                    }}
                  >
                    {['✋', '👍', '👏', '❤️', '🔥', '❓', '👐'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          triggerReaction(emoji);
                          setShowReactionsBar(false);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '1.4rem',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease',
                          padding: '2px 4px'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.35)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        title={emoji === '👐' ? 'ASL Silent Applause' : emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Record Class Button */}
              <button
                onClick={toggleRecording}
                className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'}`}
                style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                title={isRecording ? 'Stop & Save Recording' : 'Record Class'}
              >
                {isRecording ? <StopCircle size={16} /> : <Disc size={16} color="#ff0054" />}
                <span>{isRecording ? `Stop REC (${formatTime(recordingSeconds)})` : 'Record Class'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Resizable Sidebar with Live Paragraphs, Notes, Chats, and Sign MNIST Dataset Lab */}
        <ResizableSidebar
          sidebarWidth={sidebarWidth}
          onWidthChange={setSidebarWidth}
          messages={messages}
          onClearMessages={onClearMessages}
          currentUser={currentUser}
          participants={participants}
          onInjectSignGloss={(gloss) => {
            setGlossBuffer(prev => [...prev, gloss]);
          }}
        />
      </div>

      {/* Join with Code Modal */}
      {isJoinCodeModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 15, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '400px', padding: '24px', background: 'var(--bg-card)' }}
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700 }}>
              Join Meeting with Room Code
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Enter the 6-character classroom code provided by your instructor or host.
            </p>

            <form onSubmit={handleJoinByCode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                value={inputJoinCode}
                onChange={e => setInputJoinCode(e.target.value)}
                placeholder="e.g. TRANS-8492"
                style={{
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsJoinCodeModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 16px' }}
                >
                  Enter Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
