import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, Award, Sparkles, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SIGN_CATALOG, evaluateUserSign, HAND_CONNECTIONS, LM } from '../services/gestureEngine';
import { SignVisualizer } from './SignVisualizer';
import { NebiusService } from '../services/nebiusService';
import { AudioEngine } from '../services/audioEngine';
import type { HandLandmark, CoachingFeedback, SignPattern } from '../types';

export const PatternCoach: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Daily Words' | 'Alphabet' | 'Emergency' | 'Numbers'>('All');
  const [selectedSign, setSelectedSign] = useState<SignPattern>(SIGN_CATALOG[0]);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<CoachingFeedback>({
    score: 0,
    isMatch: false,
    accuracyLabel: 'No Hand Detected',
    tips: ['Start your camera and place your hand in frame to practice this sign!']
  });

  const [aiCoachTip, setAiCoachTip] = useState<string>('');
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [holdMatchProgress, setHoldMatchProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matchHoldStartRef = useRef<number>(0);
  const cameraInstanceRef = useRef<unknown>(null);
  const handsInstanceRef = useRef<unknown>(null);

  // Filter catalog by category
  const filteredSigns = selectedCategory === 'All'
    ? SIGN_CATALOG
    : SIGN_CATALOG.filter(s => s.category === selectedCategory);

  // Fetch Nemotron AI coaching advice
  const fetchAiCoachFeedback = useCallback(async (sign: SignPattern, currentNotes: string) => {
    setIsCoachLoading(true);
    try {
      const res = await NebiusService.generateSignCoachingFeedback(sign.label, currentNotes);
      setAiCoachTip(res.text);
    } catch {
      setAiCoachTip('Keep fingers relaxed and maintain steady palm orientation facing the sensor.');
    } finally {
      setIsCoachLoading(false);
    }
  }, []);

  // Update feedback when user changes sign
  useEffect(() => {
    setHoldMatchProgress(0);
    fetchAiCoachFeedback(selectedSign, selectedSign.description);
  }, [fetchAiCoachFeedback, selectedSign]);

  // Handle hand landmark frame from MediaPipe
  const onResults = useCallback((results: { multiHandLandmarks?: HandLandmark[][] }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const landmarksList = results.multiHandLandmarks;
    if (!landmarksList || landmarksList.length === 0) {
      setFeedback({
        score: 0,
        isMatch: false,
        accuracyLabel: 'No Hand Detected',
        tips: ['Position your hand within the camera frame with good lighting.']
      });
      setHoldMatchProgress(0);
      matchHoldStartRef.current = 0;
      return;
    }

    const hand = landmarksList[0];

    // Draw skeletal lines
    ctx.save();
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const p1 = hand[startIdx];
      const p2 = hand[endIdx];
      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.stroke();
    });

    hand.forEach((p, idx) => {
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      const isFingertip = [LM.THUMB_TIP, LM.INDEX_TIP, LM.MIDDLE_TIP, LM.RING_TIP, LM.PINKY_TIP].includes(idx);
      ctx.beginPath();
      ctx.arc(x, y, isFingertip ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = isFingertip ? '#00ffa3' : '#ffffff';
      ctx.shadowColor = '#00ffa3';
      ctx.shadowBlur = 10;
      ctx.fill();
    });
    ctx.restore();

    // Evaluate live user hand pose against selected target sign
    const evalResult = evaluateUserSign(selectedSign.id, hand);
    setFeedback(evalResult);

    const now = Date.now();
    if (evalResult.isMatch) {
      if (matchHoldStartRef.current === 0) {
        matchHoldStartRef.current = now;
      }
      const elapsed = now - matchHoldStartRef.current;
      const progress = Math.min(100, Math.round((elapsed / 1600) * 100));
      setHoldMatchProgress(progress);

      if (progress >= 100) {
        // Successful hold celebration!
        AudioEngine.playSuccessFanfare();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setStreakCount(s => s + 1);
        matchHoldStartRef.current = now + 1200; // brief cooldown
        setHoldMatchProgress(0);
      }
    } else {
      matchHoldStartRef.current = 0;
      setHoldMatchProgress(0);
    }
  }, [selectedSign]);

  // Start Camera
  const startCamera = async () => {
    setIsCameraLoading(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam not supported.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

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
      }

      setIsCameraActive(true);
    } catch (err) {
      console.error(err);
      setCameraError('Camera access required for live gesture feedback.');
    } finally {
      setIsCameraLoading(false);
    }
  };

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

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(360px, 1fr) minmax(320px, 1fr)', gap: '16px', padding: '0 20px 20px 20px' }}>
      {/* Column 1: Sign Pattern Library Selector */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={16} color="#00f0ff" />
            <span>Pattern Library</span>
          </h2>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Choose a sign to practice & verify
          </span>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {(['All', 'Daily Words', 'Alphabet', 'Emergency', 'Numbers'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'linear-gradient(135deg, #00f0ff, #00ffa3)' : 'rgba(255, 255, 255, 0.06)',
                color: selectedCategory === cat ? '#040810' : '#ffffff',
                border: 'none',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List of signs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          {filteredSigns.map(sign => {
            const isSelected = selectedSign.id === sign.id;
            return (
              <div
                key={sign.id}
                onClick={() => setSelectedSign(sign)}
                style={{
                  background: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'rgba(10, 15, 28, 0.6)',
                  border: isSelected ? '1px solid #00f0ff' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#00ffa3' : '#ffffff' }}>
                    {sign.label}
                  </span>
                  <span className={`badge ${sign.category === 'Emergency' ? 'badge-amber' : 'badge-cyan'}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                    {sign.category}
                  </span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {sign.landmarksHint}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Column 2: Target Sign Canonical Blueprint & Guide */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
              Target Sign Blueprint
            </span>
            <h2 style={{ fontSize: '1.3rem', color: '#ffffff', margin: 0 }}>
              {selectedSign.label}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={18} color="#ffb703" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffb703' }}>
              Streak: {streakCount}
            </span>
          </div>
        </div>

        {/* 2D/3D Canonical Model Visualizer */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SignVisualizer signId={selectedSign.id} width={310} height={270} />
        </div>

        {/* Step-by-Step Instructions */}
        <div style={{ background: 'rgba(5, 8, 15, 0.7)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
            Kinesthetic Execution Guide
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {selectedSign.guideSteps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: '#e2e8f0' }}>
                <span style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* NVIDIA Nemotron AI Coaching Tip */}
        <div style={{ background: 'rgba(157, 78, 221, 0.1)', border: '1px solid rgba(157, 78, 221, 0.35)', borderRadius: 'var(--radius-md)', padding: '12px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Sparkles size={14} color="#d8b4fe" />
            <span style={{ fontSize: '0.74rem', color: '#c084fc', fontWeight: 700, textTransform: 'uppercase' }}>
              Nemotron Coach Guidance
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#f1f5f9', margin: 0, fontStyle: 'italic' }}>
            {isCoachLoading ? 'Nemotron analyzing posture requirements...' : aiCoachTip}
          </p>
        </div>
      </div>

      {/* Column 3: Live Camera Practice & Real-Time Accuracy Meter */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot" style={{ background: isCameraActive ? '#00ffa3' : '#64748b' }} />
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>
              Your Live Pose Practice
            </span>
          </div>
          {!isCameraActive ? (
            <button onClick={startCamera} disabled={isCameraLoading} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
              <Camera size={14} />
              <span>{isCameraLoading ? 'Starting...' : 'Turn On'}</span>
            </button>
          ) : (
            <button onClick={stopCamera} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.78rem' }}>
              <CameraOff size={14} />
              <span>Turn Off</span>
            </button>
          )}
        </div>

        {/* Video Canvas Container */}
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
            justifyContent: 'center'
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              opacity: isCameraActive ? 0.75 : 0
            }}
          />
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

          {!isCameraActive && (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <Camera size={28} color="#94a3b8" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                Activate camera to get live accuracy scoring.
              </p>
              <button onClick={startCamera} className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
                Start Live Practice
              </button>
            </div>
          )}

          {cameraError && (
            <div style={{ position: 'absolute', top: 8, left: 8, right: 8, background: 'rgba(255, 0, 84, 0.9)', color: '#ffffff', padding: '6px 10px', borderRadius: 6, fontSize: '0.75rem' }}>
              {cameraError}
            </div>
          )}
        </div>

        {/* Real-Time Accuracy Meter */}
        <div style={{ background: 'rgba(10, 15, 28, 0.7)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Alignment Score
            </span>
            <span
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: feedback.score >= 85 ? '#00ffa3' : feedback.score >= 60 ? '#ffb703' : '#ff4d6d'
              }}
            >
              {feedback.score}% • {feedback.accuracyLabel}
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: 10, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 5, overflow: 'hidden', marginBottom: '10px' }}>
            <div
              style={{
                width: `${feedback.score}%`,
                height: '100%',
                background: feedback.score >= 85 ? 'linear-gradient(90deg, #00f0ff, #00ffa3)' : feedback.score >= 60 ? '#ffb703' : '#ff0054',
                transition: 'width 0.15s ease',
                boxShadow: feedback.score >= 85 ? 'var(--glow-emerald)' : 'none'
              }}
            />
          </div>

          {/* Hold to Confirm Success Meter */}
          {feedback.isMatch && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 255, 163, 0.15)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0, 255, 163, 0.3)' }}>
              <span style={{ fontSize: '0.75rem', color: '#00ffa3', fontWeight: 600 }}>
                Hold pose steady to lock in streak!
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
                {holdMatchProgress}%
              </span>
            </div>
          )}

          {/* Corrective Tips */}
          <div style={{ marginTop: '10px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
              Live Corrective Feedback
            </span>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
              {feedback.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
