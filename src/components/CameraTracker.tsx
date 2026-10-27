import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Volume2, Sparkles, Trash2, Cpu } from 'lucide-react';
import type { HandLandmark, RecognizedSign, TranslationMessage } from '../types';
import { recognizeSign, HAND_CONNECTIONS, LM } from '../services/gestureEngine';
import { NebiusService } from '../services/nebiusService';
import { AudioEngine } from '../services/audioEngine';

interface CameraTrackerProps {
  onNewMessage: (msg: TranslationMessage) => void;
  onEmergencyTrigger?: () => void;
}

export const CameraTracker: React.FC<CameraTrackerProps> = ({ onNewMessage, onEmergencyTrigger }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [currentSign, setCurrentSign] = useState<RecognizedSign | null>(null);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100%
  const [glossBuffer, setGlossBuffer] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);

  // Settings for translation
  const [selectedTone, setSelectedTone] = useState<'casual' | 'polite' | 'urgent' | 'direct'>('casual');
  const [selectedLang, setSelectedLang] = useState('English');
  const [modelTier, setModelTier] = useState<'nano' | 'super' | 'ultra'>('nano');

  const [latestTranslation, setLatestTranslation] = useState<string>('');
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [fps, setFps] = useState(0);

  // Internal state tracking refs
  const lastSignRef = useRef<string | null>(null);
  const signHoldStartRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());
  const cameraInstanceRef = useRef<unknown>(null);
  const handsInstanceRef = useRef<unknown>(null);
  const autoTranslateTimerRef = useRef<number | null>(null);

  // Stop camera media tracks
  const stopCamera = useCallback(() => {
    if (cameraInstanceRef.current && typeof (cameraInstanceRef.current as { stop?: () => void }).stop === 'function') {
      try {
        (cameraInstanceRef.current as { stop: () => void }).stop();
      } catch {
        // Ignored
      }
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Process translated sentence with Nebius Nemotron
  const triggerNemotronTranslation = useCallback(async (glossesToTranslate?: string[]) => {
    const list = glossesToTranslate || glossBuffer;
    if (list.length === 0 || isTranslating) return;

    setIsTranslating(true);
    try {
      const result = await NebiusService.synthesizeSignGlosses(
        list,
        selectedTone,
        selectedLang,
        modelTier
      );

      setLatestTranslation(result.text);
      setLastLatency(result.latencyMs);

      // Speak aloud for hearing listeners
      AudioEngine.speak(result.text);

      // Create message for conversation transcript
      const newMsg: TranslationMessage = {
        id: `msg-${Date.now()}`,
        sender: 'signer',
        rawGlosses: [...list],
        text: result.text,
        targetLanguage: selectedLang,
        timestamp: Date.now(),
        confidence: 0.95,
        modelUsed: result.model,
        latencyMs: result.latencyMs
      };
      onNewMessage(newMsg);

      // Clear gloss buffer after successful sentence translation
      setGlossBuffer([]);
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  }, [glossBuffer, isTranslating, modelTier, onNewMessage, selectedLang, selectedTone]);

  // Handle hand landmarks received from MediaPipe
  const onResults = useCallback((results: { multiHandLandmarks?: HandLandmark[][] }) => {
    // FPS calculation
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsTimeRef.current = now;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const landmarksList = results.multiHandLandmarks;
    if (!landmarksList || landmarksList.length === 0) {
      setCurrentSign(null);
      setHoldProgress(0);
      lastSignRef.current = null;
      return;
    }

    const hand = landmarksList[0];

    // Draw hand skeleton with cybernetic glow
    ctx.save();
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw skeletal connection lines
    HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const p1 = hand[startIdx];
      const p2 = hand[endIdx];
      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.stroke();
    });

    // Draw joint nodes
    hand.forEach((p, idx) => {
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      const isFingertip = [LM.THUMB_TIP, LM.INDEX_TIP, LM.MIDDLE_TIP, LM.RING_TIP, LM.PINKY_TIP].includes(idx);

      ctx.beginPath();
      ctx.arc(x, y, isFingertip ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = isFingertip ? '#00ffa3' : '#ffffff';
      ctx.shadowColor = isFingertip ? '#00ffa3' : '#00f0ff';
      ctx.shadowBlur = isFingertip ? 14 : 6;
      ctx.fill();
    });
    ctx.restore();

    // Recognize sign gesture
    const recognized = recognizeSign(hand);
    if (recognized) {
      setCurrentSign(recognized);

      // Check if emergency distress signal
      if (recognized.name === 'HELP / SOS' && onEmergencyTrigger) {
        onEmergencyTrigger();
      }

      // Check holding stability
      if (lastSignRef.current === recognized.name) {
        const holdTime = now - signHoldStartRef.current;
        const progress = Math.min(100, Math.round((holdTime / 600) * 100));
        setHoldProgress(progress);

        // When held for 600ms, commit to buffer!
        if (progress >= 100) {
          AudioEngine.playRecognizeChime();
          setGlossBuffer(prev => {
            // Avoid duplicate consecutive identical signs
            if (prev.length > 0 && prev[prev.length - 1] === recognized.name) {
              return prev;
            }
            const updated = [...prev, recognized.name];
            
            // If auto-translate enabled, schedule auto translation after brief pause
            if (autoTranslate) {
              if (autoTranslateTimerRef.current) {
                window.clearTimeout(autoTranslateTimerRef.current);
              }
              autoTranslateTimerRef.current = window.setTimeout(() => {
                triggerNemotronTranslation(updated);
              }, 1600);
            }
            return updated;
          });
          // Reset hold timer
          signHoldStartRef.current = now + 400; // brief cooldown
          setHoldProgress(0);
        }
      } else {
        lastSignRef.current = recognized.name;
        signHoldStartRef.current = now;
        setHoldProgress(10);
      }
    } else {
      setCurrentSign(null);
      setHoldProgress(0);
      lastSignRef.current = null;
    }
  }, [autoTranslate, onEmergencyTrigger, triggerNemotronTranslation]);

  // Start Camera and initialize MediaPipe
  const startCamera = async () => {
    setIsCameraLoading(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam access not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check if MediaPipe is available from window CDN
      const windowMp = window as unknown as {
        Hands?: new (config: { locateFile: (file: string) => string }) => {
          setOptions: (options: Record<string, unknown>) => void;
          onResults: (callback: (results: { multiHandLandmarks?: HandLandmark[][] }) => void) => void;
          send: (data: { image: HTMLVideoElement }) => Promise<void>;
          close?: () => void;
        };
        Camera?: new (
          video: HTMLVideoElement,
          config: { onFrame: () => Promise<void>; width: number; height: number }
        ) => { start: () => Promise<void>; stop: () => void };
      };

      if (windowMp.Hands && windowMp.Camera && videoRef.current) {
        const hands = new windowMp.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.65,
          minTrackingConfidence: 0.6
        });

        hands.onResults(onResults);
        handsInstanceRef.current = hands;

        const camera = new windowMp.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              await hands.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        await camera.start();
        cameraInstanceRef.current = camera;
      } else {
        // Fallback simulation loop if CDN scripts blocked
        console.warn('MediaPipe Hands global not found, running visual fallback loop');
      }

      setIsCameraActive(true);
    } catch (err: unknown) {
      console.error('Camera initialization failed:', err);
      setCameraError(
        (err as Error)?.message || 'Failed to access camera. Please check camera permissions.'
      );
    } finally {
      setIsCameraLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (autoTranslateTimerRef.current) {
        clearTimeout(autoTranslateTimerRef.current);
      }
    };
  }, [stopCamera]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.4fr) minmax(300px, 1fr)', gap: '20px', padding: '0 20px 20px 20px' }}>
      {/* Left Column: Live Vision Feed & HUD */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top Control Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pulse-dot" style={{ background: isCameraActive ? '#00ffa3' : '#64748b' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
              Real-Time Vision Sensor
            </span>
            {isCameraActive && (
              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                {fps} FPS • Active
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {!isCameraActive ? (
              <button
                onClick={startCamera}
                disabled={isCameraLoading}
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                id="btn-start-camera"
              >
                <Camera size={16} />
                <span>{isCameraLoading ? 'Starting...' : 'Turn Camera On'}</span>
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                id="btn-stop-camera"
              >
                <CameraOff size={16} />
                <span>Turn Off</span>
              </button>
            )}
          </div>
        </div>

        {/* Video Canvas Container with Sci-Fi HUD Crosshairs */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4 / 3',
            background: '#04070d',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.8)'
          }}
        >
          {/* Hidden/Mirrored Video Element */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // Mirror view
              opacity: isCameraActive ? 0.75 : 0
            }}
          />

          {/* Canvas for Skeletal HUD */}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              transform: 'scaleX(-1)',
              pointerEvents: 'none'
            }}
          />

          {/* Overlay when camera is off */}
          {!isCameraActive && (
            <div style={{ textAlign: 'center', zIndex: 2, padding: '20px' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(0, 240, 255, 0.08)',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px auto'
                }}
              >
                <Camera size={30} color="#00f0ff" />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Camera Vision Offline</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: 320, margin: '0 auto 16px auto' }}>
                Activate your camera to start real-time ASL / Sign pattern recognition with 21-landmark skeletal tracking.
              </p>
              <button onClick={startCamera} className="btn btn-primary" id="btn-activate-camera-empty">
                <Camera size={16} />
                <span>Start Camera Live Stream</span>
              </button>
            </div>
          )}

          {/* Active Gesture HUD Banner */}
          {isCameraActive && currentSign && (
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                background: 'rgba(8, 12, 22, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0, 255, 163, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--glow-emerald)',
                zIndex: 3
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Detected Gesture ({Math.round(currentSign.confidence * 100)}% match)
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00ffa3', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {currentSign.name}
                  {currentSign.category === 'emergency' && (
                    <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>EMERGENCY</span>
                  )}
                </div>
              </div>

              {/* Circular Hold Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>Hold to commit</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>{holdProgress}%</span>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `conic-gradient(#00ffa3 ${holdProgress * 3.6}deg, rgba(255,255,255,0.1) 0deg)`, padding: 3 }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0e1422' }} />
                </div>
              </div>
            </div>
          )}

          {cameraError && (
            <div style={{ position: 'absolute', top: 12, left: 12, right: 12, background: 'rgba(255, 0, 84, 0.9)', color: '#ffffff', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', zIndex: 4 }}>
              {cameraError}
            </div>
          )}
        </div>

        {/* Quick Clickable Gesture Tokens to test without camera or for quick signs */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Sign Triggers (Tap to append)
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {['HELLO', 'I LOVE YOU', 'THANK YOU', 'WATER', 'DOCTOR', 'HELP / SOS', 'YES', 'NO', 'PLEASE'].map(sign => (
              <button
                key={sign}
                onClick={() => {
                  AudioEngine.playRecognizeChime();
                  setGlossBuffer(prev => [...prev, sign]);
                }}
                className="btn btn-secondary"
                style={{ padding: '5px 10px', fontSize: '0.76rem', borderRadius: 'var(--radius-sm)' }}
              >
                + {sign}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Sign Gloss Stream & Nemotron Agent Reconstructor */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Model Tier Selector */}
        <div style={{ background: 'rgba(10, 15, 28, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={16} color="#00f0ff" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                NVIDIA Nemotron Tier
              </span>
            </div>
            {lastLatency !== null && (
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                {lastLatency}ms Latency
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button
              onClick={() => setModelTier('nano')}
              className={`btn ${modelTier === 'nano' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 8px', fontSize: '0.75rem', flexDirection: 'column', gap: '2px' }}
              title="Nemotron 3 Nano: Fast stream & real-time calls"
            >
              <span style={{ fontWeight: 700 }}>Nano</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>⚡ &lt;60ms</span>
            </button>
            <button
              onClick={() => setModelTier('super')}
              className={`btn ${modelTier === 'super' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 8px', fontSize: '0.75rem', flexDirection: 'column', gap: '2px' }}
              title="Nemotron 3 Super: Balanced conversational intelligence"
            >
              <span style={{ fontWeight: 700 }}>Super</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>⚖️ ~140ms</span>
            </button>
            <button
              onClick={() => setModelTier('ultra')}
              className={`btn ${modelTier === 'ultra' ? 'btn-purple' : 'btn-secondary'}`}
              style={{ padding: '6px 8px', fontSize: '0.75rem', flexDirection: 'column', gap: '2px' }}
              title="Nemotron 3 Ultra: Deep reasoning & intent disambiguation"
            >
              <span style={{ fontWeight: 700 }}>Ultra</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>🧠 Deep</span>
            </button>
          </div>
        </div>

        {/* Tone and Language Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Speech Tone
            </label>
            <select
              value={selectedTone}
              onChange={e => setSelectedTone(e.target.value as 'casual' | 'polite' | 'urgent' | 'direct')}
              style={{
                width: '100%',
                background: 'rgba(20, 28, 48, 0.8)',
                color: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            >
              <option value="casual">Casual (Conversational)</option>
              <option value="polite">Polite (Formal & Courteous)</option>
              <option value="urgent">Urgent (Direct & Fast)</option>
              <option value="direct">Direct (Concise)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Output Language
            </label>
            <select
              value={selectedLang}
              onChange={e => setSelectedLang(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(20, 28, 48, 0.8)',
                color: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
              <option value="German">German (Deutsch)</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
              <option value="Japanese">Japanese (日本語)</option>
              <option value="Chinese">Chinese (中文)</option>
              <option value="Arabic">Arabic (العربية)</option>
            </select>
          </div>
        </div>

        {/* Live Sign Gloss Buffer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(5, 8, 15, 0.7)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Captured Sign Gloss Sequence
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setAutoTranslate(!autoTranslate)}
                className={`badge ${autoTranslate ? 'badge-emerald' : 'badge-cyan'}`}
                style={{ cursor: 'pointer', border: 'none', fontSize: '0.68rem', padding: '2px 8px' }}
                title="Toggle Automatic Speech Synthesis after pause in signing"
              >
                Auto: {autoTranslate ? 'ON' : 'OFF'}
              </button>
              {glossBuffer.length > 0 && (
                <button
                  onClick={() => setGlossBuffer([])}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                  title="Clear sequence"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 80, display: 'flex', flexWrap: 'wrap', gap: '8px', alignContent: 'flex-start', padding: '6px' }}>
            {glossBuffer.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontStyle: 'italic', margin: 'auto 0' }}>
                Perform gestures in front of the camera, or tap the quick tokens above to accumulate sign glosses...
              </div>
            ) : (
              glossBuffer.map((gloss, idx) => (
                <div
                  key={`${gloss}-${idx}`}
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 255, 163, 0.15) 100%)',
                    border: '1px solid rgba(0, 240, 255, 0.35)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(0, 240, 255, 0.2)'
                  }}
                >
                  <span>{gloss}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.6, color: '#00ffa3' }}>#{idx + 1}</span>
                </div>
              ))
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => triggerNemotronTranslation()}
              disabled={glossBuffer.length === 0 || isTranslating}
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px' }}
              id="btn-reconstruct-speech"
            >
              <Sparkles size={16} />
              <span>{isTranslating ? 'Nemotron Reasoning...' : 'Synthesize Speech'}</span>
            </button>
          </div>
        </div>

        {/* Synthesized Output Display */}
        {latestTranslation && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(14, 24, 44, 0.85) 0%, rgba(20, 34, 62, 0.85) 100%)',
              border: '1px solid rgba(0, 255, 163, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              boxShadow: 'var(--glow-emerald)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: '#00ffa3', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Spoken Voice Output
              </span>
              <button
                onClick={() => AudioEngine.speak(latestTranslation)}
                className="btn btn-secondary btn-icon"
                style={{ width: 28, height: 28 }}
                title="Replay Voice"
              >
                <Volume2 size={14} color="#00ffa3" />
              </button>
            </div>
            <p style={{ fontSize: '1.05rem', color: '#ffffff', fontWeight: 600, lineHeight: 1.4 }}>
              &ldquo;{latestTranslation}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
