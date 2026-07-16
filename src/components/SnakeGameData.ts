/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- TYPES & INTERFACES ---
export type ThemeId = 'neon' | 'forest' | 'space' | 'candy';
export type GameMode = 'bordered' | 'infinite';
export type Difficulty = 'easy' | 'normal' | 'hyper';
export type ControlMode = 'follow' | 'click';

export interface Skin {
  id: string;
  name: string;
  icon: string;
  price: number;
  type: 'classic' | 'gradient' | 'pattern' | 'rainbow' | 'venom' | 'dragon' | 'magma' | 'matrix';
  primaryColor: string;
  secondaryColor: string;
  eyeColor: string;
  pupilStyle: 'circle' | 'slit' | 'star' | 'laser' | 'dead';
  trailType: 'normal' | 'sparks' | 'fire' | 'magic' | 'gold' | 'digital';
  glowColor: string;
  description: string;
}

export interface Snake {
  id: string;
  name: string;
  isBot: boolean;
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  speed: number;
  score: number;
  length: number;
  body: { x: number; y: number }[];
  pathHistory: { x: number; y: number }[];
  color: string;
  isBoosting: boolean;
  pendingGrowth: number;
  botDecisionTimer?: number;
  
  // Powerup durations (timestamps when they expire)
  magnetExpires?: number;
  shieldExpires?: number;
  multiplierExpires?: number;
  speedExpires?: number;
  
  // Custom skin ID assigned to this snake
  skinId: string;
}

export interface Food {
  id: string;
  x: number;
  y: number;
  color: string;
  value: number;
  size: number;
  pulsePhase: number;
  isPowerUpFood?: boolean;
}

export interface PowerUp {
  id: string;
  type: 'magnet' | 'shield' | 'multiplier' | 'speed';
  x: number;
  y: number;
  color: string;
  size: number;
  icon: string;
  pulsePhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  isDust?: boolean;
  trailType?: string;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
  life: number;
  maxLife: number;
}

// --- CONSTANTS ---
export const ARENA_SIZE = 2400;
export const SEGMENT_SPACING = 12;

// --- SKINS DATABASE ---
export const SKINS_LIST: Skin[] = [
  {
    id: 'classic-neon',
    name: 'Classic Neon',
    icon: '⚡',
    price: 0,
    type: 'gradient',
    primaryColor: '#6366f1',
    secondaryColor: '#ec4899',
    eyeColor: '#ffffff',
    pupilStyle: 'circle',
    trailType: 'normal',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    description: 'The cybernetic arcade slitherer with neon glowing hues.'
  },
  {
    id: 'forest-viper',
    name: 'Forest Viper',
    icon: '🌿',
    price: 0,
    type: 'pattern',
    primaryColor: '#10b981',
    secondaryColor: '#facc15',
    eyeColor: '#fbbf24',
    pupilStyle: 'slit',
    trailType: 'sparks',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    description: 'A wild rainforest predator with dangerous slitted cat eyes.'
  },
  {
    id: 'pulsing-magma',
    name: 'Pulsing Magma',
    icon: '🔥',
    price: 150,
    type: 'magma',
    primaryColor: '#ef4444',
    secondaryColor: '#18181b',
    eyeColor: '#facc15',
    pupilStyle: 'slit',
    trailType: 'fire',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    description: 'Forged in subterranean active volcanoes, trailing magma embers.'
  },
  {
    id: 'toxic-venom',
    name: 'Toxic Venom',
    icon: '☣️',
    price: 300,
    type: 'venom',
    primaryColor: '#090d16',
    secondaryColor: '#22c55e',
    eyeColor: '#22c55e',
    pupilStyle: 'laser',
    trailType: 'sparks',
    glowColor: 'rgba(34, 197, 94, 0.6)',
    description: 'Pitch black liquid body with radioactive glowing toxic sights.'
  },
  {
    id: 'cosmic-nebula',
    name: 'Cosmic Nebula',
    icon: '🌌',
    price: 450,
    type: 'rainbow',
    primaryColor: '#8b5cf6',
    secondaryColor: '#d946ef',
    eyeColor: '#ffffff',
    pupilStyle: 'star',
    trailType: 'magic',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    description: 'Deep stardust scales embedded with micro black holes and solar flares.'
  },
  {
    id: 'golden-emperor',
    name: 'Golden Emperor',
    icon: '👑',
    price: 600,
    type: 'dragon',
    primaryColor: '#fbbf24',
    secondaryColor: '#f59e0b',
    eyeColor: '#ffffff',
    pupilStyle: 'star',
    trailType: 'gold',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    description: 'Royal slitherer woven from pristine gold filaments and starlight.'
  },
  {
    id: 'rainbow-aurora',
    name: 'Rainbow Aurora',
    icon: '🌈',
    price: 800,
    type: 'rainbow',
    primaryColor: '#ff007f',
    secondaryColor: '#39ff14',
    eyeColor: '#ffffff',
    pupilStyle: 'circle',
    trailType: 'magic',
    glowColor: 'rgba(255, 255, 255, 0.5)',
    description: 'Dynamic light spectrum shifter leaving behind colorful cosmic dust.'
  },
  {
    id: 'stealth-ghost',
    name: 'Stealth Ghost',
    icon: '👻',
    price: 1000,
    type: 'matrix',
    primaryColor: '#475569',
    secondaryColor: '#0f172a',
    eyeColor: '#ef4444',
    pupilStyle: 'laser',
    trailType: 'digital',
    glowColor: 'rgba(71, 85, 105, 0.4)',
    description: 'Cyber-stealth glider with translucent carbon scales and neon targeting lines.'
  }
];

// --- STYLIZED THEMES DATA ---
export const THEME_STYLES: Record<
  ThemeId,
  {
    name: string;
    icon: string;
    bgClass: string;
    boardBg: string;
    gridLine: string;
    headColor: string;
    bodyStart: string;
    bodyEnd: string;
    glowColor: string;
  }
> = {
  neon: {
    name: 'Neon Horizon',
    icon: '⚡',
    bgClass: 'from-slate-950 to-indigo-950',
    boardBg: '#05070f',
    gridLine: 'rgba(99, 102, 241, 0.05)',
    headColor: '#4f46e5',
    bodyStart: '#6366f1',
    bodyEnd: '#ec4899',
    glowColor: 'rgba(99, 102, 241, 0.4)'
  },
  forest: {
    name: 'Wild Jungle',
    icon: '🌿',
    bgClass: 'from-emerald-950 to-teal-950',
    boardBg: '#021510',
    gridLine: 'rgba(16, 185, 129, 0.05)',
    headColor: '#059669',
    bodyStart: '#10b981',
    bodyEnd: '#facc15',
    glowColor: 'rgba(16, 185, 129, 0.4)'
  },
  space: {
    name: 'Cosmic Void',
    icon: '🌌',
    bgClass: 'from-violet-950 to-fuchsia-950',
    boardBg: '#0a0212',
    gridLine: 'rgba(192, 38, 211, 0.05)',
    headColor: '#c026d3',
    bodyStart: '#d946ef',
    bodyEnd: '#3b82f6',
    glowColor: 'rgba(192, 38, 211, 0.4)'
  },
  candy: {
    name: 'Sugar Rush',
    icon: '🍭',
    bgClass: 'from-pink-900 to-rose-950',
    boardBg: '#17030e',
    gridLine: 'rgba(244, 63, 94, 0.05)',
    headColor: '#db2777',
    bodyStart: '#f43f5e',
    bodyEnd: '#f97316',
    glowColor: 'rgba(244, 63, 94, 0.4)'
  }
};
