import type { HandLandmark, RecognizedSign, CoachingFeedback, SignPattern } from '../types';

export const SIGN_CATALOG: SignPattern[] = [
  {
    id: 'HELLO',
    label: 'Hello / Greeting',
    category: 'Daily Words',
    description: 'Open flat hand with all 5 fingers extended, palm facing forward, gentle salute motion from temple.',
    guideSteps: [
      'Extend all five fingers straight and together',
      'Hold hand up near eye/temple level with palm facing forward',
      'Wave slightly outward to greet'
    ],
    landmarksHint: 'All 5 fingers extended, palm facing forward',
    difficulty: 'Beginner'
  },
  {
    id: 'THANK_YOU',
    label: 'Thank You',
    category: 'Daily Words',
    description: 'Flat hand starting with fingertips touching chin or lips, then moving gracefully forward towards the person.',
    guideSteps: [
      'Fingers flat together with thumb alongside',
      'Touch fingertips lightly to lips or chin',
      'Move hand outward and slightly downward toward the listener'
    ],
    landmarksHint: 'Flat hand, fingers extended together, outward chin motion',
    difficulty: 'Beginner'
  },
  {
    id: 'HELP_SOS',
    label: 'Help / SOS (Emergency)',
    category: 'Emergency',
    description: 'International Sign for Help: palm facing camera, tuck thumb into palm, then fold 4 fingers down over thumb (trapping thumb). Alternatively, closed fist resting on flat palm.',
    guideSteps: [
      'Show open palm facing the camera',
      'Tuck your thumb across into your palm',
      'Fold all four fingers down over your thumb to signal distress'
    ],
    landmarksHint: 'Thumb tucked inside folded fist / International Signal for Help',
    difficulty: 'Critical'
  },
  {
    id: 'I_LOVE_YOU',
    label: 'I Love You (ILY)',
    category: 'Daily Words',
    description: 'The iconic ASL sign: Thumb, Index finger, and Pinky finger fully extended, with Middle and Ring fingers curled into the palm.',
    guideSteps: [
      'Extend your thumb out to the side',
      'Point your index finger straight up',
      'Extend your pinky finger up',
      'Keep your middle and ring fingers curled down into your palm'
    ],
    landmarksHint: 'Thumb + Index + Pinky extended, Middle & Ring curled',
    difficulty: 'Beginner'
  },
  {
    id: 'YES',
    label: 'Yes / Agree',
    category: 'Daily Words',
    description: 'Make a fist with thumb resting over curled fingers and nod the fist up and down from the wrist like a head nodding.',
    guideSteps: [
      'Make a closed fist (ASL "S" shape)',
      'Tilt wrist forward and backward gently to mimic a head nod'
    ],
    landmarksHint: 'Closed fist with wrist tilting forward',
    difficulty: 'Beginner'
  },
  {
    id: 'NO',
    label: 'No / Disagree',
    category: 'Daily Words',
    description: 'Snap the index and middle fingers together against the thumb tip, with ring and pinky fingers curled.',
    guideSteps: [
      'Extend index and middle fingers together',
      'Bring thumb up to tap against index and middle finger pads',
      'Keep ring and pinky curled into palm'
    ],
    landmarksHint: 'Index + Middle pinched against Thumb tip',
    difficulty: 'Intermediate'
  },
  {
    id: 'WATER',
    label: 'Water',
    category: 'Daily Words',
    description: 'Form the ASL letter "W" (index, middle, and ring fingers extended and spread, thumb holding pinky) and tap index finger against chin twice.',
    guideSteps: [
      'Extend index, middle, and ring fingers spread apart',
      'Tuck thumb over pinky finger',
      'Tap side of index finger gently to your chin'
    ],
    landmarksHint: 'W-handshape (3 middle fingers extended) at chin',
    difficulty: 'Intermediate'
  },
  {
    id: 'DOCTOR',
    label: 'Doctor / Medical',
    category: 'Emergency',
    description: 'Tap the fingertips of your bent right hand onto the inner wrist of your left arm, as if feeling a pulse.',
    guideSteps: [
      'Hold left arm out with inner wrist facing up',
      'Tap index and middle fingertips of right hand onto left wrist pulse point'
    ],
    landmarksHint: 'Two fingers tapping inner wrist',
    difficulty: 'Intermediate'
  },
  {
    id: 'PEACE_V',
    label: 'Peace / Letter V',
    category: 'Alphabet',
    description: 'Index and Middle fingers extended in a "V" shape, with thumb holding down ring and pinky fingers.',
    guideSteps: [
      'Extend index and middle fingers straight up and spread them apart',
      'Hold ring and pinky fingers down with thumb'
    ],
    landmarksHint: 'Index & Middle extended in V shape',
    difficulty: 'Beginner'
  },
  {
    id: 'OK_F',
    label: 'OK / Letter F',
    category: 'Alphabet',
    description: 'Touch thumb tip to index fingertip to make a circle, while middle, ring, and pinky fingers remain extended upwards.',
    guideSteps: [
      'Pinch thumb tip and index tip together to form a ring',
      'Keep middle, ring, and pinky extended upward and spread slightly'
    ],
    landmarksHint: 'Thumb and Index pinched in circle, other 3 extended',
    difficulty: 'Beginner'
  },
  {
    id: 'LETTER_A',
    label: 'Letter A',
    category: 'Alphabet',
    description: 'Fist with fingers curled tight into palm, thumb resting straight alongside the index finger.',
    guideSteps: [
      'Curl all four fingers into your palm',
      'Keep thumb upright resting snugly against side of index finger'
    ],
    landmarksHint: 'Closed fist with thumb upright alongside index',
    difficulty: 'Beginner'
  },
  {
    id: 'LETTER_B',
    label: 'Letter B',
    category: 'Alphabet',
    description: 'Open flat palm with four fingers straight up and held close together, thumb tucked across the palm.',
    guideSteps: [
      'Extend index, middle, ring, and pinky fingers straight and together',
      'Fold thumb across the base of the palm'
    ],
    landmarksHint: '4 fingers extended together, thumb tucked across palm',
    difficulty: 'Beginner'
  },
  {
    id: 'LETTER_C',
    label: 'Letter C',
    category: 'Alphabet',
    description: 'Curve all fingers and thumb to form the letter "C" shape in the air.',
    guideSteps: [
      'Curve all four fingers together downwards',
      'Curve thumb upward to match, creating a curved cup shape'
    ],
    landmarksHint: 'Fingers curved into open C arc',
    difficulty: 'Beginner'
  },
  {
    id: 'LETTER_D',
    label: 'Letter D',
    category: 'Alphabet',
    description: 'Index finger pointing straight up, while thumb touches tips of curled middle, ring, and pinky fingers.',
    guideSteps: [
      'Point index finger straight up',
      'Curl middle, ring, and pinky fingers to touch thumb tip'
    ],
    landmarksHint: 'Index pointing straight up, thumb touching curled fingers',
    difficulty: 'Intermediate'
  },
  {
    id: 'LETTER_L',
    label: 'Letter L',
    category: 'Alphabet',
    description: 'Form an "L" shape with thumb and index finger extended at a 90-degree angle, with other three fingers curled.',
    guideSteps: [
      'Extend index finger straight up',
      'Extend thumb out sideways at 90 degrees',
      'Keep middle, ring, and pinky curled down'
    ],
    landmarksHint: 'Thumb and Index in 90-degree L angle',
    difficulty: 'Beginner'
  },
  {
    id: 'LETTER_Y',
    label: 'Letter Y (Shaka)',
    category: 'Alphabet',
    description: 'Extend thumb and pinky finger outward while keeping the three middle fingers curled into the palm.',
    guideSteps: [
      'Extend thumb out to the side',
      'Extend pinky finger out opposite side',
      'Keep index, middle, and ring curled tight'
    ],
    landmarksHint: 'Thumb and Pinky extended, middle 3 curled',
    difficulty: 'Beginner'
  },
  {
    id: 'NUMBER_1',
    label: 'Number 1',
    category: 'Numbers',
    description: 'Only index finger pointing straight up, with thumb holding down other three fingers.',
    guideSteps: [
      'Point index finger straight up',
      'Hold middle, ring, and pinky curled with thumb'
    ],
    landmarksHint: 'Index only extended',
    difficulty: 'Beginner'
  },
  {
    id: 'NUMBER_3',
    label: 'Number 3 (ASL)',
    category: 'Numbers',
    description: 'In ASL, number 3 is signed with Thumb, Index, and Middle fingers extended, ring and pinky curled.',
    guideSteps: [
      'Extend thumb out to side',
      'Extend index and middle straight up',
      'Keep ring and pinky curled'
    ],
    landmarksHint: 'Thumb, Index, Middle extended',
    difficulty: 'Intermediate'
  },
  {
    id: 'NUMBER_5',
    label: 'Number 5 / Stop',
    category: 'Numbers',
    description: 'All five fingers spread wide apart, palm facing forward.',
    guideSteps: [
      'Spread all five fingers wide and open',
      'Hold palm steady facing forward'
    ],
    landmarksHint: 'All 5 fingers extended and spread',
    difficulty: 'Beginner'
  }
];

// Calculate euclidean distance between two landmarks
export function getDistance(p1: HandLandmark, p2: HandLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// MediaPipe 21 Landmark Indices
export const LM = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20
};

// Analyze finger extension status invariant to hand distance
export interface FingerStates {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
  thumbTucked: boolean;
  indexMiddleClose: boolean;
  thumbIndexPinch: boolean;
  thumbMiddlePinch: boolean;
  allFingersTogether: boolean;
}

export function analyzeHandFingers(landmarks: HandLandmark[]): FingerStates {
  const wrist = landmarks[LM.WRIST];
  
  // Hand scale reference (wrist to middle MCP)
  const handScale = Math.max(0.01, getDistance(wrist, landmarks[LM.MIDDLE_MCP]));

  // A finger is extended if distance from wrist to tip is significantly greater than wrist to PIP
  const isExtended = (tipIdx: number, pipIdx: number, mcpIdx: number) => {
    const dTip = getDistance(wrist, landmarks[tipIdx]);
    const dPip = getDistance(wrist, landmarks[pipIdx]);
    const dMcp = getDistance(wrist, landmarks[mcpIdx]);
    return dTip > dPip * 1.15 && dTip > dMcp * 1.35;
  };

  const indexExt = isExtended(LM.INDEX_TIP, LM.INDEX_PIP, LM.INDEX_MCP);
  const middleExt = isExtended(LM.MIDDLE_TIP, LM.MIDDLE_PIP, LM.MIDDLE_MCP);
  const ringExt = isExtended(LM.RING_TIP, LM.RING_PIP, LM.RING_MCP);
  const pinkyExt = isExtended(LM.PINKY_TIP, LM.PINKY_PIP, LM.PINKY_MCP);

  // Thumb analysis
  const dThumbTipToPinkyMcp = getDistance(landmarks[LM.THUMB_TIP], landmarks[LM.PINKY_MCP]);
  const dThumbTipToWrist = getDistance(landmarks[LM.THUMB_TIP], wrist);
  const dThumbMcpToWrist = getDistance(landmarks[LM.THUMB_MCP], wrist);
  const thumbExt = dThumbTipToWrist > dThumbMcpToWrist * 1.35 && dThumbTipToPinkyMcp > handScale * 0.7;

  // Thumb tucked across palm
  const dThumbTipToPalmCenter = getDistance(landmarks[LM.THUMB_TIP], landmarks[LM.MIDDLE_MCP]);
  const thumbTucked = dThumbTipToPalmCenter < handScale * 0.45;

  // Pinches
  const thumbIndexDist = getDistance(landmarks[LM.THUMB_TIP], landmarks[LM.INDEX_TIP]);
  const thumbMiddleDist = getDistance(landmarks[LM.THUMB_TIP], landmarks[LM.MIDDLE_TIP]);
  const thumbIndexPinch = thumbIndexDist < handScale * 0.35;
  const thumbMiddlePinch = thumbMiddleDist < handScale * 0.35;

  // Index and Middle close together
  const indexMiddleDist = getDistance(landmarks[LM.INDEX_TIP], landmarks[LM.MIDDLE_TIP]);
  const indexMiddleClose = indexMiddleDist < handScale * 0.3;

  // All 4 fingers close together (Flat B hand)
  const ringPinkyDist = getDistance(landmarks[LM.RING_TIP], landmarks[LM.PINKY_TIP]);
  const middleRingDist = getDistance(landmarks[LM.MIDDLE_TIP], landmarks[LM.RING_TIP]);
  const allFingersTogether = indexMiddleClose && middleRingDist < handScale * 0.35 && ringPinkyDist < handScale * 0.35;

  return {
    thumb: thumbExt,
    index: indexExt,
    middle: middleExt,
    ring: ringExt,
    pinky: pinkyExt,
    thumbTucked,
    indexMiddleClose,
    thumbIndexPinch,
    thumbMiddlePinch,
    allFingersTogether
  };
}

// Recognize sign pattern from 21 hand landmarks
export function recognizeSign(landmarks: HandLandmark[]): RecognizedSign | null {
  if (!landmarks || landmarks.length < 21) return null;

  const f = analyzeHandFingers(landmarks);
  const now = Date.now();

  // 1. Emergency Distress Signal (Help / SOS)
  // International Signal for Help: Thumb tucked in palm, 4 fingers folded over or fist
  if (f.thumbTucked && !f.index && !f.middle && !f.ring && !f.pinky) {
    return {
      name: 'HELP / SOS',
      confidence: 0.94,
      timestamp: now,
      category: 'emergency',
      description: 'Emergency Distress Signal (Help needed)',
      hint: 'Signal for Help recognized! Preparing SOS Alert.'
    };
  }

  // 2. I LOVE YOU (ASL)
  // Thumb + Index + Pinky extended, Middle & Ring curled
  if (f.thumb && f.index && !f.middle && !f.ring && f.pinky) {
    return {
      name: 'I LOVE YOU',
      confidence: 0.96,
      timestamp: now,
      category: 'word',
      description: 'Universal ASL sign for "I Love You"',
      hint: 'Thumb, index, and pinky extended.'
    };
  }

  // 3. Letter Y / Shaka
  // Thumb + Pinky extended, Middle 3 curled
  if (f.thumb && !f.index && !f.middle && !f.ring && f.pinky) {
    return {
      name: 'LETTER_Y',
      confidence: 0.93,
      timestamp: now,
      category: 'alphabet',
      description: 'ASL Letter "Y"',
      hint: 'Thumb and pinky extended.'
    };
  }

  // 4. Letter L
  // Thumb + Index extended at 90 deg, others curled
  if (f.thumb && f.index && !f.middle && !f.ring && !f.pinky) {
    return {
      name: 'LETTER_L',
      confidence: 0.95,
      timestamp: now,
      category: 'alphabet',
      description: 'ASL Letter "L"',
      hint: 'Thumb and index forming right angle.'
    };
  }

  // 5. Letter D
  // Index straight up, others curled or touching thumb
  if (!f.thumb && f.index && !f.middle && !f.ring && !f.pinky) {
    return {
      name: 'LETTER_D',
      confidence: 0.91,
      timestamp: now,
      category: 'alphabet',
      description: 'ASL Letter "D" / Number 1',
      hint: 'Single index finger pointing straight up.'
    };
  }

  // 6. Letter V / Peace / Number 2
  // Index + Middle extended, Ring & Pinky curled
  if (!f.thumb && f.index && f.middle && !f.ring && !f.pinky && !f.indexMiddleClose) {
    return {
      name: 'PEACE_V',
      confidence: 0.95,
      timestamp: now,
      category: 'alphabet',
      description: 'Peace Sign / ASL Letter "V"',
      hint: 'Index and middle fingers in V-shape.'
    };
  }

  // 7. ASL Number 3 / Water Handshape
  // Thumb + Index + Middle extended, Ring & Pinky curled
  if (f.thumb && f.index && f.middle && !f.ring && !f.pinky) {
    return {
      name: 'NUMBER_3',
      confidence: 0.92,
      timestamp: now,
      category: 'number',
      description: 'ASL Number 3',
      hint: 'Thumb, index, and middle extended.'
    };
  }

  // 8. Water (W handshape - 3 fingers extended)
  if (!f.thumb && f.index && f.middle && f.ring && !f.pinky) {
    return {
      name: 'WATER',
      confidence: 0.90,
      timestamp: now,
      category: 'word',
      description: 'Sign for "Water" (W handshape)',
      hint: 'Index, middle, and ring fingers extended.'
    };
  }

  // 9. Letter B (Flat 4 fingers together, thumb tucked)
  if (f.index && f.middle && f.ring && f.pinky && f.allFingersTogether && !f.thumb) {
    return {
      name: 'LETTER_B',
      confidence: 0.94,
      timestamp: now,
      category: 'alphabet',
      description: 'ASL Letter "B" (Flat Hand)',
      hint: 'Four fingers straight and together, thumb tucked.'
    };
  }

  // 10. OK / Letter F
  // Thumb + Index pinched, middle, ring, pinky extended
  if (f.thumbIndexPinch && f.middle && f.ring && f.pinky) {
    return {
      name: 'OK_F',
      confidence: 0.93,
      timestamp: now,
      category: 'alphabet',
      description: 'ASL Letter "F" / OK Sign',
      hint: 'Thumb and index pinched into circle.'
    };
  }

  // 11. Number 5 / Hello / Stop (Open Hand)
  if (f.thumb && f.index && f.middle && f.ring && f.pinky) {
    return {
      name: 'HELLO',
      confidence: 0.96,
      timestamp: now,
      category: 'word',
      description: 'Hello / Greeting / Open Palm',
      hint: 'All five fingers spread open.'
    };
  }

  // 12. Letter A (Fist with thumb alongside)
  if (!f.index && !f.middle && !f.ring && !f.pinky && f.thumb) {
    return {
      name: 'LETTER_A',
      confidence: 0.92,
      timestamp: now,
      category: 'alphabet',
      description: 'ASL Letter "A"',
      hint: 'Fist with thumb resting alongside index.'
    };
  }

  // 13. Letter C (Curved fingers)
  const wrist = landmarks[LM.WRIST];
  const dIndexTipWrist = getDistance(landmarks[LM.INDEX_TIP], wrist);
  const dIndexMcpWrist = getDistance(landmarks[LM.INDEX_MCP], wrist);
  if (dIndexTipWrist < dIndexMcpWrist * 1.15 && !f.thumbTucked && !f.thumbIndexPinch) {
    return {
      name: 'LETTER_C',
      confidence: 0.88,
      timestamp: now,
      category: 'alphabet',
      description: 'ASL Letter "C"',
      hint: 'Hand curved like a cup.'
    };
  }

  return null;
}

// Compare user hand pose against target sign pattern for Coaching Mode
export function evaluateUserSign(targetId: string, landmarks: HandLandmark[] | null): CoachingFeedback {
  if (!landmarks || landmarks.length < 21) {
    return {
      score: 0,
      isMatch: false,
      accuracyLabel: 'No Hand Detected',
      tips: ['Place your hand in front of the camera with good lighting.']
    };
  }

  const f = analyzeHandFingers(landmarks);
  const tips: string[] = [];
  const missing: string[] = [];
  let score = 50;

  switch (targetId) {
    case 'HELLO':
    case 'NUMBER_5':
      if (f.thumb) score += 10; else { tips.push('Extend your thumb outward'); missing.push('Thumb extended'); }
      if (f.index) score += 10; else { tips.push('Straighten your index finger'); missing.push('Index finger'); }
      if (f.middle) score += 10; else { tips.push('Straighten your middle finger'); missing.push('Middle finger'); }
      if (f.ring) score += 10; else { tips.push('Straighten your ring finger'); missing.push('Ring finger'); }
      if (f.pinky) score += 10; else { tips.push('Straighten your pinky finger'); missing.push('Pinky finger'); }
      break;

    case 'I_LOVE_YOU':
      if (f.thumb) score += 15; else { tips.push('Stick your thumb straight out to the side'); missing.push('Thumb'); }
      if (f.index) score += 15; else { tips.push('Point your index finger straight up'); missing.push('Index finger'); }
      if (f.pinky) score += 15; else { tips.push('Point your pinky finger straight up'); missing.push('Pinky finger'); }
      if (!f.middle && !f.ring) score += 15; else { tips.push('Curl your middle and ring fingers flat into your palm'); missing.push('Middle & Ring curled'); }
      break;

    case 'LETTER_L':
      if (f.index) score += 20; else { tips.push('Point your index finger straight up'); missing.push('Index finger'); }
      if (f.thumb) score += 20; else { tips.push('Stick your thumb out horizontally (90 degrees)'); missing.push('Thumb angle'); }
      if (!f.middle && !f.ring && !f.pinky) score += 10; else { tips.push('Keep your middle, ring, and pinky curled'); missing.push('3 fingers curled'); }
      break;

    case 'PEACE_V':
      if (f.index && f.middle) score += 30; else { tips.push('Extend both index and middle fingers'); missing.push('Index + Middle extended'); }
      if (!f.indexMiddleClose) score += 10; else { tips.push('Spread your index and middle fingers apart to form a "V"'); missing.push('Spread fingers'); }
      if (!f.ring && !f.pinky) score += 10; else { tips.push('Keep ring and pinky curled'); missing.push('Ring & Pinky curled'); }
      break;

    case 'HELP_SOS':
      if (f.thumbTucked) score += 30; else { tips.push('Tuck your thumb across into your palm'); missing.push('Thumb tucked'); }
      if (!f.index && !f.middle && !f.ring && !f.pinky) score += 20; else { tips.push('Fold all four fingers down over your thumb'); missing.push('Fingers folded over thumb'); }
      break;

    case 'LETTER_B':
      if (f.index && f.middle && f.ring && f.pinky) score += 25; else { tips.push('Keep all 4 fingers straight up'); missing.push('4 fingers up'); }
      if (f.allFingersTogether) score += 15; else { tips.push('Press fingers close together side-by-side'); missing.push('Fingers together'); }
      if (!f.thumb) score += 10; else { tips.push('Fold your thumb across the palm'); missing.push('Thumb folded'); }
      break;

    case 'OK_F':
      if (f.thumbIndexPinch) score += 30; else { tips.push('Touch thumb tip to index fingertip to make a circle'); missing.push('Thumb-index circle'); }
      if (f.middle && f.ring && f.pinky) score += 20; else { tips.push('Keep middle, ring, and pinky fingers extended'); missing.push('3 fingers extended'); }
      break;

    default:
      score = 75;
      tips.push('Hold your hand steady facing the camera');
      break;
  }

  score = Math.min(100, Math.max(10, score));
  const isMatch = score >= 85;

  let accuracyLabel: CoachingFeedback['accuracyLabel'] = 'Adjust Position';
  if (score >= 90) accuracyLabel = 'Exact Match';
  else if (score >= 75) accuracyLabel = 'Close Match';

  return {
    score,
    isMatch,
    accuracyLabel,
    tips: tips.length > 0 ? tips : ['Excellent hand shape! Perfect alignment.'],
    missingFeatures: missing
  };
}

// Generate canonical 2D landmark coordinates for rendering hand guides & avatars
export function getCanonicalHandPose(signId: string): HandLandmark[] {
  // Base wrist position
  const base: HandLandmark[] = [
    { x: 0.5, y: 0.85, z: 0 },    // 0: Wrist
    { x: 0.42, y: 0.75, z: 0 },   // 1: Thumb CMC
    { x: 0.36, y: 0.65, z: 0 },   // 2: Thumb MCP
    { x: 0.32, y: 0.57, z: 0 },   // 3: Thumb IP
    { x: 0.28, y: 0.52, z: 0 },   // 4: Thumb TIP
    { x: 0.44, y: 0.52, z: 0 },   // 5: Index MCP
    { x: 0.43, y: 0.40, z: 0 },   // 6: Index PIP
    { x: 0.42, y: 0.30, z: 0 },   // 7: Index DIP
    { x: 0.41, y: 0.20, z: 0 },   // 8: Index TIP
    { x: 0.50, y: 0.50, z: 0 },   // 9: Middle MCP
    { x: 0.50, y: 0.37, z: 0 },   // 10: Middle PIP
    { x: 0.50, y: 0.26, z: 0 },   // 11: Middle DIP
    { x: 0.50, y: 0.15, z: 0 },   // 12: Middle TIP
    { x: 0.56, y: 0.52, z: 0 },   // 13: Ring MCP
    { x: 0.57, y: 0.41, z: 0 },   // 14: Ring PIP
    { x: 0.58, y: 0.31, z: 0 },   // 15: Ring DIP
    { x: 0.59, y: 0.22, z: 0 },   // 16: Ring TIP
    { x: 0.62, y: 0.56, z: 0 },   // 17: Pinky MCP
    { x: 0.64, y: 0.47, z: 0 },   // 18: Pinky PIP
    { x: 0.66, y: 0.40, z: 0 },   // 19: Pinky DIP
    { x: 0.67, y: 0.32, z: 0 }    // 20: Pinky TIP
  ];

  // Deep clone
  const pts = base.map(p => ({ ...p }));

  if (signId === 'PEACE_V') {
    // Curl ring & pinky
    pts[15] = { x: 0.56, y: 0.58, z: 0 };
    pts[16] = { x: 0.55, y: 0.64, z: 0 };
    pts[19] = { x: 0.63, y: 0.60, z: 0 };
    pts[20] = { x: 0.62, y: 0.65, z: 0 };
    // Spread index & middle
    pts[8] = { x: 0.36, y: 0.20, z: 0 };
    pts[12] = { x: 0.56, y: 0.18, z: 0 };
  } else if (signId === 'I_LOVE_YOU') {
    // Curl middle & ring
    pts[11] = { x: 0.50, y: 0.56, z: 0 };
    pts[12] = { x: 0.50, y: 0.62, z: 0 };
    pts[15] = { x: 0.56, y: 0.57, z: 0 };
    pts[16] = { x: 0.56, y: 0.63, z: 0 };
    // Thumb way out
    pts[4] = { x: 0.22, y: 0.50, z: 0 };
    // Pinky way out
    pts[20] = { x: 0.72, y: 0.25, z: 0 };
  } else if (signId === 'LETTER_L') {
    // Curl middle, ring, pinky
    pts[11] = { x: 0.50, y: 0.56, z: 0 };
    pts[12] = { x: 0.50, y: 0.63, z: 0 };
    pts[15] = { x: 0.56, y: 0.57, z: 0 };
    pts[16] = { x: 0.56, y: 0.63, z: 0 };
    pts[19] = { x: 0.63, y: 0.60, z: 0 };
    pts[20] = { x: 0.62, y: 0.65, z: 0 };
    // Thumb 90 deg horizontal
    pts[3] = { x: 0.28, y: 0.65, z: 0 };
    pts[4] = { x: 0.20, y: 0.65, z: 0 };
  } else if (signId === 'HELP_SOS' || signId === 'YES') {
    // All fingers curled into fist
    pts[8] = { x: 0.43, y: 0.62, z: 0 };
    pts[12] = { x: 0.50, y: 0.62, z: 0 };
    pts[16] = { x: 0.57, y: 0.63, z: 0 };
    pts[20] = { x: 0.64, y: 0.65, z: 0 };
    // Thumb wrapped over
    pts[4] = { x: 0.48, y: 0.60, z: 0 };
  }

  return pts;
}

// Hand bone connections for drawing skeletal lines
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [13, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [0, 17]
];
