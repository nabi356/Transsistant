import React, { useEffect, useRef } from 'react';
import type { HandLandmark } from '../types';
import { getCanonicalHandPose, HAND_CONNECTIONS, LM } from '../services/gestureEngine';

interface SignVisualizerProps {
  signId?: string;
  landmarks?: HandLandmark[];
  width?: number;
  height?: number;
  showLabels?: boolean;
}

export const SignVisualizer: React.FC<SignVisualizerProps> = ({
  signId = 'HELLO',
  landmarks,
  width = 300,
  height = 300,
  showLabels = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPtsRef = useRef<HandLandmark[]>([]);
  const targetPtsRef = useRef<HandLandmark[]>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Determine target points
    const pts = landmarks || getCanonicalHandPose(signId);
    targetPtsRef.current = pts;

    if (currentPtsRef.current.length === 0) {
      currentPtsRef.current = pts.map(p => ({ ...p }));
    }
  }, [signId, landmarks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      // Smooth interpolation towards target points
      if (currentPtsRef.current.length === targetPtsRef.current.length && targetPtsRef.current.length >= 21) {
        for (let i = 0; i < currentPtsRef.current.length; i++) {
          currentPtsRef.current[i].x += (targetPtsRef.current[i].x - currentPtsRef.current[i].x) * 0.22;
          currentPtsRef.current[i].y += (targetPtsRef.current[i].y - currentPtsRef.current[i].y) * 0.22;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Background subtle grid
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      const pts = currentPtsRef.current;
      if (pts.length >= 21) {
        ctx.save();
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw bones
        HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
          const p1 = pts[startIdx];
          const p2 = pts[endIdx];
          ctx.beginPath();
          ctx.moveTo(p1.x * width, p1.y * height);
          ctx.lineTo(p2.x * width, p2.y * height);

          // Gradient effect
          const grad = ctx.createLinearGradient(
            p1.x * width, p1.y * height,
            p2.x * width, p2.y * height
          );
          grad.addColorStop(0, '#00f0ff');
          grad.addColorStop(1, '#00ffa3');
          ctx.strokeStyle = grad;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.stroke();
        });

        // Draw joints & fingertips
        pts.forEach((p, idx) => {
          const x = p.x * width;
          const y = p.y * height;
          const isFingertip = [LM.THUMB_TIP, LM.INDEX_TIP, LM.MIDDLE_TIP, LM.RING_TIP, LM.PINKY_TIP].includes(idx);
          const isWrist = idx === LM.WRIST;

          ctx.beginPath();
          ctx.arc(x, y, isFingertip ? 7 : isWrist ? 8 : 4.5, 0, 2 * Math.PI);
          ctx.fillStyle = isFingertip ? '#00ffa3' : isWrist ? '#9d4edd' : '#ffffff';
          ctx.shadowColor = isFingertip ? '#00ffa3' : '#00f0ff';
          ctx.shadowBlur = isFingertip ? 16 : 8;
          ctx.fill();

          // Outer halo on fingertips
          if (isFingertip) {
            ctx.beginPath();
            ctx.arc(x, y, 11, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(0, 255, 163, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [height, width]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          background: 'radial-gradient(circle, rgba(14, 22, 38, 0.95) 0%, rgba(8, 11, 18, 0.95) 100%)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8), 0 8px 24px rgba(0, 0, 0, 0.4)'
        }}
      />
      {showLabels && (
        <span style={{ marginTop: '8px', fontSize: '0.78rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          Canonical Pose: {signId}
        </span>
      )}
    </div>
  );
};
