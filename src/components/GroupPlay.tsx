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
  Palette,
  RotateCw,
  Sparkles,
  Users,
  Check,
  X
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';

// Web Audio API Synthesizer to avoid any missing static files
class BottleAudio {
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

  static play(type: 'tick' | 'swipe' | 'land' | 'pop' | 'success', enabled: boolean) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      switch (type) {
        case 'tick': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(500, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.03);
          
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.03);
          
          osc.start(now);
          osc.stop(now + 0.03);
          break;
        }
        case 'swipe': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(380, now + 0.3);
          
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
          
          osc.start(now);
          osc.stop(now + 0.3);
          break;
        }
        case 'land': {
          const frequencies = [523.25, 659.25, 783.99, 1046.50];
          frequencies.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            
            gain.gain.setValueAtTime(0.06, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            
            osc.start(now + idx * 0.05);
            osc.stop(now + 0.5);
          });
          break;
        }
        case 'pop': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(550, now + 0.1);
          
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }
        case 'success': {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.type = 'triangle';
          osc2.type = 'sine';
          
          osc1.frequency.setValueAtTime(523.25, now);
          osc1.frequency.setValueAtTime(659.25, now + 0.08);
          osc1.frequency.setValueAtTime(783.99, now + 0.16);
          
          osc2.frequency.setValueAtTime(1046.50, now);
          
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.4);
          osc2.stop(now + 0.4);
          break;
        }
      }
    } catch (e) {
      console.warn('Web Audio Playback failed:', e);
    }
  }
}

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
  size: number;
}

interface GroupPlayProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  soundEnabled?: boolean;
  onAddCoins?: (amount: number) => void;
}

interface GameThemeConfig {
  id: string;
  name: string;
  bgClass: string;
  dialBgClass: string;
  ringBorderClass: string;
  bottleColor: string;
  bottleCapColor: string;
  bottleBorder: string;
  accentBadge: string;
  textColor: string;
  subtextColor: string;
  btnPrimary: string;
}

const SPIN_THEMES: Record<string, GameThemeConfig> = {
  cosmic: {
    id: 'cosmic',
    name: 'Midnight Cosmic 🌌',
    bgClass: 'bg-gradient-to-br from-[#0B0C10] via-[#121A30] to-[#1F1C2C] text-white',
    dialBgClass: 'bg-[#131A35]/90 border-[#6C5CE7]/40 shadow-[0_0_50px_rgba(108,92,231,0.3)]',
    ringBorderClass: 'border-[#6C5CE7]/30',
    bottleColor: 'rgba(129, 236, 236, 0.25)',
    bottleCapColor: '#81ECEC',
    bottleBorder: '#81ECEC',
    accentBadge: 'bg-[#6C5CE7]/20 text-[#a29bfe] border border-[#6C5CE7]/30',
    textColor: 'text-white',
    subtextColor: 'text-indigo-200/70',
    btnPrimary: 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white'
  },
  neon: {
    id: 'neon',
    name: 'Cyber Arcade ⚡',
    bgClass: 'bg-gradient-to-br from-[#030303] via-[#0E0320] to-[#01010A] text-white',
    dialBgClass: 'bg-black/90 border-[#D946EF]/50 shadow-[0_0_50px_rgba(217,70,239,0.4)]',
    ringBorderClass: 'border-[#D946EF]/30',
    bottleColor: 'rgba(217, 70, 239, 0.25)',
    bottleCapColor: '#D946EF',
    bottleBorder: '#D946EF',
    accentBadge: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30',
    textColor: 'text-white',
    subtextColor: 'text-fuchsia-300/70',
    btnPrimary: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white'
  },
  sunset: {
    id: 'sunset',
    name: 'Peach Sunset 🍑',
    bgClass: 'bg-gradient-to-br from-[#FFF5F5] via-[#FFF3E0] to-[#FFE0B2] text-slate-800',
    dialBgClass: 'bg-white border-[#F97316]/40 shadow-[0_10px_40px_rgba(249,115,22,0.2)]',
    ringBorderClass: 'border-[#F97316]/20',
    bottleColor: 'rgba(249, 115, 22, 0.18)',
    bottleCapColor: '#F97316',
    bottleBorder: '#EA580C',
    accentBadge: 'bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]',
    textColor: 'text-slate-800',
    subtextColor: 'text-slate-500',
    btnPrimary: 'bg-gradient-to-r from-orange-500 to-rose-500 text-white'
  },
  emerald: {
    id: 'emerald',
    name: 'Forest Mint 🍃',
    bgClass: 'bg-gradient-to-br from-[#061A14] via-[#042B1F] to-[#02130F] text-white',
    dialBgClass: 'bg-[#032118] border-[#10B981]/40 shadow-[0_0_40px_rgba(16,185,129,0.3)]',
    ringBorderClass: 'border-[#10B981]/30',
    bottleColor: 'rgba(16, 185, 129, 0.22)',
    bottleCapColor: '#10B981',
    bottleBorder: '#059669',
    accentBadge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    textColor: 'text-white',
    subtextColor: 'text-emerald-200/70',
    btnPrimary: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
  }
};

// Would You Rather Decks
const WOULD_YOU_RATHER_DECKS = [
  { optionA: "Have cute dinosaur feet 🦖", optionB: "Have wings but you can only hover 1 inch off the floor 🪽", ratioA: 54 },
  { optionA: "Only be able to whisper 🤫", optionB: "Only be able to shout everything you say 📢", ratioA: 72 },
  { optionA: "Live in a grand amusement park 🎡", optionB: "Live in a giant candy and chocolate factory 🍬", ratioA: 48 },
  { optionA: "Be able to speak with animals 🐶", optionB: "Be able to speak every language fluently 🗣️", ratioA: 63 },
  { optionA: "Have delicious edible chocolate hair 🍫", optionB: "Have glowing cyber neon fiber-optic hair 💡", ratioA: 41 },
  { optionA: "Only play video games forever 🎮", optionB: "Only eat pizza and ice cream forever 🍕", ratioA: 59 },
  { optionA: "Be 10 feet tall like a friendly giraffe 🦒", optionB: "Be 1 foot tall like an adventurous ant 🐜", ratioA: 38 },
  { optionA: "Explore the mysteries of the deep ocean 🌊", optionB: "Explore the stars of outer space 🚀", ratioA: 67 },
  { optionA: "Have a cute pocket pet dragon 🐉", optionB: "Have a rideable, giant fluffy puppy 🐶", ratioA: 52 },
  { optionA: "Control fire elements 🔥", optionB: "Control water elements 💧", ratioA: 45 },
  { optionA: "Be able to fly at walking speed 🦅", optionB: "Be able to run at highway speed but backwards 🏃‍♂️", ratioA: 55 }
];

// Never Have I Ever Decks
const NEVER_HAVE_I_EVER_DECKS = [
  "snorted while laughing out loud.",
  "eaten a piece of candy off the floor after the 5-second rule expired.",
  "accidentally walked directly into a clear glass window or sliding door.",
  "worn mismatching socks on purpose to school or a party.",
  "slept with more than 3 stuffed animals at the same time.",
  "pretended to know a song and sung gibberish lyrics with total confidence.",
  "put a funny sticker on my forehead or nose and walked around the house.",
  "held a serious conversation with a pet dog, cat, or bird.",
  "danced like a maniac in front of a mirror when nobody was watching.",
  "tried to see if I possessed secret mind powers to move items.",
  "giggled during a very quiet or serious moment at school.",
  "tried to brush my teeth with my non-dominant hand and made a mess."
];

export const GroupPlay: React.FC<GroupPlayProps> = ({
  onBack,
  theme = 'light',
  soundEnabled = true,
  onAddCoins,
}) => {
  // Navigation Screens: null means main 3-card selector grid
  const [activeScreen, setActiveScreen] = useState<'truth-or-dare' | 'would-you-rather' | 'never-have-i-ever' | null>(null);

  // General audio states
  const [isAudioOn, setIsAudioOn] = useState(soundEnabled);

  // Dynamic Theme State for the Truth or Dare Screen
  const [activeThemeId, setActiveThemeId] = useState<string>(theme === 'dark' ? 'cosmic' : 'sunset');
  const activeTheme = SPIN_THEMES[activeThemeId] || SPIN_THEMES.cosmic;
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Spinning physics engine states
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Would You Rather states
  const [wyrIndex, setWyrIndex] = useState(0);
  const [wyrVoted, setWyrVoted] = useState<'A' | 'B' | null>(null);

  // Never Have I Ever states
  const [nhieIndex, setNhieIndex] = useState(0);
  const [nhieReactions, setNhieReactions] = useState<Array<{ id: string; emoji: string; x: number; y: number }>>([]);

  // Physics animation reference
  const requestRef = useRef<number | null>(null);
  const lastTickAngle = useRef(0);

  // Interactive pointers dragging
  const bottleRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startAngle = useRef(0);
  const lastAngle = useRef(0);
  const dragVelocity = useRef(0);
  const lastDragTime = useRef(0);

  // Clean animation frame on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const playSound = (type: 'tick' | 'swipe' | 'land' | 'pop' | 'success') => {
    BottleAudio.play(type, isAudioOn);
  };

  // Particle Burst on stop
  const triggerConfetti = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    const distance = 80;
    const x = Math.sin(rad) * distance;
    const y = -Math.cos(rad) * distance;

    const colors = ['#FF7675', '#74B9FF', '#55EFC4', '#FFEAA7', '#A29BFE', '#FD79A8', '#F1C40F', '#2ECC71'];
    const newParticles: Particle[] = Array.from({ length: 32 }).map((_, i) => {
      const pAngle = rad + (Math.random() - 0.5) * 2;
      const speed = 3 + Math.random() * 6;
      return {
        id: `${Date.now()}-${i}-${Math.random()}`,
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: pAngle,
        speed,
        size: 6 + Math.random() * 6,
      };
    });

    setParticles(newParticles);

    let frames = 0;
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + Math.cos(p.angle) * p.speed,
            y: p.y + Math.sin(p.angle) * p.speed + 0.15,
            speed: p.speed * 0.92,
            size: Math.max(0, p.size - 0.25),
          }))
          .filter((p) => p.size > 0.5)
      );

      frames++;
      if (frames > 40) {
        clearInterval(interval);
        setParticles([]);
      }
    }, 20);
  };

  const startFrictionPhysics = (initialVelocity: number) => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    setIsSpinning(true);

    let currentVel = initialVelocity;
    let currentRot = rotation;
    lastTickAngle.current = currentRot;

    // friction = 0.92 means it will decay rapidly and stop in less than 2.5 seconds (around 60-90 frames)
    const friction = 0.92;
    const minVelocity = 0.05;

    const animate = () => {
      currentVel *= friction;
      currentRot += currentVel;

      const tickSpacing = 16;
      if (Math.abs(currentRot - lastTickAngle.current) >= tickSpacing) {
        playSound('tick');
        triggerVibration('tick');
        lastTickAngle.current = currentRot;
      }

      setRotation(currentRot);

      if (Math.abs(currentVel) > minVelocity) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const finalAngle = ((currentRot % 360) + 360) % 360;
        playSound('land');
        triggerVibration('heavy');
        triggerConfetti(finalAngle);
        if (onAddCoins) onAddCoins(10);
      }
    };

    requestRef.current = requestAnimationFrame(animate);
  };

  const handleTapSpin = () => {
    if (isSpinning) return;
    playSound('swipe');
    triggerVibration('light');
    const direction = Math.random() > 0.5 ? 1 : -1;
    // Keep initial velocity moderately high but with friction=0.93, stopping is super snappy (< 2 seconds)
    const initialVelocity = (25 + Math.random() * 15) * direction;
    startFrictionPhysics(initialVelocity);
  };

  // Direct touch spin anywhere
  const handleBackdropClickToSpin = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.no-spin-tap') || isSpinning) return;
    handleTapSpin();
  };

  // Pointer drag helpers
  const getPointerCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!bottleRef.current) return null;
    const rect = bottleRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else return null;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - centerX,
      y: clientY - centerY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isSpinning) return;
    const coords = getPointerCoords(e);
    if (!coords) return;

    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    isDragging.current = true;
    const angleRad = Math.atan2(coords.y, coords.x);
    const angleDeg = (angleRad * 180) / Math.PI;

    startAngle.current = angleDeg - rotation;
    lastAngle.current = angleDeg;
    dragVelocity.current = 0;
    lastDragTime.current = performance.now();
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const coords = getPointerCoords(e);
    if (!coords) return;

    const angleRad = Math.atan2(coords.y, coords.x);
    const angleDeg = (angleRad * 180) / Math.PI;

    const newRotation = angleDeg - startAngle.current;
    
    const currentTime = performance.now();
    const dt = currentTime - lastDragTime.current;
    
    if (dt > 0) {
      let deltaAngle = angleDeg - lastAngle.current;
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;
      dragVelocity.current = deltaAngle / (dt / 16.67);
    }

    setRotation(newRotation);
    
    const tickDistance = Math.abs(newRotation - lastTickAngle.current);
    if (tickDistance >= 18) {
      playSound('tick');
      triggerVibration('tick');
      lastTickAngle.current = newRotation;
    }

    lastAngle.current = angleDeg;
    lastDragTime.current = currentTime;
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (Math.abs(dragVelocity.current) > 1.2) {
      playSound('swipe');
      triggerVibration('light');
      const clampedVelocity = Math.max(-38, Math.min(38, dragVelocity.current * 1.2));
      startFrictionPhysics(clampedVelocity);
    }
  };

  // Would You Rather vote
  const handleWyrVote = (choice: 'A' | 'B') => {
    if (wyrVoted) return;
    setWyrVoted(choice);
    playSound('success');
    triggerVibration('medium');
    if (onAddCoins) onAddCoins(5);
  };

  const handleWyrNext = () => {
    setWyrVoted(null);
    setWyrIndex((prev) => (prev + 1) % WOULD_YOU_RATHER_DECKS.length);
    playSound('pop');
    triggerVibration('light');
  };

  // Never Have I Ever
  const handleNhieVote = (type: 'guilty' | 'innocent') => {
    const emoji = type === 'guilty' ? '🙋‍♂️' : '😇';
    const id = `re-${Date.now()}-${Math.random()}`;
    const newR = {
      id,
      emoji,
      x: (Math.random() - 0.5) * 80,
      y: 0
    };

    setNhieReactions(prev => [...prev, newR]);
    playSound('pop');
    triggerVibration('tick');
    if (onAddCoins) onAddCoins(2);

    setTimeout(() => {
      setNhieReactions(prev => prev.filter(r => r.id !== id));
    }, 1500);
  };

  const handleNhieNext = () => {
    setNhieIndex((prev) => (prev + 1) % NEVER_HAVE_I_EVER_DECKS.length);
    playSound('pop');
    triggerVibration('light');
  };

  const isDark = theme === 'dark';

  return (
    <div id="group-zone-container" className={`absolute inset-0 flex flex-col pb-16 select-none overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* ========================================================================= */}
      {/* ROUTE 1: MAIN SELECTION MENU (STUNNING BENTO CARDS INSIDE GROUP ZONE TAB) */}
      {/* ========================================================================= */}
      {activeScreen === null && (
        <div className={`flex-1 flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-[#F8FAFC]'}`}>
          {/* Main Top Header */}
          <div className={`h-16 border-b flex items-center justify-between px-4 shrink-0 shadow-sm transition-colors duration-300 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className="flex items-center space-x-3 text-left">
              <button
                onClick={onBack}
                className={`w-10 h-10 flex items-center justify-center rounded-2xl active:scale-95 transition-all cursor-pointer ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className={`text-sm font-black tracking-tight flex items-center gap-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  <Users size={16} className="text-[#6C5CE7]" />
                  <span>Group Play Zone</span>
                </h2>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Party Games with Friends</p>
              </div>
            </div>

            {/* Simple audio controller */}
            <button
              onClick={() => {
                setIsAudioOn(!isAudioOn);
                BottleAudio.play('tick', !isAudioOn);
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-2xl active:scale-95 transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 text-slate-500 hover:text-slate-850'
              }`}
            >
              {isAudioOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>

          {/* Grid Layout Cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Visual Header Mascot Banner */}
            <div className="bg-gradient-to-r from-[#6C5CE7] to-[#8E2DE2] p-4 rounded-[28px] text-white shadow-sm flex items-center justify-between relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 opacity-10">
                <Users size={120} />
              </div>
              <div className="space-y-1 text-left relative z-10">
                <span className="bg-white/20 text-white text-[8px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                  Multiplayer Hub 👥
                </span>
                <h3 className="text-sm font-black mt-1">Perfect for Kids & Families</h3>
                <p className="text-[10px] text-indigo-50/80 leading-normal max-w-[210px]">
                  Gather around, sit in a circle, and choose a bento card game below to start playing instantly!
                </p>
              </div>
              <div className="text-3xl filter drop-shadow-md z-10 select-none">🎉</div>
            </div>

            <span className={`text-[10px] font-black uppercase tracking-widest block text-left pl-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Select Party Game
            </span>

            {/* Game bento grid cards */}
            <div className="space-y-3.5">
              
              {/* Card 1: Truth or Dare (Bottle Spin) */}
              <div
                onClick={() => {
                  setActiveScreen('truth-or-dare');
                  playSound('pop');
                  triggerVibration('light');
                }}
                className={`border rounded-[28px] p-4 flex items-center justify-between shadow-sm relative overflow-hidden hover:shadow-md active:scale-[0.99] transition-all cursor-pointer group ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}
              >
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
                
                <div className="flex items-center space-x-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                    🍾
                  </div>
                  <div>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isDark ? 'bg-amber-950/40 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                      Snappy Bottle Spinner
                    </span>
                    <h4 className={`text-sm font-black mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Truth or Dare</h4>
                    <p className={`text-[10px] mt-0.5 max-w-[190px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                      Snappy, sensory interactive spinning bottle. Pure animation and fun!
                    </p>
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>
                  👉
                </div>
              </div>

              {/* Card 2: Would You Rather */}
              <div
                onClick={() => {
                  setActiveScreen('would-you-rather');
                  playSound('pop');
                  triggerVibration('light');
                }}
                className={`border rounded-[28px] p-4 flex items-center justify-between shadow-sm relative overflow-hidden hover:shadow-md active:scale-[0.99] transition-all cursor-pointer group ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}
              >
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none" />

                <div className="flex items-center space-x-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                    🤔
                  </div>
                  <div>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isDark ? 'bg-teal-950/40 text-teal-400' : 'bg-teal-100 text-teal-700'}`}>
                      Mind Bending Choices
                    </span>
                    <h4 className={`text-sm font-black mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Would You Rather</h4>
                    <p className={`text-[10px] mt-0.5 max-w-[190px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                      Pick between hilarious dilemmas. Compete in choices with group statistics!
                    </p>
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>
                  👉
                </div>
              </div>

              {/* Card 3: Never Have I Ever */}
              <div
                onClick={() => {
                  setActiveScreen('never-have-i-ever');
                  playSound('pop');
                  triggerVibration('light');
                }}
                className={`border rounded-[28px] p-4 flex items-center justify-between shadow-sm relative overflow-hidden hover:shadow-md active:scale-[0.99] transition-all cursor-pointer group ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}
              >
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-rose-500/5 to-transparent pointer-events-none" />

                <div className="flex items-center space-x-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                    🙋‍♂️
                  </div>
                  <div>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isDark ? 'bg-rose-950/40 text-rose-400' : 'bg-rose-100 text-rose-700'}`}>
                      Hilarious Confessions
                    </span>
                    <h4 className={`text-sm font-black mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Never Have I Ever</h4>
                    <p className={`text-[10px] mt-0.5 max-w-[190px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                      Share crazy situations, declare innocence, and pop glowing reaction emojis!
                    </p>
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>
                  👉
                </div>
              </div>

            </div>
          </div>
        </div>
      )}


      {/* ========================================================================================= */}
      {/* ROUTE 2: TRUTH OR DARE GAME SCREEN (PRISTINE ANIMATIONS ONLY, NO PFPS, DRAWER, OR POPUPS) */}
      {/* ========================================================================================= */}
      {activeScreen === 'truth-or-dare' && (
        <div 
          onClick={handleBackdropClickToSpin}
          className={`absolute inset-0 flex flex-col overflow-hidden transition-all duration-300 ${activeTheme.bgClass} cursor-pointer`}
        >
          {/* FLOATING CONTROLS */}
          <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
            
            {/* Back Button */}
            <button
              onClick={() => {
                setActiveScreen(null);
                playSound('pop');
                triggerVibration('light');
              }}
              className="no-spin-tap pointer-events-auto w-10 h-10 rounded-2xl bg-black/30 hover:bg-black/40 text-white border border-white/10 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer active:scale-90"
              title="Return to Hub"
            >
              <ArrowLeft size={18} />
            </button>

            {/* Quick Title Indicator */}
            <div className="px-4 py-1.5 bg-black/30 border border-white/10 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest text-white/95 uppercase select-none flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tap screen to spin ⚡</span>
            </div>

            {/* Floating Palette / Theme Switcher */}
            <button
              onClick={() => {
                setShowThemePicker(!showThemePicker);
                playSound('pop');
                triggerVibration('tick');
              }}
              className="no-spin-tap pointer-events-auto w-10 h-10 rounded-2xl bg-black/30 hover:bg-black/40 text-white border border-white/10 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer active:scale-90"
              title="Change Theme Skin"
            >
              <Palette size={18} className={showThemePicker ? 'text-amber-400 rotate-12' : ''} />
            </button>
          </div>

          {/* COMPACT FLOATING SKIN SELECTOR */}
          <AnimatePresence>
            {showThemePicker && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="no-spin-tap absolute top-16 right-4 left-4 p-4 bg-black/95 backdrop-blur-xl border border-white/15 rounded-3xl z-50 text-white shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Choose Aesthetic Skin</span>
                  <button 
                    onClick={() => setShowThemePicker(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
                  >
                    <X size={14} className="stroke-[3]" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(SPIN_THEMES).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveThemeId(t.id);
                        setShowThemePicker(false);
                        playSound('pop');
                        triggerVibration('light');
                      }}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        activeThemeId === t.id
                          ? 'bg-white text-slate-900 border-white font-black'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold block truncate">{t.name}</span>
                      <div className="flex gap-1.5 mt-1 pointer-events-none">
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PURE ANIMATION STAGE CENTERPIECE */}
          <div className="flex-1 flex items-center justify-center relative min-h-[350px]">
            {/* Spinning Dial Container (Clean Minimal Design without Names, Avatars, or Slices) - MUCH BIGGER */}
            <div className={`relative w-[340px] h-[340px] xs:w-[370px] xs:h-[370px] sm:w-[460px] sm:h-[460px] flex items-center justify-center rounded-full transition-all duration-300 p-2 ${activeTheme.dialBgClass}`}>
              
              {/* Internal radar/glowing compass ring */}
              <div className={`absolute inset-2 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden ${activeTheme.ringBorderClass}`}>
                {/* Glowing Concentric Rings */}
                <div className="absolute w-[80%] h-[80%] rounded-full border border-white/5 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <div className="absolute w-[50%] h-[50%] rounded-full border border-white/5 pointer-events-none" />
                
                {/* Minimal dynamic neon compass lines to add deep sensory vibe */}
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/10 pointer-events-none" />
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/10 pointer-events-none" />
              </div>

              {/* ROTATABLE BOTTLE - MUCH BIGGER */}
              <div
                ref={bottleRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                className={`relative w-64 h-64 rounded-full flex items-center justify-center z-20 cursor-grab ${
                  isDragging.current ? 'cursor-grabbing' : ''
                }`}
              >
                <div 
                  className="relative transition-transform duration-75"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <svg viewBox="0 0 50 140" className="w-16 h-48 overflow-visible filter drop-shadow-2xl select-none pointer-events-none">
                    {/* Bottle Cap */}
                    <rect x="17" y="1" width="16" height="8" rx="2" fill={activeTheme.bottleCapColor} stroke="#1E293B" strokeWidth="2.5" />
                    {/* Bottle Neck */}
                    <rect x="19" y="9" width="12" height="7" fill="#E2E8F0" stroke="#1E293B" strokeWidth="2" />
                    {/* Bottle Glass Chassis */}
                    <path
                      d="M20 16 C20 28, 9 32, 9 42 L9 126 C9 132, 13 136, 25 136 C37 136, 41 132, 41 126 L41 42 C41 32, 30 28, 30 16 Z"
                      fill={activeTheme.bottleColor}
                      stroke={activeTheme.bottleBorder}
                      strokeWidth="3.5"
                      strokeLinejoin="round"
                    />
                    {/* Glass reflection */}
                    <path d="M12 42 C12 42, 15 55, 15 72" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                    {/* Glowing liquid content core circle */}
                    <circle cx="25" cy="74" r="5.5" fill={activeTheme.bottleCapColor} stroke="#FFFFFF" strokeWidth="2" />
                  </svg>
                </div>

                {/* Snappy Particle Burst on completion */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {particles.map((p) => (
                    <div
                      key={p.id}
                      className="absolute rounded-full"
                      style={{
                        left: `calc(50% + ${p.x}px)`,
                        top: `calc(50% + ${p.y}px)`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        boxShadow: `0 0 12px ${p.color}`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Glowing Indicator Arrow */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-red-500 filter drop-shadow-md" />
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ============================================================== */}
      {/* ROUTE 3: WOULD YOU RATHER GAME */}
      {/* ============================================================== */}
      {activeScreen === 'would-you-rather' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          <div className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-4 shrink-0">
            <button
              onClick={() => {
                setActiveScreen(null);
                playSound('pop');
                triggerVibration('light');
              }}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-600 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Would You Rather</h2>
            <div className="w-10 h-10" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between max-w-md mx-auto w-full">
            <div className="text-center space-y-1 my-2">
              <span className="bg-teal-100 text-teal-800 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Dilemma #{wyrIndex + 1}
              </span>
              <h3 className="text-sm font-black text-slate-800">Choose your preference!</h3>
            </div>

            <div className="space-y-4 my-auto">
              {/* Option A */}
              <button
                onClick={() => handleWyrVote('A')}
                className={`w-full p-6 rounded-[28px] text-left transition-all relative overflow-hidden border ${
                  wyrVoted === 'A'
                    ? 'bg-teal-500 text-white border-teal-600 shadow-lg'
                    : wyrVoted === 'B'
                    ? 'bg-white text-slate-400 border-slate-100 opacity-60'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-150 active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-wider uppercase opacity-60">OPTION A</span>
                  {wyrVoted && (
                    <span className="text-sm font-black">
                      {WOULD_YOU_RATHER_DECKS[wyrIndex].ratioA}% Voted
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold mt-2 pr-4 leading-normal">
                  {WOULD_YOU_RATHER_DECKS[wyrIndex].optionA}
                </p>
                {wyrVoted === 'A' && (
                  <div className="absolute right-4 bottom-4 w-6 h-6 rounded-full bg-white text-teal-500 flex items-center justify-center">
                    <Check size={12} className="stroke-[3]" />
                  </div>
                )}
              </button>

              {/* OR Divider */}
              <div className="flex items-center justify-center py-1">
                <span className="w-8 h-[1px] bg-slate-200" />
                <span className="mx-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">OR</span>
                <span className="w-8 h-[1px] bg-slate-200" />
              </div>

              {/* Option B */}
              <button
                onClick={() => handleWyrVote('B')}
                className={`w-full p-6 rounded-[28px] text-left transition-all relative overflow-hidden border ${
                  wyrVoted === 'B'
                    ? 'bg-rose-500 text-white border-rose-600 shadow-lg'
                    : wyrVoted === 'A'
                    ? 'bg-white text-slate-400 border-slate-100 opacity-60'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-150 active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-wider uppercase opacity-60">OPTION B</span>
                  {wyrVoted && (
                    <span className="text-sm font-black">
                      {100 - WOULD_YOU_RATHER_DECKS[wyrIndex].ratioA}% Voted
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold mt-2 pr-4 leading-normal">
                  {WOULD_YOU_RATHER_DECKS[wyrIndex].optionB}
                </p>
                {wyrVoted === 'B' && (
                  <div className="absolute right-4 bottom-4 w-6 h-6 rounded-full bg-white text-rose-500 flex items-center justify-center">
                    <Check size={12} className="stroke-[3]" />
                  </div>
                )}
              </button>
            </div>

            <div className="pt-4">
              {wyrVoted ? (
                <button
                  onClick={handleWyrNext}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-wider uppercase active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>NEXT QUESTION</span>
                  <span>👉</span>
                </button>
              ) : (
                <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest leading-none">
                  Choose option above to view statistics
                </p>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ============================================================== */}
      {/* ROUTE 4: NEVER HAVE I EVER GAME */}
      {/* ============================================================== */}
      {activeScreen === 'never-have-i-ever' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          <div className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-4 shrink-0">
            <button
              onClick={() => {
                setActiveScreen(null);
                playSound('pop');
                triggerVibration('light');
              }}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-600 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Never Have I Ever</h2>
            <div className="w-10 h-10" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between max-w-md mx-auto w-full relative">
            
            <div className="text-center space-y-1 my-2">
              <span className="bg-rose-100 text-rose-800 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Statement #{nhieIndex + 1}
              </span>
              <h3 className="text-sm font-black text-slate-800">Raise your hand if guilty!</h3>
            </div>

            {/* Statement Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-8 rounded-[36px] text-white shadow-xl relative overflow-hidden my-auto border-2 border-indigo-500/20 text-center min-h-[180px] flex flex-col items-center justify-center">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl">🤫</div>
              
              <h4 className="text-[11px] font-mono tracking-widest text-indigo-300 uppercase mb-3">
                Never Have I Ever...
              </h4>
              <p className="text-base font-black leading-relaxed tracking-wide font-sans">
                "{NEVER_HAVE_I_EVER_DECKS[nhieIndex]}"
              </p>
            </div>

            {/* Reaction Floating Emojis Stage */}
            <div className="relative h-16 w-full overflow-hidden flex justify-center pointer-events-none">
              <AnimatePresence>
                {nhieReactions.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 30, scale: 0.5, x: r.x }}
                    animate={{ opacity: 1, y: -40, scale: 1.5 }}
                    exit={{ opacity: 0, y: -90, scale: 0.5 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute text-3xl select-none"
                  >
                    {r.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleNhieVote('guilty')}
                  className="py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs tracking-wider uppercase active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>🙋‍♂️ I AM GUILTY</span>
                </button>
                <button
                  onClick={() => handleNhieVote('innocent')}
                  className="py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs tracking-wider uppercase active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>😇 I AM INNOCENT</span>
                </button>
              </div>

              <button
                onClick={handleNhieNext}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-wider uppercase active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>NEXT STATEMENT</span>
                <span>👉</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
