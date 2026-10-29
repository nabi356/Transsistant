import type { HandLandmark } from '../types';

/**
 * Robust MediaPipe loader that resolves Hands from:
 * 1. window.Hands (CDN script injected in index.html)
 * 2. @mediapipe/hands dynamic import (supporting both ESM and CJS default exports)
 */
export async function getHandsConstructor(): Promise<any> {
  const win = typeof window !== 'undefined' ? (window as any) : {};
  if (typeof win.Hands === 'function') {
    return win.Hands;
  }

  try {
    const mod = await import('@mediapipe/hands');
    const candidate =
      (mod as any).Hands ||
      (mod as any).default?.Hands ||
      (typeof (mod as any).default === 'function' ? (mod as any).default : null);

    if (typeof candidate === 'function') {
      return candidate;
    }
  } catch (err) {
    console.warn('Dynamic import of @mediapipe/hands failed:', err);
  }

  return win.Hands || null;
}

/**
 * Create and configure an instance of MediaPipe Hands
 */
export async function createHandsInstance(
  onResultsCallback: (results: { multiHandLandmarks?: HandLandmark[][] }) => void
): Promise<any> {
  const HandsCtor = await getHandsConstructor();
  if (!HandsCtor) {
    console.warn('MediaPipe Hands constructor is unavailable in this environment.');
    return null;
  }

  try {
    const hands = new HandsCtor({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.65
    });

    hands.onResults(onResultsCallback);
    return hands;
  } catch (err) {
    console.error('Failed to create MediaPipe Hands instance:', err);
    return null;
  }
}

/**
 * Reliable requestAnimationFrame frame pump for sending video frames to MediaPipe Hands.
 * Does not invoke navigator.mediaDevices.getUserMedia again, avoiding AbortError
 * and multiple stream contention.
 */
export function startHandTrackingLoop(
  video: HTMLVideoElement,
  hands: any,
  isActiveRef: { current: boolean }
): () => void {
  let animId: number | null = null;
  let isSending = false;

  const processFrame = async () => {
    if (!isActiveRef.current) return;

    if (
      video &&
      !video.paused &&
      !video.ended &&
      video.readyState >= 2 && // HAVE_CURRENT_DATA or higher
      hands &&
      !isSending
    ) {
      isSending = true;
      try {
        await hands.send({ image: video });
      } catch {
        // Suppress frame transmission errors during resizing or component unmounting
      } finally {
        isSending = false;
      }
    }

    if (isActiveRef.current) {
      animId = requestAnimationFrame(processFrame);
    }
  };

  animId = requestAnimationFrame(processFrame);

  return () => {
    if (animId !== null) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  };
}
