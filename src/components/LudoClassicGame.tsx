/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Users,
  Cpu,
  Trophy,
  Sparkles,
  Play,
  User,
  Activity,
  Zap,
  Star,
  Award,
  Crown,
  Lock,
  Plus,
  ChevronRight,
  Palette,
  Dice1, Dice2, Dice3, Dice4, Dice5, Dice6
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
// @ts-ignore
import ludoBoardMockup from '../assets/images/ludo_board_mockup_1782989238218.jpg';

// Dynamic Audio Synthesizer for ad-free offline-first sounds
class LudoAudio {
  private static ctx: AudioContext | null = null;

  private static getContext() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  static play(type: 'click' | 'roll' | 'move' | 'capture' | 'release' | 'home' | 'win', enabled: boolean) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      switch (type) {
        case 'click': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }
        case 'roll': {
          for (let i = 0; i < 6; i++) {
            const tickTime = now + i * 0.05;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200 + i * 100, tickTime);
            gain.gain.setValueAtTime(0.06, tickTime);
            gain.gain.linearRampToValueAtTime(0.01, tickTime + 0.04);
            osc.start(tickTime);
            osc.stop(tickTime + 0.04);
          }
          break;
        }
        case 'move': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(450, now);
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }
        case 'release': {
          const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);
            gain.gain.setValueAtTime(0.08, now + i * 0.06);
            gain.gain.linearRampToValueAtTime(0.01, now + i * 0.06 + 0.12);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.12);
          });
          break;
        }
        case 'capture': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.linearRampToValueAtTime(100, now + 0.35);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }
        case 'home': {
          const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            gain.gain.setValueAtTime(0.1, now + i * 0.05);
            gain.gain.linearRampToValueAtTime(0.01, now + i * 0.05 + 0.3);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.3);
          });
          break;
        }
        case 'win': {
          const melody = [523.25, 523.25, 523.25, 659.25, 523.25, 783.99];
          const durations = [0.15, 0.15, 0.15, 0.3, 0.15, 0.6];
          let timeOffset = 0;
          melody.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + timeOffset);
            gain.gain.setValueAtTime(0.12, now + timeOffset);
            gain.gain.linearRampToValueAtTime(0.01, now + timeOffset + durations[i]);
            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + durations[i]);
            timeOffset += durations[i] * 0.8;
          });
          break;
        }
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
}

// Global 52 coordinates mapping clockwise around the board
const TRACK_COORDS: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], // Left arm top track (0-4)
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], // Top arm left track (5-10)
  [0, 7], // Top arm middle top (11)
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], // Top arm right track (12-17)
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], // Right arm top track (18-23)
  [7, 14], // Right arm middle end (24)
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], // Right arm bottom track (25-30)
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], // Bottom arm right track (31-36)
  [14, 7], // Bottom arm middle bottom (37)
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], // Bottom arm left track (38-43)
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], // Left arm bottom track (44-49)
  [7, 0], // Left arm middle end (50)
  [6, 0] // Left arm top start (51)
];

// Safe zones coordinates
const SAFE_COORDS = [
  '6_1',   // Red starting cell
  '1_8',   // Green starting cell
  '8_13',  // Yellow starting cell
  '13_6',  // Blue starting cell
  '8_2',   // Left arm safe star
  '2_6',   // Top arm safe star
  '6_12',  // Right arm safe star
  '12_8'   // Bottom arm safe star
];

export interface LudoTheme {
  id: string;
  name: string;
  bgClass: string;
  headerBgClass: string;
  cardBgClass: string;
  boardBg: string;
  red: {
    base: string;
    active: string;
    cell: string;
    token: string;
    startRing: string;
    hex: string;
  };
  green: {
    base: string;
    active: string;
    cell: string;
    token: string;
    startRing: string;
    hex: string;
  };
  yellow: {
    base: string;
    active: string;
    cell: string;
    token: string;
    startRing: string;
    hex: string;
  };
  blue: {
    base: string;
    active: string;
    cell: string;
    token: string;
    startRing: string;
    hex: string;
  };
}

export const LUDO_THEMES: Record<string, LudoTheme> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    bgClass: 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100',
    headerBgClass: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800',
    cardBgClass: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 shadow-md',
    boardBg: 'bg-slate-50 dark:bg-slate-950',
    red: {
      base: 'bg-red-500/10 border-2 border-red-500 shadow-sm',
      active: 'bg-red-500 z-10 scale-[1.02] shadow-lg shadow-red-500/25 ring-4 ring-red-500/30',
      cell: 'bg-red-500 border border-red-600/10',
      token: 'bg-gradient-to-br from-red-400 to-red-600 shadow-md shadow-red-500/40',
      startRing: 'ring-red-400/40',
      hex: '#EF4444',
    },
    green: {
      base: 'bg-emerald-500/10 border-2 border-emerald-500 shadow-sm',
      active: 'bg-emerald-500 z-10 scale-[1.02] shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-500/30',
      cell: 'bg-emerald-500 border border-emerald-600/10',
      token: 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/40',
      startRing: 'ring-emerald-400/40',
      hex: '#10B981',
    },
    yellow: {
      base: 'bg-yellow-500/10 border-2 border-yellow-400 shadow-sm',
      active: 'bg-yellow-450 z-10 scale-[1.02] shadow-lg shadow-yellow-500/25 ring-4 ring-yellow-400/30',
      cell: 'bg-yellow-400 border border-yellow-500/10',
      token: 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-md shadow-yellow-500/40',
      startRing: 'ring-yellow-400/40',
      hex: '#FBBF24',
    },
    blue: {
      base: 'bg-blue-500/10 border-2 border-blue-500 shadow-sm',
      active: 'bg-blue-500 z-10 scale-[1.02] shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/30',
      cell: 'bg-blue-500 border border-blue-600/10',
      token: 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-md shadow-blue-500/40',
      startRing: 'ring-blue-400/40',
      hex: '#3B82F6',
    },
  },
  pastel: {
    id: 'pastel',
    name: 'Pastel',
    bgClass: 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100',
    headerBgClass: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800',
    cardBgClass: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 shadow-md',
    boardBg: 'bg-slate-100/30 dark:bg-slate-950',
    red: {
      base: 'bg-rose-100 dark:bg-rose-950/20 border-2 border-rose-300 shadow-sm',
      active: 'bg-rose-300 z-10 scale-[1.02] shadow-md shadow-rose-300/30 ring-4 ring-rose-300/30',
      cell: 'bg-rose-300 dark:bg-rose-400/80',
      token: 'bg-gradient-to-br from-rose-200 to-rose-400 shadow-sm shadow-rose-300/40',
      startRing: 'ring-rose-300/30',
      hex: '#FDA4AF',
    },
    green: {
      base: 'bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-300 shadow-sm',
      active: 'bg-emerald-300 z-10 scale-[1.02] shadow-md shadow-emerald-300/30 ring-4 ring-emerald-300/30',
      cell: 'bg-emerald-300 dark:bg-emerald-400/80',
      token: 'bg-gradient-to-br from-emerald-200 to-emerald-400 shadow-sm shadow-emerald-300/40',
      startRing: 'ring-emerald-300/30',
      hex: '#A7F3D0',
    },
    yellow: {
      base: 'bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 shadow-sm',
      active: 'bg-amber-200 z-10 scale-[1.02] shadow-md shadow-amber-200/30 ring-4 ring-amber-200/30',
      cell: 'bg-amber-200 dark:bg-amber-300/80',
      token: 'bg-gradient-to-br from-amber-100 to-amber-300 shadow-sm shadow-amber-200/40',
      startRing: 'ring-amber-200/30',
      hex: '#FDE68A',
    },
    blue: {
      base: 'bg-sky-50 dark:bg-sky-950/20 border-2 border-sky-300 shadow-sm',
      active: 'bg-sky-300 z-10 scale-[1.02] shadow-md shadow-sky-300/30 ring-4 ring-sky-300/30',
      cell: 'bg-sky-300 dark:bg-sky-400/80',
      token: 'bg-gradient-to-br from-sky-200 to-sky-400 shadow-sm shadow-sky-300/40',
      startRing: 'ring-sky-300/30',
      hex: '#BAE6FD',
    },
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    bgClass: 'bg-gradient-to-br from-purple-950 via-neutral-950 to-pink-950 text-white',
    headerBgClass: 'bg-black/40 border-fuchsia-500/20 backdrop-blur-md',
    cardBgClass: 'bg-black/55 border-fuchsia-500/25 shadow-purple-950/50 backdrop-blur-sm border',
    boardBg: 'bg-purple-950/20',
    red: {
      base: 'bg-fuchsia-950/20 border-2 border-fuchsia-500 shadow-md shadow-fuchsia-500/25',
      active: 'bg-fuchsia-500 z-10 scale-[1.02] shadow-xl shadow-fuchsia-500/50 ring-4 ring-fuchsia-500/40',
      cell: 'bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.4)]',
      token: 'bg-gradient-to-br from-fuchsia-400 to-fuchsia-600 shadow-md shadow-fuchsia-500/50',
      startRing: 'ring-fuchsia-500/50',
      hex: '#D946EF',
    },
    green: {
      base: 'bg-cyan-950/20 border-2 border-cyan-500 shadow-md shadow-cyan-500/25',
      active: 'bg-cyan-500 z-10 scale-[1.02] shadow-xl shadow-cyan-500/50 ring-4 ring-cyan-500/40',
      cell: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]',
      token: 'bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-md shadow-cyan-500/50',
      startRing: 'ring-cyan-500/50',
      hex: '#06B6D4',
    },
    yellow: {
      base: 'bg-yellow-950/20 border-2 border-yellow-400 shadow-md shadow-yellow-400/25',
      active: 'bg-yellow-400 z-10 scale-[1.02] shadow-xl shadow-yellow-400/50 ring-4 ring-yellow-400/40',
      cell: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]',
      token: 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-md shadow-yellow-400/50',
      startRing: 'ring-yellow-400/50',
      hex: '#FACC15',
    },
    blue: {
      base: 'bg-violet-950/20 border-2 border-violet-500 shadow-md shadow-violet-500/25',
      active: 'bg-violet-500 z-10 scale-[1.02] shadow-xl shadow-violet-500/50 ring-4 ring-violet-500/40',
      cell: 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]',
      token: 'bg-gradient-to-br from-violet-400 to-violet-600 shadow-md shadow-violet-500/50',
      startRing: 'ring-violet-500/50',
      hex: '#8B5CF6',
    },
  },
  wooden: {
    id: 'wooden',
    name: 'Wooden',
    bgClass: 'bg-gradient-to-br from-amber-50 via-amber-100/50 to-orange-100 dark:from-stone-950 dark:via-stone-900 dark:to-orange-950 text-stone-800 dark:text-orange-50',
    headerBgClass: 'bg-amber-100/40 dark:bg-stone-950/40 border-amber-200/40 backdrop-blur-md',
    cardBgClass: 'bg-amber-50/90 dark:bg-stone-900/80 border-amber-200 dark:border-stone-800/80 shadow-md',
    boardBg: 'bg-amber-50 dark:bg-stone-950',
    red: {
      base: 'bg-orange-950/10 border-2 border-orange-800/80 shadow-md',
      active: 'bg-orange-800 z-10 scale-[1.02] shadow-lg shadow-orange-900/40 ring-4 ring-orange-800/30',
      cell: 'bg-orange-800 border border-orange-950/20',
      token: 'bg-gradient-to-br from-orange-600 to-orange-800 shadow-md shadow-orange-900/50',
      startRing: 'ring-orange-850/40',
      hex: '#C2410C',
    },
    green: {
      base: 'bg-amber-950/10 border-2 border-amber-800/80 shadow-md',
      active: 'bg-amber-800 z-10 scale-[1.02] shadow-lg shadow-amber-900/40 ring-4 ring-amber-800/30',
      cell: 'bg-amber-800 border border-amber-950/20',
      token: 'bg-gradient-to-br from-amber-600 to-amber-800 shadow-md shadow-amber-900/50',
      startRing: 'ring-amber-850/40',
      hex: '#D97706',
    },
    yellow: {
      base: 'bg-yellow-950/10 border-2 border-yellow-800/80 shadow-md',
      active: 'bg-yellow-800 z-10 scale-[1.02] shadow-lg shadow-yellow-900/40 ring-4 ring-yellow-800/30',
      cell: 'bg-yellow-800 border border-yellow-950/20',
      token: 'bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-md shadow-yellow-950/50',
      startRing: 'ring-yellow-850/40',
      hex: '#CA8A04',
    },
    blue: {
      base: 'bg-stone-800/10 border-2 border-stone-800/80 shadow-md',
      active: 'bg-stone-800 z-10 scale-[1.02] shadow-lg shadow-stone-900/40 ring-4 ring-stone-800/30',
      cell: 'bg-stone-850 border border-stone-950/20',
      token: 'bg-gradient-to-br from-stone-600 to-stone-800 shadow-md shadow-stone-950/50',
      startRing: 'ring-stone-850/40',
      hex: '#57534E',
    },
  },
};

const MiniBoardPreview: React.FC<{ theme: LudoTheme }> = ({ theme }) => {
  return (
    <div className={`w-14 h-14 rounded-xl relative p-0.5 border flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm`}>
      {/* 4 Corner bases */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-1">
        {/* Top-Left Red */}
        <div className={`rounded-md border ${
          theme.id === 'wooden' ? 'bg-orange-800/20 border-orange-800/50' : 
          theme.id === 'neon' ? 'bg-fuchsia-950/30 border-fuchsia-500/50' : 
          theme.id === 'pastel' ? 'bg-rose-100 border-rose-300' : 'bg-red-500/10 border-red-500/40'
        }`} />
        {/* Top-Right Green */}
        <div className={`rounded-md border ${
          theme.id === 'wooden' ? 'bg-amber-800/20 border-amber-800/50' : 
          theme.id === 'neon' ? 'bg-cyan-950/30 border-cyan-500/50' : 
          theme.id === 'pastel' ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-500/10 border-emerald-500/40'
        }`} />
        {/* Bottom-Left Blue */}
        <div className={`rounded-md border ${
          theme.id === 'wooden' ? 'bg-stone-800/20 border-stone-800/50' : 
          theme.id === 'neon' ? 'bg-violet-950/30 border-violet-500/50' : 
          theme.id === 'pastel' ? 'bg-sky-50 border-sky-300' : 'bg-blue-500/10 border-blue-500/40'
        }`} />
        {/* Bottom-Right Yellow */}
        <div className={`rounded-md border ${
          theme.id === 'wooden' ? 'bg-yellow-800/20 border-yellow-850/50' : 
          theme.id === 'neon' ? 'bg-yellow-950/30 border-yellow-500/50' : 
          theme.id === 'pastel' ? 'bg-amber-50 border-amber-350' : 'bg-yellow-500/10 border-yellow-400/40'
        }`} />
      </div>
      {/* Center cross/star or center target */}
      <div className="absolute w-4 h-4 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      </div>
    </div>
  );
};

// Main Component Definition
interface LudoClassicGameProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  soundEnabled?: boolean;
  onAddCoins?: (amount: number) => void;
}

export const LudoClassicGame: React.FC<LudoClassicGameProps> = ({
  onBack,
  theme = 'light',
  soundEnabled = true,
  onAddCoins
}) => {
  // Game Setup Configurations
  const [setupMode, setSetupMode] = useState<'single' | 'dual' | 'multi'>('single');
  const [columnsAlternative, setColumnsAlternative] = useState<boolean>(false); // false = 1 col, true = 2 cols (alternating)
  const [multiplayerCount, setMultiplayerCount] = useState<3 | 4>(3);
  const [tokenCountChoice, setTokenCountChoice] = useState<2 | 4>(2);
  const [easyRelease, setEasyRelease] = useState<boolean>(true); // true = 1 or 6, false = 6 only

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(soundEnabled);

  // Themes Setup
  const [activeThemeId, setActiveThemeId] = useState<string>(theme === 'dark' ? 'neon' : 'classic');
  const [showThemePicker, setShowThemePicker] = useState<boolean>(false);
  const activeTheme = LUDO_THEMES[activeThemeId] || LUDO_THEMES.classic;

  // Core Game State
  const [activePlayers, setActivePlayers] = useState<string[]>([]); // Ordered turns: e.g. ['red', 'green', 'yellow', 'blue']
  const [playerTypes, setPlayerTypes] = useState<{ [color: string]: 'human' | 'bot' }>({});
  const [playerNames, setPlayerNames] = useState<{ [color: string]: string }>({});
  const [colorLabels, setColorLabels] = useState<{ [color: string]: string }>({});

  const [tokenPositions, setTokenPositions] = useState<{ [color: string]: number[] }>({
    red: [], green: [], yellow: [], blue: []
  });

  const [currentTurnIdx, setCurrentTurnIdx] = useState<number>(0);
  const [diceValue, setDiceValue] = useState<number>(6);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [winnerList, setWinnerList] = useState<string[]>([]);
  const [gameLogs, setGameLogs] = useState<string[]>([]);
  const [animatingToken, setAnimatingToken] = useState<{ color: string; index: number } | null>(null);

  const [showQuitConfirm, setShowQuitConfirm] = useState<boolean>(false);

  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDark = theme === 'dark';

  // Define dynamic button gradient colors based on setupMode to keep the screen exceptionally beautiful
  const modeGradientClass = {
    single: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-white shadow-lg shadow-blue-500/25 border-transparent',
    dual: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/25 border-transparent',
    multi: 'bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25 border-transparent',
  }[setupMode];

  const easyReleaseToggleClass = {
    single: 'bg-indigo-600',
    dual: 'bg-teal-600',
    multi: 'bg-rose-600',
  }[setupMode];

  const startButtonGradientClass = {
    single: 'from-blue-500 via-indigo-500 to-violet-600 shadow-indigo-500/25',
    dual: 'from-emerald-500 via-teal-500 to-cyan-600 shadow-teal-500/25',
    multi: 'from-orange-500 via-rose-500 to-pink-600 shadow-rose-500/25',
  }[setupMode];

  // Play Sound helper
  const playSound = (type: 'click' | 'roll' | 'move' | 'capture' | 'release' | 'home' | 'win') => {
    LudoAudio.play(type, soundOn);
  };

  // Add Log Helper
  const addLog = (message: string) => {
    setGameLogs(prev => [message, ...prev].slice(0, 30));
  };

  // Initializing Game Session based on configurations
  const handleStartGame = () => {
    playSound('click');
    triggerVibration('medium');

    const tc = tokenCountChoice;
    const initialPositions = {
      red: Array(tc).fill(0),
      green: Array(tc).fill(0),
      yellow: Array(tc).fill(0),
      blue: Array(tc).fill(0)
    };

    let pList: string[] = [];
    let pTypes: { [color: string]: 'human' | 'bot' } = {};
    let pNames: { [color: string]: string } = {};
    let pLabels: { [color: string]: string } = {};

    if (setupMode === 'single') {
      if (!columnsAlternative) {
        // 1 vs 1 vs Bot
        pList = ['red', 'green'];
        pTypes = { red: 'human', green: 'bot' };
        pNames = { red: 'Gamer (You)', green: 'Robo Bot 🤖' };
        pLabels = { red: 'Red (You)', green: 'Green (Bot)' };
      } else {
        // 2 vs 2 Bots (Two alternatives)
        pList = ['red', 'green', 'yellow', 'blue'];
        pTypes = { red: 'human', green: 'bot', yellow: 'human', blue: 'bot' };
        pNames = { red: 'Gamer A (You)', green: 'Robo Bot 1 🤖', yellow: 'Gamer B (You)', blue: 'Robo Bot 2 🤖' };
        pLabels = { red: 'Red (You-A)', green: 'Green (Bot-1)', yellow: 'Yellow (You-B)', blue: 'Blue (Bot-2)' };
      }
    } else if (setupMode === 'dual') {
      if (!columnsAlternative) {
        // 1 vs 1 Human Local
        pList = ['red', 'green'];
        pTypes = { red: 'human', green: 'human' };
        pNames = { red: 'Player 1 🔴', green: 'Player 2 🟢' };
        pLabels = { red: 'Red (P1)', green: 'Green (P2)' };
      } else {
        // 2 vs 2 Human Local (Alternative columns)
        pList = ['red', 'green', 'yellow', 'blue'];
        pTypes = { red: 'human', green: 'human', yellow: 'human', blue: 'human' };
        pNames = { red: 'Player 1 (A)', green: 'Player 2 (A)', yellow: 'Player 1 (B)', blue: 'Player 2 (B)' };
        pLabels = { red: 'Red (P1-A)', green: 'Green (P2-A)', yellow: 'Yellow (P1-B)', blue: 'Blue (P2-B)' };
      }
    } else {
      // Multiplayer mode: 3 or 4 humans (1 column each)
      if (multiplayerCount === 3) {
        pList = ['red', 'green', 'yellow'];
        pTypes = { red: 'human', green: 'human', yellow: 'human' };
        pNames = { red: 'Player 1 🔴', green: 'Player 2 🟢', yellow: 'Player 3 🟡' };
        pLabels = { red: 'Red (P1)', green: 'Green (P2)', yellow: 'Yellow (P3)' };
      } else {
        pList = ['red', 'green', 'yellow', 'blue'];
        pTypes = { red: 'human', green: 'human', yellow: 'human', blue: 'human' };
        pNames = { red: 'Player 1 🔴', green: 'Player 2 🟢', yellow: 'Player 3 🟡', blue: 'Player 4 🔵' };
        pLabels = { red: 'Red (P1)', green: 'Green (P2)', yellow: 'Yellow (P3)', blue: 'Blue (P4)' };
      }
    }

    setTokenPositions(initialPositions);
    setActivePlayers(pList);
    setPlayerTypes(pTypes);
    setPlayerNames(pNames);
    setColorLabels(pLabels);

    setWinnerList([]);
    setCurrentTurnIdx(0);
    setDiceValue(6);
    setHasRolled(false);
    setConsecutiveSixes(0);
    setGameLogs([]);

    addLog('🎲 Welcome to Ludo Classic!');
    addLog(`🎮 Mode: ${setupMode.toUpperCase()} (${columnsAlternative ? '2 Columns Each' : '1 Column Each'})`);
    addLog(`🎲 Easy release: ${easyRelease ? 'Roll 1 or 6' : 'Roll 6 only'}`);
    addLog(`🟢 Turn sequence starting: ${pNames[pList[0]]}`);

    setIsPlaying(true);
  };

  // Get active color
  const currentActiveColor = activePlayers[currentTurnIdx];
  const isCurrentBot = playerTypes[currentActiveColor] === 'bot';
  const activeColorTheme = activeTheme[currentActiveColor as 'red' | 'green' | 'yellow' | 'blue'] || activeTheme.red;

  // Function to map step count to 15x15 grid (x, y) coordinates
  const getTokenPosition = (color: string, step: number, tokenIndex: number): [number, number] => {
    if (step === 0) {
      // In Base harbors
      if (color === 'red') {
        const coords: [number, number][] = [[1, 1], [1, 4], [4, 1], [4, 4]];
        return coords[tokenIndex % coords.length];
      }
      if (color === 'green') {
        const coords: [number, number][] = [[1, 10], [1, 13], [4, 10], [4, 13]];
        return coords[tokenIndex % coords.length];
      }
      if (color === 'yellow') {
        const coords: [number, number][] = [[10, 10], [10, 13], [13, 10], [13, 13]];
        return coords[tokenIndex % coords.length];
      }
      // blue
      const coords: [number, number][] = [[10, 1], [10, 4], [13, 1], [13, 4]];
      return coords[tokenIndex % coords.length];
    }

    if (step === 57) {
      // Landed in center goal! Position in distinct triangular regions of (6, 6) to (8, 8)
      if (color === 'red') return [7, 6];
      if (color === 'green') return [6, 7];
      if (color === 'yellow') return [7, 8];
      return [8, 7]; // blue
    }

    if (step <= 51) {
      // Common loop coordinates
      let baseOffset = 0;
      if (color === 'red') baseOffset = 0;
      else if (color === 'green') baseOffset = 13;
      else if (color === 'yellow') baseOffset = 26;
      else if (color === 'blue') baseOffset = 39;

      const trackIndex = (baseOffset + (step - 1)) % 52;
      return TRACK_COORDS[trackIndex];
    }

    // Home Stretches (steps 52 to 56)
    const stretchIdx = step - 52; // 0 to 4
    if (color === 'red') return [7, 1 + stretchIdx];
    if (color === 'green') return [1 + stretchIdx, 7];
    if (color === 'yellow') return [7, 13 - stretchIdx];
    return [13 - stretchIdx, 7]; // blue
  };

  // Roll Dice Logic
  const rollDice = () => {
    if (isRolling || hasRolled) return;
    setIsRolling(true);
    playSound('roll');
    triggerVibration('tick');

    // Simulated dice rolling intervals
    let rollingCount = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollingCount++;
      if (rollingCount > 8) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalVal);
        setIsRolling(false);
        handlePostRoll(finalVal);
      }
    }, 60);
  };

  // Handles Game Mechanics after Dice Roll
  const handlePostRoll = (roll: number) => {
    setHasRolled(true);
    const color = activePlayers[currentTurnIdx];
    const name = playerNames[color];
    const positions = tokenPositions[color] || [];

    addLog(`🎲 ${name} rolled a ${roll}!`);

    // Rule: Three consecutive 6s skip turn
    if (roll === 6) {
      const nextSixCount = consecutiveSixes + 1;
      if (nextSixCount === 3) {
        addLog('⚠️ Three consecutive 6s! Turn passed.');
        triggerVibration('medium');
        setConsecutiveSixes(0);
        passTurnDelayed(1500);
        return;
      }
      setConsecutiveSixes(nextSixCount);
    } else {
      setConsecutiveSixes(0);
    }

    // Determine playable tokens
    const playableIndices = getPlayableTokens(color, roll);

    if (playableIndices.length === 0) {
      addLog(`🤷 No valid moves possible for ${name}.`);
      triggerVibration('light');
      passTurnDelayed(1600);
    } else {
      // If it's a bot, trigger AI decision
      if (playerTypes[color] === 'bot') {
        botTimerRef.current = setTimeout(() => {
          makeBotMove(color, roll, playableIndices);
        }, 1000);
      }
    }
  };

  // Fetch Playable token indices
  const getPlayableTokens = (color: string, roll: number): number[] => {
    const positions = tokenPositions[color] || [];
    const playable: number[] = [];

    positions.forEach((step, idx) => {
      if (step === 0) {
        // Need 1 or 6 or just 6 to exit base
        const canRelease = easyRelease ? (roll === 1 || roll === 6) : (roll === 6);
        if (canRelease) playable.push(idx);
      } else if (step > 0 && step < 57) {
        // Can walk if does not overshoot home goal (57)
        if (step + roll <= 57) {
          playable.push(idx);
        }
      }
    });

    return playable;
  };

  // Bot AI decision maker
  const makeBotMove = (color: string, roll: number, playableIndices: number[]) => {
    if (playableIndices.length === 0) return;

    // AI Scoring engine for each potential move
    let bestIdx = playableIndices[0];
    let bestScore = -9999;

    playableIndices.forEach((idx) => {
      const currentStep = tokenPositions[color][idx];
      const targetStep = currentStep === 0 ? 1 : currentStep + roll;
      let score = 10; // Default baseline score

      // Prioritize release
      if (currentStep === 0) {
        score += 150;
      }

      // Landing on home goal
      if (targetStep === 57) {
        score += 800;
      }

      // Check coordinates of target cell
      const targetCoord = getTokenPosition(color, targetStep, idx);
      const targetKey = `${targetCoord[0]}_${targetCoord[1]}`;

      // Check if we can capture an opponent token
      const isOpponentPresent = scanOpponentToken(color, targetCoord);
      if (isOpponentPresent && !SAFE_COORDS.includes(targetKey)) {
        score += 1200; // Extremely high priority capture!
      }

      // Prioritize landing on safe zones
      if (SAFE_COORDS.includes(targetKey)) {
        score += 250;
      }

      // Prioritize moving tokens closer to home
      if (currentStep > 40) {
        score += 100;
      }

      // Small random noise to prevent mechanical behavior
      score += Math.random() * 15;

      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });

    moveToken(color, bestIdx, roll);
  };

  // Scan if opponent token occupies cell
  const scanOpponentToken = (myColor: string, coord: [number, number]): { color: string; index: number } | null => {
    let opponent: { color: string; index: number } | null = null;
    activePlayers.forEach((otherColor) => {
      if (otherColor === myColor) return;
      const steps = tokenPositions[otherColor];
      steps.forEach((step, idx) => {
        if (step === 0 || step === 57) return; // ignore bases and finished
        const pos = getTokenPosition(otherColor, step, idx);
        if (pos[0] === coord[0] && pos[1] === coord[1]) {
          opponent = { color: otherColor, index: idx };
        }
      });
    });
    return opponent;
  };

  // Moving token step by step with sounds and animations
  const moveToken = async (color: string, tokenIdx: number, roll: number) => {
    if (animatingToken) return; // Prevent multiple clicks/actions
    setAnimatingToken({ color, index: tokenIdx });

    const currentStep = tokenPositions[color][tokenIdx];
    const finalStep = currentStep === 0 ? 1 : currentStep + roll;

    // Release from base sound and haptic
    if (currentStep === 0) {
      playSound('release');
      triggerVibration('light');
      setTokenPositions(prev => {
        const copy = { ...prev };
        copy[color] = [...copy[color]];
        copy[color][tokenIdx] = 1;
        return copy;
      });
      addLog(`✨ ${playerNames[color]} released a token from base!`);
      await delay(250);
      setAnimatingToken(null);
      finalizeMove(color, tokenIdx, 1);
      return;
    }

    // Sensory walking step-by-step
    let walkingStep = currentStep;
    while (walkingStep < finalStep) {
      walkingStep++;
      setTokenPositions(prev => {
        const copy = { ...prev };
        copy[color] = [...copy[color]];
        copy[color][tokenIdx] = walkingStep;
        return copy;
      });
      playSound('move');
      if (walkingStep % 2 === 0) triggerVibration('tick');
      await delay(140);
    }

    setAnimatingToken(null);
    finalizeMove(color, tokenIdx, finalStep);
  };

  // Resolve results of token movement
  const finalizeMove = (color: string, tokenIdx: number, stepLanded: number) => {
    const coordLanded = getTokenPosition(color, stepLanded, tokenIdx);
    const cellKey = `${coordLanded[0]}_${coordLanded[1]}`;
    const name = playerNames[color];

    let extraTurnTriggered = false;

    // 1. Check home landing
    if (stepLanded === 57) {
      playSound('home');
      triggerVibration('medium');
      addLog(`🎉 ${name}'s token reached the center GOAL!`);
      extraTurnTriggered = true;

      // Check if all tokens finished
      const allFinished = tokenPositions[color].every(step => step === 57);
      if (allFinished && !winnerList.includes(color)) {
        const newWinners = [...winnerList, color];
        setWinnerList(newWinners);
        playSound('win');
        triggerVibration('heavy');
        addLog(`🏆 GLORIOUS! ${name} has finished all tokens! Placement: #${newWinners.length}`);

        // Award bonus coins on win (only for humans vs bots or player local)
        if (playerTypes[color] === 'human' && setupMode === 'single') {
          const coinReward = newWinners.length === 1 ? 50 : newWinners.length === 2 ? 30 : 15;
          if (onAddCoins) onAddCoins(coinReward);
          addLog(`🪙 Awarded ${coinReward} bonus stars!`);
        }
      }
    }

    // 2. Check Capture (if not on safe cells)
    if (stepLanded > 0 && stepLanded < 57 && !SAFE_COORDS.includes(cellKey)) {
      const opponent = scanOpponentToken(color, coordLanded);
      if (opponent) {
        playSound('capture');
        triggerVibration('heavy');
        addLog(`⚔️ BAM! ${name} captured ${playerNames[opponent.color]}'s token and sent it back!`);
        
        setTokenPositions(prev => {
          const copy = { ...prev };
          copy[opponent.color] = [...copy[opponent.color]];
          copy[opponent.color][opponent.index] = 0; // send back
          return copy;
        });

        extraTurnTriggered = true; // Capture earns extra turn!
      }
    }

    // 3. Resolve next turn
    const isSixRoll = diceValue === 6;
    if (isSixRoll && !consecutiveSixes) {
      // Rolled a 6, get another turn unless they triggered a 3-consecutive penalty already
      extraTurnTriggered = true;
    }

    // Verify if player has fully finished (all tokens at 57)
    const isPlayerCompleted = tokenPositions[color].every(step => step === 57);

    // If extra turn earned and they aren't fully finished
    if (extraTurnTriggered && !isPlayerCompleted) {
      addLog(`🔄 Extra turn awarded to ${name}!`);
      setHasRolled(false);
      // If bot, trigger next automated play
      if (playerTypes[color] === 'bot') {
        triggerBotRollDelayed(800);
      }
    } else {
      // Pass turn to next active player
      passTurn();
    }
  };

  // Pass turn to next active color
  const passTurn = () => {
    if (winnerList.length >= activePlayers.length - 1) {
      // Game fully finished
      addLog('🏁 Ludo game is fully completed! Great play everyone.');
      return;
    }

    let nextIdx = (currentTurnIdx + 1) % activePlayers.length;
    // Skip finished players
    let attempts = 0;
    while (attempts < activePlayers.length) {
      const nextColor = activePlayers[nextIdx];
      const isFinished = tokenPositions[nextColor].every(step => step === 57);
      if (!isFinished) {
        break;
      }
      nextIdx = (nextIdx + 1) % activePlayers.length;
      attempts++;
    }

    setCurrentTurnIdx(nextIdx);
    setHasRolled(false);
    setConsecutiveSixes(0);

    const nextColor = activePlayers[nextIdx];
    addLog(`👉 Turn passed to ${playerNames[nextColor]}`);

    // If bot, trigger next roll
    if (playerTypes[nextColor] === 'bot') {
      triggerBotRollDelayed(1000);
    }
  };

  // Delayed helpers to handle async flows cleanly
  const passTurnDelayed = (ms: number) => {
    botTimerRef.current = setTimeout(() => {
      passTurn();
    }, ms);
  };

  const triggerBotRollDelayed = (ms: number) => {
    botTimerRef.current = setTimeout(() => {
      rollDice();
    }, ms);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Auto handle first turn bot
  useEffect(() => {
    if (isPlaying && isCurrentBot && !hasRolled && !isRolling) {
      triggerBotRollDelayed(1000);
    }
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [isPlaying, currentTurnIdx]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  // Reset Game fully
  const handleRestart = () => {
    playSound('click');
    triggerVibration('medium');
    handleStartGame();
  };

  // Group token positions on the 15x15 grid to offset overlays
  const getCellGroups = () => {
    const groups: { [coordKey: string]: { color: string; index: number }[] } = {};
    activePlayers.forEach((color) => {
      const steps = tokenPositions[color] || [];
      steps.forEach((step, index) => {
        const coord = getTokenPosition(color, step, index);
        const key = `${coord[0]}_${coord[1]}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push({ color, index });
      });
    });
    return groups;
  };

  const cellGroups = getCellGroups();

  return (
    <div id="ludo-arena-root" className={`absolute inset-0 flex flex-col pb-16 overflow-hidden select-none transition-colors duration-300 ${activeTheme.bgClass}`}>
      
      {/* HEADER BAR */}
      <div id="ludo-header" className={`h-14 border-b flex items-center justify-between px-3.5 shrink-0 transition-colors duration-300 ${activeTheme.headerBgClass}`}>
        <button
          onClick={() => {
            playSound('click');
            if (isPlaying) {
              setShowQuitConfirm(true);
            } else {
              onBack();
            }
          }}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
            isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1 text-center px-2">
          <h1 className="text-xs font-black tracking-tight flex items-center justify-center gap-1">
            <span>🎲 Ludo Classic</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              playSound('click');
              setShowThemePicker(!showThemePicker);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              showThemePicker
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Switch Theme Palette"
          >
            <Palette size={15} className={showThemePicker ? 'rotate-12' : ''} />
          </button>
          <button
            onClick={() => {
              setSoundOn(!soundOn);
              LudoAudio.play('click', !soundOn);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* THEME PICKER OVERLAY */}
      <AnimatePresence>
        {showThemePicker && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-14 left-0 right-0 p-5 border-b z-30 shadow-xl ${activeTheme.cardBgClass}`}
          >
            <div className="space-y-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-center block text-slate-500 dark:text-slate-450">
                Choose Board Theme
              </span>
              <div className="grid grid-cols-4 gap-3">
                {Object.values(LUDO_THEMES).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveThemeId(t.id);
                      playSound('click');
                      setShowThemePicker(false);
                    }}
                    className={`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all cursor-pointer ${
                      activeThemeId === t.id
                        ? 'border-indigo-600 bg-indigo-50/10 ring-2 ring-indigo-500/50 shadow-md transform scale-[1.02]'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:scale-[1.02]'
                    }`}
                  >
                    <div className="flex-1 flex items-center justify-center p-1">
                      <MiniBoardPreview theme={t} />
                    </div>
                    <span className={`text-[11px] font-black tracking-tight mt-1.5 block text-center ${
                      activeThemeId === t.id ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-750 dark:text-slate-300'
                    }`}>
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER VIEW: SETUP SCREEN VS PLAYING arena */}
      {!isPlaying ? (
        <div id="ludo-setup-screen" className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          
          {/* Hero Header Row mimicking the screenshot */}
          <div className="flex items-center justify-between gap-4 py-3 px-1">
            <div className="w-[44%] shrink-0">
              <img
                src={ludoBoardMockup}
                alt="Ludo Classic 3D Board"
                className="w-full object-contain rounded-2xl shadow-lg border border-slate-200/40 dark:border-slate-800/40 transform -rotate-2 scale-[1.03]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 text-left">
              <h2 className="text-3xl font-black tracking-tight leading-none flex flex-col">
                <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 bg-clip-text text-transparent font-black">LUDO</span>
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent font-black">CLASSIC</span>
              </h2>
              <p className="text-[10px] font-bold leading-tight text-slate-500 dark:text-slate-400 mt-2">
                The timeless board game of luck & strategy!
              </p>
            </div>
          </div>

          {/* SETUP SECTION 1: GAME MODE SELECT */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest pl-1 block text-left text-slate-400 dark:text-slate-500">
              Choose Game Mode
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { playSound('click'); setSetupMode('single'); }}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer h-24 ${
                  setupMode === 'single'
                    ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-white shadow-lg shadow-blue-500/25 border-transparent'
                    : isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-600 shadow-[0_4px_12px_rgba(0,0,0,0.01)]'
                }`}
              >
                <Cpu size={20} className={setupMode === 'single' ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                <div className="text-center">
                  <span className="text-[10px] font-black tracking-tight block">vs Bot</span>
                  <span className="text-[8px] opacity-80 block font-bold mt-0.5">Play against AI</span>
                </div>
              </button>
              <button
                onClick={() => { playSound('click'); setSetupMode('dual'); }}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer h-24 ${
                  setupMode === 'dual'
                    ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/25 border-transparent'
                    : isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-600 shadow-[0_4px_12px_rgba(0,0,0,0.01)]'
                }`}
              >
                <Users size={20} className={setupMode === 'dual' ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                <div className="text-center">
                  <span className="text-[10px] font-black tracking-tight block">Pass & Play</span>
                  <span className="text-[8px] opacity-80 block font-bold mt-0.5">2 Players Local</span>
                </div>
              </button>
              <button
                onClick={() => { playSound('click'); setSetupMode('multi'); }}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer h-24 ${
                  setupMode === 'multi'
                    ? 'bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25 border-transparent'
                    : isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-600 shadow-[0_4px_12px_rgba(0,0,0,0.01)]'
                }`}
              >
                <Trophy size={20} className={setupMode === 'multi' ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                <div className="text-center">
                  <span className="text-[10px] font-black tracking-tight block">Multiplayer</span>
                  <span className="text-[8px] opacity-80 block font-bold mt-0.5">Play Local</span>
                </div>
              </button>
            </div>
          </div>

          {/* SETUP SECTION 2: CONFIGURATION CARD CONTAINER */}
          <div className={`p-5 rounded-[24px] border space-y-4 text-left transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-150 shadow-[0_4px_24px_rgba(0,0,0,0.015)]'
          }`}>
            
            {/* Conditional Column count selection (for Single or Dual) */}
            {(setupMode === 'single' || setupMode === 'dual') && (
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Columns:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { playSound('click'); setColumnsAlternative(false); }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      !columnsAlternative
                        ? `${modeGradientClass}`
                        : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-[11px] font-black tracking-tight">1 Column Each</span>
                    <span className="text-[8px] opacity-85 block font-bold mt-0.5">Classic Mode</span>
                  </button>
                  <button
                    onClick={() => { playSound('click'); setColumnsAlternative(true); }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      columnsAlternative
                        ? `${modeGradientClass}`
                        : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-[11px] font-black tracking-tight">2 Columns Each</span>
                    <span className="text-[8px] opacity-85 block font-bold mt-0.5">Advanced Mode</span>
                  </button>
                </div>
              </div>
            )}

            {/* Conditional Player Count (for Multiplayer) */}
            {setupMode === 'multi' && (
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Number of Players:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { playSound('click'); setMultiplayerCount(3); }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      multiplayerCount === 3
                        ? `${modeGradientClass}`
                        : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-[11px] font-black tracking-tight">3 Players</span>
                    <span className="text-[8px] opacity-85 block font-bold mt-0.5">Triangular Match</span>
                  </button>
                  <button
                    onClick={() => { playSound('click'); setMultiplayerCount(4); }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      multiplayerCount === 4
                        ? `${modeGradientClass}`
                        : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-[11px] font-black tracking-tight">4 Players</span>
                    <span className="text-[8px] opacity-85 block font-bold mt-0.5">Classic Quad Match</span>
                  </button>
                </div>
              </div>
            )}

            {/* Token count selector */}
            <div className="space-y-2 border-t pt-3.5 border-slate-100 dark:border-slate-800/60">
              <label className={`text-[10px] font-black uppercase tracking-widest block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Tokens per Color:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { playSound('click'); setTokenCountChoice(2); }}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    tokenCountChoice === 2
                      ? `${modeGradientClass}`
                      : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="text-[11px] font-black tracking-tight">2 Tokens (Fast)</span>
                  <span className="text-[8px] opacity-85 block font-bold mt-0.5">Quick Game</span>
                </button>
                <button
                  onClick={() => { playSound('click'); setTokenCountChoice(4); }}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    tokenCountChoice === 4
                      ? `${modeGradientClass}`
                      : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="text-[11px] font-black tracking-tight">4 Tokens</span>
                  <span className="text-[8px] opacity-85 block font-bold mt-0.5">Standard Game</span>
                </button>
              </div>
            </div>

            {/* Base Unlock rules option */}
            <div className="space-y-2 border-t pt-3.5 border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-widest block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Easy Release (1 or 6)
                  </label>
                  <span className="text-[8px] font-bold text-slate-400 block mt-0.5">Unlock token on 1 or 6 instead of only 6</span>
                </div>
                <button
                  onClick={() => { playSound('click'); setEasyRelease(!easyRelease); }}
                  className={`relative inline-flex h-5.5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    easyRelease ? easyReleaseToggleClass : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      easyRelease ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

          </div>

          {/* Large Gradient Action Button mimicking the screenshot */}
          <button
            onClick={handleStartGame}
            className={`w-full bg-gradient-to-r ${startButtonGradientClass} hover:opacity-95 active:scale-[0.98] text-white py-3.5 px-4 rounded-[22px] flex flex-col items-center justify-center shadow-lg transition-all cursor-pointer mt-4`}
          >
            <div className="flex items-center justify-center gap-2">
              <Play size={14} fill="white" className="text-white" />
              <span className="text-xs font-black tracking-wider uppercase">Start Game</span>
            </div>
            <span className="text-[8.5px] opacity-90 font-bold mt-1">
              Roll the dice and begin your journey!
            </span>
          </button>
        </div>
      ) : (
        /* PLAYING ARENA VIEW */
        <div id="ludo-arena-view" className="flex-1 flex flex-col overflow-hidden">
          
          {/* HEADER STATUS: PULSING ACTIVE TURN */}
          <div className="px-4 py-2 flex items-center justify-between shrink-0 transition-colors" style={{ backgroundColor: `${activeColorTheme.hex}15` }}>
            <div className="flex items-center space-x-2">
              {/* Spinning color indicator */}
              <span className="w-3.5 h-3.5 rounded-full border border-white/20 animate-pulse shrink-0" style={{ backgroundColor: activeColorTheme.hex, boxShadow: `0 0 8px ${activeColorTheme.hex}aa` }} />
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: activeColorTheme.hex }}>
                  {colorLabels[currentActiveColor]} Turn
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-none">
                  {isCurrentBot ? 'AI Bot calculating...' : 'Roll or select a token!'}
                </span>
              </div>
            </div>

            {/* Roll History shortcut preview */}
            <div className="flex items-center space-x-1.5 text-[10px] font-black font-mono">
              <span className="text-slate-400 uppercase">Dice:</span>
              <span className="px-2 py-0.5 rounded-md font-extrabold text-white" style={{ backgroundColor: activeColorTheme.hex }}>
                {diceValue}
              </span>
            </div>
          </div>

          {/* MAIN INTERACTIVE LUDO BOARD SCENE */}
          <div className="flex-1 flex items-center justify-center p-2.5 overflow-hidden">
            <div className="w-full max-w-[340px] aspect-square relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-1 shadow-md">
              
              {/* GRID BOARD CONTAINER */}
              <div className="w-full h-full grid grid-cols-15 grid-rows-15 rounded-2xl overflow-hidden relative select-none bg-slate-50 dark:bg-slate-950 p-[1px]">
                
                {/* 1. RED BASE (Row 0-5, Col 0-5) */}
                <div 
                  className={`m-[3px] rounded-2xl p-1 relative flex items-center justify-center transition-all duration-300 ${
                    currentActiveColor === 'red' 
                      ? activeTheme.red.active 
                      : activeTheme.red.base
                  }`} 
                  style={{ gridRow: '1 / 7', gridColumn: '1 / 7' }}
                >
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl p-2 flex flex-row items-center justify-center gap-2 relative shadow-inner">
                    {/* Harbor Ports - Horizontal line in center */}
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.red.hex}40` }} />
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.red.hex}40` }} />
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.red.hex}40` }} />
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.red.hex}40` }} />
                  </div>
                </div>

                {/* 2. GREEN BASE (Row 0-5, Col 9-14) */}
                <div 
                  className={`m-[3px] rounded-2xl p-1 relative flex items-center justify-center transition-all duration-300 ${
                    currentActiveColor === 'green' 
                      ? activeTheme.green.active 
                      : activeTheme.green.base
                  }`} 
                  style={{ gridRow: '1 / 7', gridColumn: '10 / 16' }}
                >
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl p-2 flex flex-row items-center justify-center gap-2 relative shadow-inner">
                    {/* Harbor Ports - Horizontal line in center */}
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.green.hex}40` }} />
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.green.hex}40` }} />
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.green.hex}40` }} />
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.green.hex}40` }} />
                  </div>
                </div>

                {/* 3. YELLOW BASE (Row 9-14, Col 9-14) */}
                <div 
                  className={`m-[3px] rounded-2xl p-1 relative flex items-center justify-center transition-all duration-300 ${
                    currentActiveColor === 'yellow' 
                      ? activeTheme.yellow.active 
                      : activeTheme.yellow.base
                  }`} 
                  style={{ gridRow: '10 / 16', gridColumn: '10 / 16' }}
                >
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl p-2 flex flex-row items-center justify-center gap-2 relative shadow-inner">
                    {/* Harbor Ports - Horizontal line in center */}
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.yellow.hex}40` }} />
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.yellow.hex}40` }} />
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.yellow.hex}40` }} />
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.yellow.hex}40` }} />
                  </div>
                </div>

                {/* 4. BLUE BASE (Row 9-14, Col 0-5) */}
                <div 
                  className={`m-[3px] rounded-2xl p-1 relative flex items-center justify-center transition-all duration-300 ${
                    currentActiveColor === 'blue' 
                      ? activeTheme.blue.active 
                      : activeTheme.blue.base
                  }`} 
                  style={{ gridRow: '10 / 16', gridColumn: '1 / 7' }}
                >
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl p-2 flex flex-row items-center justify-center gap-2 relative shadow-inner">
                    {/* Harbor Ports - Horizontal line in center */}
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.blue.hex}40` }} />
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.blue.hex}40` }} />
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.blue.hex}40` }} />
                    <div className="w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-950 border-2 shadow-inner transition-colors" style={{ borderColor: `${activeTheme.blue.hex}40` }} />
                  </div>
                </div>

                {/* 5. CENTER GOAL TRIANGLES (Row 6-8, Col 6-8) */}
                <div className="m-[3px] rounded-2xl bg-slate-100 dark:bg-slate-800 relative shadow-md overflow-hidden flex items-center justify-center" style={{ gridRow: '7 / 10', gridColumn: '7 / 10' }}>
                  {/* Triangular Split Overlay using precise SVG */}
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                    <polygon points="0,0 50,50 0,100" fill={activeTheme.red.hex} opacity="0.9" /> {/* Red left */}
                    <polygon points="0,0 50,50 100,0" fill={activeTheme.green.hex} opacity="0.9" /> {/* Green top */}
                    <polygon points="100,0 50,50 100,100" fill={activeTheme.yellow.hex} opacity="0.9" /> {/* Yellow right */}
                    <polygon points="0,100 50,50 100,100" fill={activeTheme.blue.hex} opacity="0.9" /> {/* Blue bottom */}
                    {/* Inner gold center ring */}
                    <circle cx="50" cy="50" r="14" fill="#FFD700" className="animate-pulse" />
                    <polygon points="46,42 54,42 50,34" fill={activeTheme.green.hex} />
                    <polygon points="58,46 58,54 66,50" fill={activeTheme.yellow.hex} />
                    <polygon points="46,58 54,58 50,66" fill={activeTheme.blue.hex} />
                    <polygon points="42,46 42,54 34,50" fill={activeTheme.red.hex} />
                  </svg>
                </div>

                {/* 6. RENDER 72 TRACK CELLS INDIVIDUALLY */}
                {Array.from({ length: 15 }).map((_, r) => {
                  return Array.from({ length: 15 }).map((_, c) => {
                    // Filter out bases & center
                    const isBaseRed = r < 6 && c < 6;
                    const isBaseGreen = r < 6 && c > 8;
                    const isBaseYellow = r > 8 && c > 8;
                    const isBaseBlue = r > 8 && c < 6;
                    const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;

                    if (isBaseRed || isBaseGreen || isBaseYellow || isBaseBlue || isCenter) return null;

                    // Identify colors for home stretches or starts
                    let cellBg = isDark ? 'bg-slate-900 border-transparent' : 'bg-white border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.02)]';
                    let hasStar = false;

                    const key = `${r}_${c}`;

                    // Red home stretch
                    if (r === 7 && c >= 1 && c <= 5) {
                      cellBg = activeTheme.red.cell;
                    }
                    // Green home stretch
                    else if (c === 7 && r >= 1 && r <= 5) {
                      cellBg = activeTheme.green.cell;
                    }
                    // Yellow home stretch
                    else if (r === 7 && c >= 9 && c <= 13) {
                      cellBg = activeTheme.yellow.cell;
                    }
                    // Blue home stretch
                    else if (c === 7 && r >= 9 && r <= 13) {
                      cellBg = activeTheme.blue.cell;
                    }

                    // Starting cells
                    else if (r === 6 && c === 1) {
                      cellBg = `${activeTheme.red.cell} ring-2 ${activeTheme.red.startRing}`; // Red Start
                    }
                    else if (r === 1 && c === 8) {
                      cellBg = `${activeTheme.green.cell} ring-2 ${activeTheme.green.startRing}`; // Green Start
                    }
                    else if (r === 8 && c === 13) {
                      cellBg = `${activeTheme.yellow.cell} ring-2 ${activeTheme.yellow.startRing}`; // Yellow Start
                    }
                    else if (r === 13 && c === 6) {
                      cellBg = `${activeTheme.blue.cell} ring-2 ${activeTheme.blue.startRing}`; // Blue Start
                    }

                    // Star safe zones
                    else if (SAFE_COORDS.includes(key)) {
                      hasStar = true;
                      cellBg = isDark ? 'bg-amber-950/20' : 'bg-amber-50';
                    }

                    return (
                      <div
                        key={`cell-${r}-${c}`}
                        className={`rounded-[5.5px] m-[1px] text-[6px] flex items-center justify-center font-bold text-slate-400 relative transition-all ${cellBg}`}
                        style={{ gridRow: r + 1, gridColumn: c + 1 }}
                      >
                        {hasStar && <Star size={10} className="text-amber-500 fill-amber-500" />}
                      </div>
                    );
                  });
                })}

              </div>

              {/* FLOATING ABSOLUTE POSITIONED TOKENS (WITH SPRING ANIMATION) */}
              {activePlayers.map((color) => {
                const steps = tokenPositions[color] || [];
                const isMyTurn = currentActiveColor === color;
                const playables = hasRolled ? getPlayableTokens(color, diceValue) : [];

                return steps.map((step, index) => {
                  const coord = getTokenPosition(color, step, index);
                  const r = coord[0];
                  const c = coord[1];

                  // Determine stack position offsets inside the cell
                  const coordKey = `${r}_${c}`;
                  const group = cellGroups[coordKey] || [];
                  const N = group.length;
                  const groupIndex = group.findIndex(item => item.color === color && item.index === index);

                  // Base coordinates per cell
                  const leftBase = c * (100 / 15);
                  const topBase = r * (100 / 15);

                  // Quadrant stack offsets
                  let dx = 0;
                  let dy = 0;
                  let scale = 0.85;

                  if (N > 1 && step > 0 && step < 57) {
                    scale = 0.52; // shrink to fit
                    const angle = (groupIndex / N) * 2 * Math.PI;
                    dx = Math.cos(angle) * 1.5; // percent offset
                    dy = Math.sin(angle) * 1.5;
                  }

                  const canThisMove = isMyTurn && hasRolled && playables.includes(index) && !isCurrentBot;

                  // Token Styling class
                  const colorKey = color as 'red' | 'green' | 'yellow' | 'blue';
                  const tokenBg = activeTheme[colorKey].token;
                  const ringColor = color === 'yellow' ? 'border-slate-800' : 'border-white';

                  return (
                    <motion.div
                      key={`token-${color}-${index}`}
                      onClick={() => {
                        if (canThisMove) {
                          playSound('click');
                          moveToken(color, index, diceValue);
                        }
                      }}
                      className={`absolute rounded-full border-2 ${ringColor} flex items-center justify-center font-bold text-[9px] shadow-md z-20 cursor-pointer ${tokenBg} ${
                        canThisMove ? 'ring-4 ring-indigo-500/80 animate-bounce cursor-pointer [animation-duration:0.6s]' : ''
                      }`}
                      style={{
                        width: '6.6666%',
                        height: '6.6666%',
                        left: `${leftBase + dx}%`,
                        top: `${topBase + dy}%`,
                      }}
                      animate={{
                        scale: canThisMove ? 1.15 : scale,
                      }}
                      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    >
                      {/* Inner token details */}
                      {step === 57 ? (
                        <span className="text-[7px] font-black pointer-events-none">👑</span>
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full ${color === 'yellow' ? 'bg-slate-850' : 'bg-white'} opacity-90 shadow-sm pointer-events-none`} />
                      )}
                    </motion.div>
                  );
                });
              })}

            </div>
          </div>

          {/* LOWER CONTROLS & HUD AREA */}
          <div className={`p-4 shrink-0 transition-colors border-t flex flex-col items-center justify-center space-y-4 ${activeTheme.headerBgClass}`}>
            
            {/* Perfectly Centered Interactive Dice */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <button
                disabled={isRolling || hasRolled || isCurrentBot}
                onClick={rollDice}
                className={`relative w-20 h-20 rounded-[24px] flex items-center justify-center transition-all cursor-pointer ${
                  isRolling ? 'scale-90 animate-pulse' : 'hover:scale-105 active:scale-95'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${activeColorTheme.hex}, ${activeColorTheme.hex}dd)`,
                  boxShadow: `0 8px 24px ${activeColorTheme.hex}50, inset 0 2px 4px rgba(255,255,255,0.25)`,
                  border: `3px solid ${activeColorTheme.hex}25`,
                }}
              >
                {/* Dice face values inside - Custom physical dice */}
                {isRolling ? (
                  <div className="animate-spin [animation-duration:0.4s]">
                    <Sparkles size={24} className="text-white animate-pulse" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 w-11 h-11 p-1.5 bg-white rounded-[14px] shadow-[0_4px_8px_rgba(0,0,0,0.15),inset_0_1.5px_2px_rgba(0,0,0,0.12)] border border-slate-100">
                    {(() => {
                      const activeDots = {
                        1: [4],
                        2: [0, 8],
                        3: [0, 4, 8],
                        4: [0, 2, 6, 8],
                        5: [0, 2, 4, 6, 8],
                        6: [0, 2, 3, 5, 6, 8]
                      }[diceValue] || [];
                      return Array.from({ length: 9 }).map((_, idx) => {
                        const isActive = activeDots.includes(idx);
                        return (
                          <div key={idx} className="flex items-center justify-center">
                            {isActive && (
                              <div 
                                className="w-2.5 h-2.5 rounded-full shadow-[inset_0_1.5px_1.5px_rgba(0,0,0,0.3)]"
                                style={{ backgroundColor: activeColorTheme.hex }}
                              />
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </button>

              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {isRolling ? 'ROLLING...' : isCurrentBot ? 'BOT PLAYING' : hasRolled ? 'TAP TOKEN' : 'TAP TO ROLL'}
              </span>
            </div>

            {/* Quick Actions Footer */}
            <div className="w-full flex items-center justify-center border-t pt-3 border-slate-100 dark:border-slate-800">
              <button
                onClick={handleRestart}
                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Restart Session</span>
              </button>
            </div>

          </div>

        </div>
      )}



      {/* QUIT GAME CONFIRMATION MODAL */}
      <AnimatePresence>
        {showQuitConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-xs rounded-3xl p-5 text-center border ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <span className="text-3xl block mb-2">⚠️</span>
              <h3 className="text-sm font-black mb-1">Quit Current Arena?</h3>
              <p className="text-[10px] opacity-75 max-w-[200px] mx-auto leading-relaxed mb-4">
                Your current active game session will be lost. Are you sure you want to return to lobby?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { playSound('click'); setShowQuitConfirm(false); }}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer ${
                    isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Resume Play
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setShowQuitConfirm(false);
                    setIsPlaying(false);
                  }}
                  className="py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer"
                >
                  Quit Arena
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
