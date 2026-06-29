/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Compass,
  Navigation
} from 'lucide-react';

// Real-time sound generator using the Web Audio API
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

  static play(type: 'tick' | 'swipe' | 'land', enabled: boolean) {
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
          osc.frequency.setValueAtTime(450, now);
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
          osc.frequency.setValueAtTime(100, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
          
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
          
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case 'land': {
          // Play a beautiful, pristine high-fidelity glass chime chord (C5, E5, G5, C6)
          const frequencies = [523.25, 659.25, 783.99, 1046.50];
          frequencies.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);
            
            gain.gain.setValueAtTime(0.05, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            
            osc.start(now + idx * 0.04);
            osc.stop(now + 0.6);
          });
          break;
        }
      }
    } catch (e) {
      console.warn('Audio Context failed to play:', e);
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

export const GroupPlay: React.FC<GroupPlayProps> = ({
  onBack,
  theme = 'light',
  soundEnabled = true,
  onAddCoins,
}) => {
  const isDark = theme === 'dark';
  
  // Audio state
  const [isAudioOn, setIsAudioOn] = useState(soundEnabled);

  // Spinner states
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [stopDirection, setStopDirection] = useState<string | null>(null);
  const [stopAngle, setStopAngle] = useState<number | null>(null);

  // Confetti particles state
  const [particles, setParticles] = useState<Particle[]>([]);

  // Physics animation ref
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  // Interactive Dragging / Flicking refs
  const bottleRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startAngle = useRef(0);
  const lastAngle = useRef(0);
  const dragVelocity = useRef(0);
  const lastDragTime = useRef(0);

  // Track ticking interval
  const lastTickAngle = useRef(0);

  // Clean animation frame on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Play sound helper
  const playSound = (type: 'tick' | 'swipe' | 'land') => {
    BottleAudio.play(type, isAudioOn);
  };

  // Convert an angle (in degrees) to a readable compass direction
  const getDirectionText = (deg: number): string => {
    // Compass zero is usually North (pointing up), which matches 270 degrees in math coordinates
    // Let's align the math coordinates so that:
    // pointing UP (270°) is NORTH, pointing RIGHT (0°) is EAST, pointing DOWN (90°) is SOUTH, pointing LEFT (180°) is WEST.
    const normalized = ((deg % 360) + 360) % 360;
    
    // Divide into 8 sectors
    if (normalized >= 337.5 || normalized < 22.5) return 'East (0°)';
    if (normalized >= 22.5 && normalized < 67.5) return 'South-East (45°)';
    if (normalized >= 67.5 && normalized < 112.5) return 'South (90°)';
    if (normalized >= 112.5 && normalized < 157.5) return 'South-West (135°)';
    if (normalized >= 157.5 && normalized < 202.5) return 'West (180°)';
    if (normalized >= 202.5 && normalized < 247.5) return 'North-West (225°)';
    if (normalized >= 247.5 && normalized < 292.5) return 'North (270°)';
    return 'North-East (315°)';
  };

  // Create physical burst particles on stop
  const triggerConfetti = (angle: number) => {
    // Position of the tip of the bottle
    // The bottle is vertical in design, with the tip pointing UP.
    // So the tip is rotated by the final angle.
    const rad = (angle * Math.PI) / 180;
    const distance = 110; // offset from center to tip
    const x = Math.sin(rad) * distance;
    const y = -Math.cos(rad) * distance;

    const colors = ['#FF7675', '#74B9FF', '#55EFC4', '#FFEAA7', '#A29BFE', '#FD79A8'];
    const newParticles: Particle[] = Array.from({ length: 28 }).map((_, i) => {
      const pAngle = rad + (Math.random() - 0.5) * 1.2; // scatter near tip direction
      const speed = 2 + Math.random() * 5;
      return {
        id: `${Date.now()}-${i}`,
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: pAngle,
        speed,
        size: 4 + Math.random() * 6,
      };
    });

    setParticles(newParticles);

    // Fade/Gravity update for particles
    let frames = 0;
    const updateInterval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + Math.cos(p.angle) * p.speed,
            y: p.y + Math.sin(p.angle) * p.speed + 0.15, // apply gravity
            speed: p.speed * 0.95, // air resistance
            size: Math.max(0, p.size - 0.15),
          }))
          .filter((p) => p.size > 0.5)
      );

      frames++;
      if (frames > 40) {
        clearInterval(updateInterval);
        setParticles([]);
      }
    }, 20);
  };

  // -----------------------------------------------------------------
  // THE PHYSICAL SPINNING PHYSICS ANIMATION LOOP
  // -----------------------------------------------------------------
  const startFrictionPhysics = (initialVelocity: number) => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    setIsSpinning(true);
    setStopDirection(null);
    setStopAngle(null);

    let currentVel = initialVelocity;
    let currentRot = rotation;
    lastTickAngle.current = currentRot;

    const friction = 0.982; // Satisfying deceleration rate
    const minVelocity = 0.08;

    const animate = () => {
      currentVel *= friction;
      currentRot += currentVel;

      // Trigger satisfying tick sound based on angular distance crossed
      const tickSpacing = 15; // ticks every 15 degrees
      if (Math.abs(currentRot - lastTickAngle.current) >= tickSpacing) {
        playSound('tick');
        lastTickAngle.current = currentRot;
      }

      setRotation(currentRot);

      if (Math.abs(currentVel) > minVelocity) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        // Complete the spin and celebrate
        setIsSpinning(false);
        const finalAngle = ((currentRot % 360) + 360) % 360;
        setStopAngle(Math.round(finalAngle));
        setStopDirection(getDirectionText(finalAngle));
        playSound('land');
        triggerConfetti(finalAngle);

        if (onAddCoins) {
          onAddCoins(5); // Add minor fun credits for spinning
        }
      }
    };

    requestRef.current = requestAnimationFrame(animate);
  };

  // Tap action trigger (easy-spin)
  const handleTapSpin = () => {
    if (isSpinning) return;
    playSound('swipe');
    // Random high initial speed to guarantee multiple satisfying rotations
    const direction = Math.random() > 0.5 ? 1 : -1;
    const initialVelocity = (24 + Math.random() * 16) * direction;
    startFrictionPhysics(initialVelocity);
  };

  // -----------------------------------------------------------------
  // DIRECT FLICK / DRAG CALCULATIONS
  // -----------------------------------------------------------------
  const getPointerCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!bottleRef.current) return { x: 0, y: 0 };
    const rect = bottleRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        return null;
      }
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

    // Stop any existing animation
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

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
    
    // Calculate sliding velocity
    const currentTime = performance.now();
    const dt = currentTime - lastDragTime.current;
    
    if (dt > 0) {
      let deltaAngle = angleDeg - lastAngle.current;
      // Handle degree overflow jump e.g. -180 to 180
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      dragVelocity.current = deltaAngle / (dt / 16.67); // normalized to frames (60fps)
    }

    setRotation(newRotation);
    
    // Settle ticking sounds during manual dragging too
    const tickDistance = Math.abs(newRotation - lastTickAngle.current);
    if (tickDistance >= 20) {
      playSound('tick');
      lastTickAngle.current = newRotation;
    }

    lastAngle.current = angleDeg;
    lastDragTime.current = currentTime;
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    // If drag velocity is notable, apply physics with that initial velocity
    if (Math.abs(dragVelocity.current) > 1.5) {
      playSound('swipe');
      // Limit speed so it doesn't spin infinitely fast
      const clampedVelocity = Math.max(-45, Math.min(45, dragVelocity.current * 1.2));
      startFrictionPhysics(clampedVelocity);
    } else {
      // Just left static where dragged
      const finalAngle = ((rotation % 360) + 360) % 360;
      setStopAngle(Math.round(finalAngle));
      setStopDirection(getDirectionText(finalAngle));
    }
  };

  return (
    <div className={`absolute inset-0 flex flex-col ${isDark ? 'bg-[#0B132B] text-slate-100' : 'bg-slate-50 text-slate-800'} pb-12 select-none overflow-hidden`}>
      
      {/* 1. STICKY HEADER */}
      <div className={`sticky top-0 h-14 border-b flex items-center justify-between px-4 z-40 shrink-0 ${isDark ? 'bg-[#1C2541]/90 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center space-x-3 text-left">
          <button
            onClick={onBack}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 text-slate-300 active:bg-slate-700' : 'bg-slate-100 text-slate-600 active:bg-slate-200'
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-sm font-black tracking-tight flex items-center gap-1.5">
              <Compass size={15} className="text-[#6C5CE7]" />
              <span>Bottle Spinner</span>
            </h2>
            <p className="text-[9px] text-slate-400 font-medium">Minimal, clean, satisfying physics</p>
          </div>
        </div>

        {/* Audio controls toggle */}
        <button
          onClick={() => {
            setIsAudioOn(!isAudioOn);
            BottleAudio.play('tick', !isAudioOn);
          }}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
            isDark 
              ? 'bg-slate-800 text-slate-300 active:bg-slate-700 hover:bg-slate-750' 
              : 'bg-slate-100 text-slate-600 active:bg-slate-200 hover:bg-slate-150'
          }`}
          title={isAudioOn ? 'Mute Sounds' : 'Unmute Sounds'}
        >
          {isAudioOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* 2. MAIN WHEEL AREA */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 relative">
        
        {/* Abstract beautiful subtle layout grid lines for a gorgeous technical blueprint feel */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-400 dark:border-slate-800" />
          <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-slate-400 dark:border-slate-800" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-slate-300 dark:border-slate-800" />
        </div>

        {/* Outer Wheel dial shadow frame with dynamic theme integration */}
        <div className={`relative w-full aspect-square max-w-[310px] sm:max-w-[340px] mx-auto flex items-center justify-center rounded-full transition-all duration-500 p-2 ${
          isDark 
            ? 'bg-slate-950/30 border border-slate-800/40 shadow-[0_0_50px_rgba(108,92,231,0.12)]' 
            : 'bg-slate-200/20 border border-slate-200/30 shadow-[0_0_40px_rgba(108,92,231,0.03)]'
        }`}>
          
          {/* RADIANT INNER COMPASS RING with dynamic theme integration */}
          <div className={`absolute inset-2 rounded-full border-[3px] shadow-xl transition-all duration-500 flex items-center justify-center ${
            isDark 
              ? 'bg-gradient-to-br from-[#121A31] via-[#0E1528] to-[#0A0E1A] border-slate-800 shadow-slate-950/90' 
              : 'bg-gradient-to-br from-white via-[#FCFDFF] to-[#F1F5F9] border-slate-100 shadow-indigo-100/30'
          }`}>
            
            {/* Minimal neon compass directions labeled at 45deg boundaries */}
            {[
              { label: 'N', deg: 270, style: isDark ? 'top-3.5 left-1/2 -translate-x-1/2 text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]' : 'top-3.5 left-1/2 -translate-x-1/2 text-red-500' },
              { label: 'NE', deg: 315, style: isDark ? 'top-11 right-11 text-slate-400/80 font-bold' : 'top-11 right-11 text-slate-400 font-bold' },
              { label: 'E', deg: 0, style: isDark ? 'right-3.5 top-1/2 -translate-y-1/2 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]' : 'right-3.5 top-1/2 -translate-y-1/2 text-cyan-500' },
              { label: 'SE', deg: 45, style: isDark ? 'bottom-11 right-11 text-slate-400/80 font-bold' : 'bottom-11 right-11 text-slate-400 font-bold' },
              { label: 'S', deg: 90, style: isDark ? 'bottom-3.5 left-1/2 -translate-x-1/2 text-purple-400 drop-shadow-[0_0_6px_rgba(192,132,252,0.5)]' : 'bottom-3.5 left-1/2 -translate-x-1/2 text-purple-500' },
              { label: 'SW', deg: 135, style: isDark ? 'bottom-11 left-11 text-slate-400/80 font-bold' : 'bottom-11 left-11 text-slate-400 font-bold' },
              { label: 'W', deg: 180, style: isDark ? 'left-3.5 top-1/2 -translate-y-1/2 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]' : 'left-3.5 top-1/2 -translate-y-1/2 text-amber-500' },
              { label: 'NW', deg: 225, style: isDark ? 'top-11 left-11 text-slate-400/80 font-bold' : 'top-11 left-11 text-slate-400 font-bold' }
            ].map((dir) => (
              <span
                key={dir.label}
                className={`absolute text-[10px] font-black tracking-widest font-mono select-none pointer-events-none ${dir.style}`}
              >
                {dir.label}
              </span>
            ))}

            {/* Glowing radial ticks at 15deg segments */}
            {Array.from({ length: 24 }).map((_, i) => {
              const rotationDeg = i * 15;
              const isCardinal = rotationDeg % 90 === 0;
              return (
                <div
                  key={i}
                  className="absolute inset-0 pointer-events-none"
                  style={{ transform: `rotate(${rotationDeg}deg)` }}
                >
                  <div className={`absolute left-1/2 -translate-x-1/2 top-0 rounded-full ${
                    isCardinal 
                      ? isDark 
                        ? 'w-1 h-3.5 bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' 
                        : 'w-1 h-3.5 bg-indigo-500 opacity-60'
                      : isDark
                        ? 'w-0.5 h-1.5 bg-slate-700 opacity-50'
                        : 'w-0.5 h-1.5 bg-slate-300 opacity-40'
                  }`} />
                </div>
              );
            })}
          </div>

          {/* THE DRAGGABLE BOTTLE COMPONENT */}
          <div
            ref={bottleRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className={`relative w-48 h-48 rounded-full flex items-center justify-center z-20 cursor-grab ${
              isDragging.current ? 'cursor-grabbing' : ''
            }`}
          >
            {/* Real shadow casting layer that trails/rotates with the bottle */}
            <div
              className="absolute pointer-events-none transition-transform duration-75"
              style={{
                transform: `rotate(${rotation}deg) translateY(4px)`,
                filter: 'blur(6px)',
                opacity: isDark ? 0.45 : 0.25
              }}
            >
              <svg viewBox="0 0 50 140" className="w-10 h-32 fill-black">
                <rect x="15" y="0" width="20" height="135" rx="10" />
              </svg>
            </div>

            {/* Vector Glass Bottle design details */}
            <div
              className="relative transition-transform duration-75"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <svg
                viewBox="0 0 50 140"
                className="w-12 h-36 overflow-visible filter drop-shadow-md select-none pointer-events-none"
              >
                {/* Cap and neck collar */}
                <rect x="17" y="2" width="16" height="8" rx="2" fill="#FF7675" stroke="#1E293B" strokeWidth="2.5" />
                <rect x="19" y="10" width="12" height="6" fill="#D1D5DB" stroke="#1E293B" strokeWidth="2" />

                {/* Glass bottle body */}
                <path
                  d="M20 16 
                     C20 28, 10 32, 10 42 
                     L10 126 
                     C10 132, 14 136, 25 136 
                     C36 136, 40 132, 40 126 
                     L40 42 
                     C40 32, 30 28, 30 16 
                     Z"
                  fill={isDark ? 'rgba(129, 236, 236, 0.15)' : 'rgba(108, 92, 231, 0.08)'}
                  stroke={isDark ? '#81ECEC' : '#6C5CE7'}
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />

                {/* Sparkling fluid level indicators */}
                <path
                  d="M12 70 Q25 74 38 70 L38 124 C38 128, 36 132, 25 132 C14 132, 12 128, 12 124 Z"
                  fill={isDark ? 'rgba(129, 236, 236, 0.25)' : 'rgba(108, 92, 231, 0.12)'}
                />

                {/* Dynamic Gloss / Glare accents for ultra-premium finish */}
                <path
                  d="M14 42 C14 42, 17 55, 17 72"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity={isDark ? 0.35 : 0.7}
                />
                <line
                  x1="36"
                  y1="46"
                  x2="36"
                  y2="122"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity={isDark ? 0.2 : 0.4}
                />

                {/* Center Pivot Pin point indicator */}
                <circle cx="25" cy="70" r="4.5" fill="#1E293B" stroke="#FFFFFF" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Custom Confetti Spark Render Overlay */}
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
                    boxShadow: `0 0 8px ${p.color}`,
                    transform: 'translate(-50%, -50%)',
                    transition: 'opacity 0.2s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Glowing Red Arrow indicator at top pointing down */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
            <Navigation className="text-red-500 fill-red-500 rotate-180 drop-shadow-sm" size={18} />
          </div>
        </div>

        {/* DISPLAY DIRECTION RESULTS */}
        <div className="h-20 mt-6 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {stopDirection ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-1"
              >
                <span className="text-[10px] font-black tracking-widest text-[#6C5CE7] dark:text-[#81ECEC] uppercase flex items-center justify-center gap-1">
                  <Sparkles size={11} className="animate-pulse" />
                  <span>POINTING AT</span>
                </span>
                <h3 className="text-lg font-black tracking-tight">{stopDirection}</h3>
              </motion.div>
            ) : isSpinning ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center space-y-1.5"
              >
                <div className="flex space-x-1 justify-center items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  Spinning Bottle...
                </span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[200px]"
              >
                Flick/swipe the bottle directly, or tap the button below to start spinning!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. FOOTER CONTROL ACTIONS */}
      <div className="px-6 pb-6 shrink-0">
        <button
          onClick={handleTapSpin}
          disabled={isSpinning}
          className={`w-full py-4 rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 ${
            isSpinning
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800'
              : 'bg-[#6C5CE7] hover:bg-[#5b4cc4] text-white shadow-indigo-100 dark:shadow-none'
          }`}
        >
          <RotateCw size={13} className={isSpinning ? 'animate-spin' : ''} />
          <span>{isSpinning ? 'SPINNING BOTTLE...' : 'TAP TO SPIN BOTTLE'}</span>
        </button>
      </div>
    </div>
  );
};
