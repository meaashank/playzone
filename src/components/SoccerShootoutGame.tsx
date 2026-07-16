/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Zap,
  Volume2,
  VolumeX,
  Play,
  Award,
  CircleAlert
} from 'lucide-react';
import { triggerVibration } from '../utils/vibration';
import SoundEngine from '../utils/audio';

interface SoccerShootoutProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  soundEnabled?: boolean;
}

type ShotResult = 'idle' | 'shooting' | 'goal' | 'saved' | 'missed';

export const SoccerShootoutGame: React.FC<SoccerShootoutProps> = ({
  onBack,
  theme = 'dark',
  soundEnabled = true,
}) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [shotCount, setShotCount] = useState<number>(0);
  const [goalsScored, setGoalsScored] = useState<number>(0);
  const [savesMade, setSavesMade] = useState<number>(0);
  const [shotResult, setShotResult] = useState<ShotResult>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  // Shooter Aim positions
  const [aimX, setAimX] = useState<number>(50); // percentage 0 - 100 from left to right of goal
  const [aimY, setAimY] = useState<number>(30); // percentage 0 - 100 from top of crossbar to ground

  // Goalkeeper simulation
  const [gkX, setGkX] = useState<number>(50); // percentage 0 - 100
  const [isGkMovingRight, setIsGkMovingRight] = useState<boolean>(true);
  const [gkSpeed, setGkSpeed] = useState<number>(2.2); // oscillates faster as score increases

  // Ball animation state
  const [ballX, setBallX] = useState<number>(50); // current animated position %
  const [ballY, setBallY] = useState<number>(85); // % from top
  const [ballScale, setBallScale] = useState<number>(1); // scale down to 0.4 for 3D depth

  // Sound effects
  const playSound = (type: 'kick' | 'goal' | 'save' | 'miss' | 'whistle' | 'click') => {
    if (isMuted) return;
    try {
      if (type === 'kick') {
        SoundEngine.play('dice_land'); // punchy thud
      } else if (type === 'goal') {
        SoundEngine.play('win'); // celebration
      } else if (type === 'save') {
        SoundEngine.play('snake_crash'); // save crash
      } else if (type === 'miss') {
        SoundEngine.play('back'); // slide away whistle
      } else if (type === 'whistle') {
        SoundEngine.play('level_up');
      } else {
        SoundEngine.play('click');
      }
    } catch (e) {
      console.warn('Audio failure:', e);
    }
  };

  // GK horizontal oscillation
  useEffect(() => {
    if (gameState !== 'playing' || shotResult === 'shooting') return;

    const interval = setInterval(() => {
      setGkX(prev => {
        let next = prev + (isGkMovingRight ? gkSpeed : -gkSpeed);
        if (next >= 82) {
          next = 82;
          setIsGkMovingRight(false);
        } else if (next <= 18) {
          next = 18;
          setIsGkMovingRight(true);
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [gameState, isGkMovingRight, gkSpeed, shotResult]);

  const handleStartGame = () => {
    playSound('whistle');
    setGameState('playing');
    setShotCount(0);
    setGoalsScored(0);
    setSavesMade(0);
    setShotResult('idle');
    setFeedbackMsg('🎯 Take aim and kick!');
    setBallX(50);
    setBallY(85);
    setBallScale(1);
    setGkSpeed(2.2);
  };

  const handleKick = () => {
    if (shotResult === 'shooting') return;

    setShotResult('shooting');
    setShotCount(s => s + 1);
    playSound('kick');
    triggerVibration('medium');

    // Goalkeeper AI prediction path
    // GK will leap towards a random side of the net, slightly biased towards player's aim
    const gkLeapTarget = gkX + (Math.random() - 0.5) * 20;
    const finalGkX = Math.max(20, Math.min(80, gkLeapTarget));

    // Animate the goalkeeper jumping towards final position
    let frames = 0;
    const totalFrames = 20;
    const initialGk = gkX;

    const animationInterval = setInterval(() => {
      frames++;
      const ratio = frames / totalFrames;
      
      // Interpolate goalkeeper leap
      setGkX(initialGk + (finalGkX - initialGk) * ratio);

      // Interpolate ball 3D travel
      setBallX(50 + (aimX - 50) * ratio);
      setBallY(85 - (85 - aimY) * ratio);
      setBallScale(1 - 0.55 * ratio); // scale down to 0.45 for depth

      if (frames >= totalFrames) {
        clearInterval(animationInterval);
        evaluateShot(finalGkX);
      }
    }, 25);
  };

  const evaluateShot = (finalGk: number) => {
    // Left post is at ~22%, Right post is at ~78%
    // Crossbar is at ~18%, Ground is at ~68%
    const isInsidePosts = aimX >= 23 && aimX <= 77;
    const isBelowCrossbar = aimY >= 18 && aimY <= 65;

    if (!isInsidePosts || !isBelowCrossbar) {
      // Missed completely
      setShotResult('missed');
      setFeedbackMsg('❌ OUT OF BOUNDS! Missed target.');
      playSound('miss');
      triggerVibration('heavy');
    } else {
      // Check overlap between ball final position and Goalkeeper hands/reach
      // Reach range is roughly ±12% around GK center
      const goalieReach = 11;
      const isSaved = Math.abs(aimX - finalGk) <= goalieReach && Math.abs(aimY - 35) <= 22;

      if (isSaved) {
        setShotResult('saved');
        setFeedbackMsg('🧤 OUTSTANDING SAVE by the goalie!');
        setSavesMade(s => s + 1);
        playSound('save');
        triggerVibration('medium');
      } else {
        setShotResult('goal');
        setFeedbackMsg('⚽ GOOOAAAL!!! Brilliant strike!');
        setGoalsScored(g => g + 1);
        playSound('goal');
        triggerVibration('light');
        // Increase GK speed for next challenge
        setGkSpeed(prev => prev + 0.35);
      }
    }

    // Reset ball back after a brief replay delay
    setTimeout(() => {
      if (shotCount >= 4) {
        // Tournament over (5 shots completed)
        setGameState('gameover');
        playSound('whistle');
      } else {
        setShotResult('idle');
        setFeedbackMsg('🎯 Take your next shot!');
        setBallX(50);
        setBallY(85);
        setBallScale(1);
      }
    }, 2200);
  };

  const selectGoalTarget = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shotResult === 'shooting') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain to net bounds
    setAimX(Math.max(10, Math.min(90, x)));
    setAimY(Math.max(10, Math.min(70, y)));
    triggerVibration('tick');
  };

  return (
    <div className={`flex flex-col h-full w-full select-none ${theme === 'dark' ? 'bg-[#0B0F19] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Header */}
      <header className={`p-4 flex items-center justify-between border-b ${theme === 'dark' ? 'bg-[#0F172A]/80 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button
          onClick={() => {
            playSound('click');
            onBack();
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
          }`}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-bold font-sans flex items-center gap-1.5 uppercase tracking-widest text-emerald-500">
            ⚽ Soccer Shootout
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">3D Depth Goal Simulator</span>
        </div>

        <button
          onClick={() => {
            setIsMuted(!isMuted);
            playSound('click');
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
          }`}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          
          {/* Menu */}
          {gameState === 'menu' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md text-center flex flex-col gap-6"
            >
              <div className="p-8 rounded-3xl border shadow-xl bg-gradient-to-b from-indigo-950/40 to-slate-900/40 border-indigo-500/10">
                <div className="w-20 h-20 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                  ⚽
                </div>
                <h2 className="text-xl font-bold tracking-tight">Soccer Penalty Shootout</h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Step up to the penalty spot! Tap anywhere inside the goal post to choose your placement, kick past the jumping keeper, and complete the 5-shot tournament challenge.
                </p>

                <div className="flex flex-col gap-3 mt-8">
                  <button
                    onClick={handleStartGame}
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    <Play size={16} className="fill-current" /> Start Tournament (5 Kicks)
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Playing Field */}
          {gameState === 'playing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-lg flex flex-col gap-3"
            >
              {/* Scoreboard */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/45">
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">TOURNAMENT</span>
                  <div className="text-sm font-bold font-mono">SHOT {shotCount + 1} <span className="text-slate-500">/ 5</span></div>
                </div>

                <div className="flex items-center gap-3 bg-slate-800/40 px-3.5 py-1.5 rounded-xl border border-slate-700/20">
                  <div className="text-center">
                    <div className="text-[8px] text-slate-500 font-bold uppercase">GOALS</div>
                    <div className="text-md font-bold text-emerald-400 font-mono">{goalsScored}</div>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-700" />
                  <div className="text-center">
                    <div className="text-[8px] text-slate-500 font-bold uppercase">SAVES</div>
                    <div className="text-md font-bold text-amber-500 font-mono">{savesMade}</div>
                  </div>
                </div>
              </div>

              {/* 3D Grass field and goal arena */}
              <div className="relative aspect-[4/3] w-full rounded-2xl border border-emerald-500/15 bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#14532D] overflow-hidden shadow-inner select-none">
                
                {/* 1. Perspective Grass Lines */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
                
                {/* 2. Goal Net Visual */}
                <div
                  onClick={selectGoalTarget}
                  className="absolute top-[15%] left-[10%] right-[10%] bottom-[35%] bg-slate-950/40 border-4 border-slate-200 rounded-lg flex items-center justify-center cursor-crosshair overflow-hidden relative"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1.5px, transparent 1.5px)',
                    backgroundSize: '10px 10px',
                  }}
                >
                  {/* Red/Yellow striped target pointer */}
                  {shotResult !== 'shooting' && (
                    <motion.div
                      className="absolute w-7 h-7 rounded-full border-2 border-dashed border-red-500 flex items-center justify-center animate-spin pointer-events-none"
                      style={{ left: `${aimX}%`, top: `${aimY}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </motion.div>
                  )}

                  {/* Crossbar & Net lines */}
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-white/40" />
                  <div className="absolute left-0 inset-y-0 w-[2px] bg-white/40" />
                  <div className="absolute right-0 inset-y-0 w-[2px] bg-white/40" />
                </div>

                {/* 3. Goalkeeper Avatar */}
                <div
                  className="absolute bottom-[35%] w-14 h-16 pointer-events-none transition-all flex flex-col items-center justify-center"
                  style={{
                    left: `${gkX}%`,
                    transform: 'translate(-50%, 0)',
                  }}
                >
                  {/* Keepers hands */}
                  <div className="flex gap-10 justify-between w-full relative">
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-slate-950 animate-bounce" />
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-slate-950 animate-bounce" />
                  </div>

                  {/* GK Jersey body */}
                  <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-indigo-400 flex items-center justify-center relative shadow-lg">
                    <span className="text-[11px] font-extrabold text-white">GK</span>
                  </div>
                  
                  {/* Goalie shadow */}
                  <div className="w-8 h-2 bg-black/45 rounded-full blur-[1px] mt-0.5" />
                </div>

                {/* 4. Penalty Spot Marker */}
                <div className="absolute bottom-[18%] left-[50%] -translate-x-1/2 w-4 h-1.5 bg-white/30 rounded-full pointer-events-none" />

                {/* 5. Shooting Football Ball */}
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${ballX}%`,
                    top: `${ballY}%`,
                    transform: `translate(-50%, -50%) scale(${ballScale})`,
                  }}
                >
                  {/* Realistic Soccer ball texture */}
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-950 flex items-center justify-center relative shadow-lg overflow-hidden animate-spin">
                    {/* Concentric soccer pentagon prints */}
                    <div className="absolute inset-2 border-2 border-dashed border-slate-950 rounded-full" />
                    <div className="w-4 h-4 bg-slate-950 transform rotate-45" />
                  </div>
                  {/* Ball ground shadow */}
                  <div className="w-10 h-2 bg-black/35 rounded-full blur-[2px] mt-1 mx-auto" />
                </motion.div>

                {/* feedback popup msg */}
                <div className="absolute bottom-4 inset-x-0 text-center pointer-events-none">
                  <span className="bg-slate-900/95 text-white border border-slate-800 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wide shadow-md">
                    {feedbackMsg}
                  </span>
                </div>
              </div>

              {/* Aiming help instructions */}
              <div className="flex flex-col gap-3 p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/40 mt-1">
                <div className="text-center text-[10px] text-slate-400">
                  💡 <span className="text-slate-200 font-bold">How to Shoot:</span> Click inside the white goal posts above to move the red aim target, then tap the kick button!
                </div>

                <button
                  onClick={handleKick}
                  disabled={shotResult === 'shooting'}
                  className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl flex items-center justify-center gap-2 font-bold tracking-widest text-xs uppercase shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  KICK THE BALL ⚽⚡
                </button>
              </div>
            </motion.div>
          )}

          {/* Game Over Screen */}
          {gameState === 'gameover' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md text-center flex flex-col gap-6"
            >
              <div className="p-8 rounded-3xl border shadow-xl bg-gradient-to-b from-indigo-950/40 to-slate-900/40 border-indigo-500/10">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={32} />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Shootout Complete!</h2>
                
                <div className="text-2xl font-bold text-emerald-400 mt-4 uppercase font-sans tracking-wide">
                  🎉 Score: {goalsScored} / 5 Goals!
                </div>

                <div className="flex items-center justify-center gap-6 mt-6 p-4 rounded-2xl bg-slate-900/50">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Tournament Rank</span>
                    <span className="text-lg font-sans font-extrabold text-[#F1C40F] mt-1">
                      {goalsScored === 5 ? '⭐ GOLDEN STRIKER' : goalsScored >= 3 ? '🥈 PRO LEGEND' : '🥉 ROOKIE STAR'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-8">
                  <button
                    onClick={handleStartGame}
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    <RotateCcw size={16} /> Shoot Again
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setGameState('menu');
                    }}
                    className="w-full h-12 bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/15 text-[#6C5CE7] rounded-2xl flex items-center justify-center gap-2 font-bold border border-[#6C5CE7]/30 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    Main Menu
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};
