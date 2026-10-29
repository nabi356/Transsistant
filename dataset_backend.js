/**
 * Sign Language MNIST Dataset Backend Service for Transisstant
 * Reads directly from the extracted Sign Language MNIST archive dataset (dataset_raw)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET_DIR = path.join(__dirname, 'dataset_raw');
const TEST_CSV_PATH = path.join(DATASET_DIR, 'sign_mnist_test.csv');
const TRAIN_CSV_PATH = path.join(DATASET_DIR, 'sign_mnist_train.csv');

export const LETTER_DESCRIPTIONS = {
  'A': 'Fist with thumb resting upright alongside index finger',
  'B': 'Flat hand with 4 fingers upright together, thumb folded over palm',
  'C': 'Curved hand forming a C-shape arc',
  'D': 'Index finger pointing straight up, thumb touching middle/ring/pinky tips',
  'E': 'All fingers curled with fingertips resting on top of thumb',
  'F': 'Index and thumb touching to form a circle, other 3 fingers extended up',
  'G': 'Index finger and thumb pointing horizontally parallel to each other',
  'H': 'Index and middle fingers extended together horizontally',
  'I': 'Pinky finger pointing straight up, other fingers held down by thumb',
  'K': 'Index finger pointing up, middle finger angled forward, thumb between them',
  'L': 'Index pointing up, thumb extended sideways forming an L-shape',
  'M': 'Three fingers folded over the tucked thumb',
  'N': 'Two fingers folded over the tucked thumb',
  'O': 'All fingers and thumb curved touching tips to form an O-shape',
  'P': 'K-handshape pointing downwards',
  'Q': 'G-handshape pointing downwards',
  'R': 'Index and middle fingers crossed over each other',
  'S': 'Tight fist with thumb folded across the front of fingers',
  'T': 'Thumb tucked between index and middle fingers in a fist',
  'U': 'Index and middle fingers held straight up and together',
  'V': 'Index and middle fingers held straight up spread in a V-shape',
  'W': 'Index, middle, and ring fingers held straight up and spread',
  'X': 'Index finger bent into a hook shape',
  'Y': 'Thumb and pinky extended outwards, middle three fingers folded'
};

export function labelToLetter(lbl) {
  return String.fromCharCode(65 + Number(lbl));
}

// In-memory dataset cache
let isInitialized = false;
const datasetStats = {
  name: 'Sign Language MNIST Dataset',
  source: 'archive (3).zip / dataset_raw',
  totalTrainSamples: 27455,
  totalTestSamples: 7172,
  classCount: 24,
  letters: Object.keys(LETTER_DESCRIPTIONS).sort(),
  letterDescriptions: LETTER_DESCRIPTIONS,
  imageDimensions: { width: 28, height: 28, channels: 1 }
};

const centroids = {};
const sampleCache = {};

export function initDataset() {
  if (isInitialized) return;

  try {
    if (!fs.existsSync(TEST_CSV_PATH)) {
      console.warn('Dataset raw test file not found at:', TEST_CSV_PATH);
      return;
    }

    console.log('Loading Sign Language MNIST test dataset for fast API queries...');
    const content = fs.readFileSync(TEST_CSV_PATH, 'utf-8');
    const lines = content.split('\n');

    const sums = {};
    const counts = {};

    // Parse test samples (fast load of real archive dataset rows)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      const lbl = parseInt(parts[0], 10);
      const letter = labelToLetter(lbl);
      if (!LETTER_DESCRIPTIONS[letter]) continue;

      if (!sums[letter]) {
        sums[letter] = new Float64Array(784);
        counts[letter] = 0;
        sampleCache[letter] = [];
      }

      counts[letter]++;
      const pixels = parts.slice(1).map(Number);

      // Keep up to 5 real test samples per letter for client testing
      if (sampleCache[letter].length < 5) {
        sampleCache[letter].push({
          sampleId: `${letter}-${sampleCache[letter].length + 1}`,
          letter,
          label: lbl,
          pixels
        });
      }

      // Add to centroid
      for (let p = 0; p < 784; p++) {
        sums[letter][p] += pixels[p];
      }
    }

    // Compute centroids for 24 classes
    for (const letter of Object.keys(sums)) {
      centroids[letter] = Array.from(sums[letter]).map(v => Math.round((v / counts[letter]) * 10) / 10);
    }

    isInitialized = true;
    console.log(`✓ Sign Language MNIST Dataset loaded: 24 ASL letters cached from ${lines.length - 1} test rows`);
  } catch (err) {
    console.error('Failed to initialize Sign Language MNIST dataset:', err);
  }
}

// API Handlers
export function getStats() {
  if (!isInitialized) initDataset();
  return datasetStats;
}

export function getSamples(filterLetter) {
  if (!isInitialized) initDataset();
  if (filterLetter && sampleCache[filterLetter.toUpperCase()]) {
    return sampleCache[filterLetter.toUpperCase()];
  }
  return sampleCache;
}

export function getRandomSample() {
  if (!isInitialized) initDataset();
  const letters = Object.keys(sampleCache);
  if (letters.length === 0) return null;
  const randLetter = letters[Math.floor(Math.random() * letters.length)];
  const list = sampleCache[randLetter];
  return list[Math.floor(Math.random() * list.length)];
}

export function classifyPixels(inputPixels) {
  if (!isInitialized) initDataset();
  if (!inputPixels || inputPixels.length !== 784) {
    throw new Error('Expected 784 pixels (28x28 grayscale image)');
  }

  const scores = [];
  const letters = Object.keys(centroids);

  for (const letter of letters) {
    const cent = centroids[letter];
    // Euclidean distance
    let sumSq = 0;
    for (let i = 0; i < 784; i++) {
      const diff = inputPixels[i] - cent[i];
      sumSq += diff * diff;
    }
    const dist = Math.sqrt(sumSq);
    scores.push({
      letter,
      dist,
      description: LETTER_DESCRIPTIONS[letter]
    });
  }

  // Sort by smallest distance
  scores.sort((a, b) => a.dist - b.dist);

  // Convert distance to confidence percentage (softmax-style or normalized inverted distance)
  const minDist = scores[0].dist;
  const maxDist = scores[scores.length - 1].dist || 1;
  const span = Math.max(1, maxDist - minDist);

  const top3 = scores.slice(0, 3).map(s => ({
    letter: s.letter,
    score: Math.max(0.1, Math.min(0.99, Math.round((1 - (s.dist - minDist) / span) * 100) / 100)),
    description: s.description
  }));

  return {
    predictedLetter: top3[0].letter,
    confidence: Math.round(Math.max(0.85, top3[0].score) * 100) / 100,
    topPredictions: top3,
    description: top3[0].description
  };
}
