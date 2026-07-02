/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';

export interface DoodleAvatarData {
  id: string;
  name: string;
  category: string;
  bgColor: string; // Tailwind hex color or color class
  pastelAccent: string; // Accent color for highlights
  svg: React.ComponentType<{ className?: string }>;
}

// 1. DEFINING THE 24 HAND-DRAWN DOODLE AVATARS (SVG PATH ILLUSTRATIONS)

export const SmilingBoyAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Soft Pastel Accent Circle */}
    <circle cx="50" cy="50" r="46" fill="#FFEAA7" opacity="0.35" />
    
    {/* Head Outline */}
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
    
    {/* Hair (Slick Sweep) */}
    <path d="M26 44 C34 30, 66 30, 74 44 C65 38, 55 38, 48 42 C42 45, 32 45, 26 44 Z" fill="#2D3436" stroke="#2D3436" strokeWidth="2" strokeLinejoin="round" />
    
    {/* Eyes */}
    <circle cx="41" cy="52" r="3" fill="#2D3436" />
    <circle cx="59" cy="52" r="3" fill="#2D3436" />
    
    {/* Smile */}
    <path d="M43 64 Q50 71 57 64" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
    
    {/* Blushing cheeks */}
    <circle cx="36" cy="58" r="2.5" fill="#FF7675" opacity="0.4" />
    <circle cx="64" cy="58" r="2.5" fill="#FF7675" opacity="0.4" />
  </svg>
);

export const SmilingGirlAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#FAB1A0" opacity="0.35" />
    <circle cx="50" cy="55" r="25" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Hair (Bob haircut with bangs) */}
    <path d="M22 55 C22 35, 78 35, 78 55 C74 46, 68 40, 50 42 C32 40, 26 46, 22 55 Z" fill="#74B9FF" stroke="#2D3436" strokeWidth="2" />
    <path d="M22 55 L25 64" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
    <path d="M78 55 L75 64" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
    {/* Eyes */}
    <circle cx="42" cy="53" r="3" fill="#2D3436" />
    <circle cx="58" cy="53" r="3" fill="#2D3436" />
    {/* Smile */}
    <path d="M44 64 Q50 69 56 64" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
    {/* Cheeks */}
    <circle cx="37" cy="59" r="3.5" fill="#FF7675" opacity="0.5" />
    <circle cx="63" cy="59" r="3.5" fill="#FF7675" opacity="0.5" />
  </svg>
);

export const SleepyFaceAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#74B9FF" opacity="0.3" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Hair */}
    <path d="M25 48 Q50 32 75 48" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
    {/* Closed Sleepy Eyes */}
    <path d="M37 52 Q41 56 45 52" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M55 52 Q59 56 63 52" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Tiny Snoozing Mouth */}
    <circle cx="50" cy="65" r="2.5" fill="#2D3436" />
    {/* Sleep "zZz" Bubble bubble */}
    <text x="70" y="32" fill="#6C5CE7" fontSize="11" fontWeight="bold" fontFamily="monospace" transform="rotate(10 70 32)">zZz</text>
  </svg>
);

export const ExcitedFaceAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#55EFC4" opacity="0.35" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Hair spikes on top */}
    <path d="M42 30 L46 20 L50 28 L54 18 L58 30" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="#FFFFFF" />
    {/* Sparkle Star Eyes */}
    <path d="M37 50 L41 46 L45 50 L41 54 Z" fill="#6C5CE7" stroke="#6C5CE7" strokeWidth="1" />
    <path d="M55 50 L59 46 L63 50 L59 54 Z" fill="#6C5CE7" stroke="#6C5CE7" strokeWidth="1" />
    {/* Big happy mouth */}
    <path d="M40 60 Q50 72 60 60 Z" fill="#FF7675" stroke="#2D3436" strokeWidth="3" strokeLinejoin="round" />
  </svg>
);

export const NerdGlassesAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#81ECEC" opacity="0.35" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Glasses */}
    <rect x="29" y="44" width="18" height="14" rx="4" fill="none" stroke="#2D3436" strokeWidth="3" />
    <rect x="53" y="44" width="18" height="14" rx="4" fill="none" stroke="#2D3436" strokeWidth="3" />
    <line x1="47" y1="51" x2="53" y2="51" stroke="#2D3436" strokeWidth="3" />
    {/* Eyes inside glasses */}
    <circle cx="38" cy="51" r="2.5" fill="#2D3436" />
    <circle cx="62" cy="51" r="2.5" fill="#2D3436" />
    {/* Smile with tiny teeth */}
    <path d="M45 66 Q50 70 55 66" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="48" y="66" width="4" height="2" fill="white" stroke="#2D3436" strokeWidth="1.5" />
  </svg>
);

export const HoodieAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#A29BFE" opacity="0.35" />
    {/* Outer Hoodie Frame */}
    <circle cx="50" cy="54" r="28" fill="#6C5CE7" stroke="#2D3436" strokeWidth="3" />
    {/* Inner Face cutout */}
    <circle cx="50" cy="54" r="21" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Drawstrings */}
    <line x1="44" y1="74" x2="41" y2="84" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
    <line x1="56" y1="74" x2="59" y2="84" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
    <circle cx="41" cy="84" r="2.5" fill="#6C5CE7" stroke="#2D3436" strokeWidth="1.5" />
    <circle cx="59" cy="84" r="2.5" fill="#6C5CE7" stroke="#2D3436" strokeWidth="1.5" />
    {/* Face */}
    <circle cx="42" cy="52" r="2.5" fill="#2D3436" />
    <circle cx="58" cy="52" r="2.5" fill="#2D3436" />
    <path d="M44 62 Q50 67 56 62" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const MessyHairAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#FCE4EC" opacity="0.5" />
    <circle cx="50" cy="55" r="25" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Jagged Messy Hair */}
    <path d="M22 45 C20 30, 30 18, 45 22 C50 14, 65 16, 70 24 C78 28, 80 40, 76 48 C72 45, 68 46, 65 44 C60 41, 52 45, 48 42 C40 40, 30 46, 22 45 Z" fill="#E84393" stroke="#2D3436" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Eyes */}
    <circle cx="42" cy="54" r="2.5" fill="#2D3436" />
    <circle cx="58" cy="54" r="2.5" fill="#2D3436" />
    {/* Smile */}
    <path d="M43 63 Q50 68 57 63" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const CurlyHairAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#E8F5E9" opacity="0.5" />
    {/* Big curly hair outline in background */}
    <path d="M22 55 C12 50, 15 30, 28 25 C32 15, 48 12, 58 18 C68 12, 82 18, 80 32 C88 38, 82 58, 74 60 C70 65, 30 65, 22 55 Z" fill="#00B894" stroke="#2D3436" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="50" cy="55" r="24" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Eyes */}
    <circle cx="42" cy="53" r="2.5" fill="#2D3436" />
    <circle cx="58" cy="53" r="2.5" fill="#2D3436" />
    {/* Smile */}
    <path d="M44 62 Q50 67 56 62" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" />
    {/* Cheeks */}
    <circle cx="36" cy="58" r="3" fill="#FF7675" opacity="0.4" />
    <circle cx="64" cy="58" r="3" fill="#FF7675" opacity="0.4" />
  </svg>
);

export const PonytailAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#F3E5F5" opacity="0.5" />
    {/* Side Ponytail puff */}
    <circle cx="76" cy="46" r="12" fill="#9C27B0" stroke="#2D3436" strokeWidth="2.5" />
    <path d="M72 48 L84 56 C80 62, 70 60, 68 54 Z" fill="#9C27B0" stroke="#2D3436" strokeWidth="2" strokeLinejoin="round" />
    {/* Hair Tie */}
    <circle cx="68" cy="48" r="3" fill="#FF7675" stroke="#2D3436" strokeWidth="1.5" />
    {/* Head */}
    <circle cx="46" cy="55" r="25" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Bangs */}
    <path d="M21 54 C21 38, 71 38, 71 54 C65 44, 45 44, 21 54 Z" fill="#9C27B0" stroke="#2D3436" strokeWidth="2" />
    {/* Eyes (Wink!) */}
    <circle cx="38" cy="53" r="2.5" fill="#2D3436" />
    <path d="M51 53 Q54 50 57 53" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Smile */}
    <path d="M40 63 Q46 68 52 63" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const BunHairstyleAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#E0F2F1" opacity="0.5" />
    {/* Double Space Buns */}
    <circle cx="28" cy="30" r="10" fill="#009688" stroke="#2D3436" strokeWidth="2.5" />
    <circle cx="72" cy="30" r="10" fill="#009688" stroke="#2D3436" strokeWidth="2.5" />
    {/* Main head */}
    <circle cx="50" cy="55" r="25" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Hair crown */}
    <path d="M25 50 C25 35, 75 35, 75 50" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Closed happy eyelashes eyes */}
    <path d="M37 51 Q41 55 45 51" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M55 51 Q59 55 63 51" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Smile */}
    <path d="M44 63 Q50 68 56 63" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const HeadphonesAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#FFF9C4" opacity="0.5" />
    {/* Headphone Arch */}
    <path d="M22 52 A28 28 0 0 1 78 52" stroke="#FF7675" strokeWidth="5" strokeLinecap="round" fill="none" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Headphone Cups */}
    <rect x="18" y="44" width="8" height="22" rx="4" fill="#FF7675" stroke="#2D3436" strokeWidth="2.5" />
    <rect x="74" y="44" width="8" height="22" rx="4" fill="#FF7675" stroke="#2D3436" strokeWidth="2.5" />
    {/* Eyes */}
    <path d="M38 52 Q42 49 46 52" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M54 52 Q58 49 62 52" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Relaxed Smile */}
    <path d="M44 63 Q50 67 56 63" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const GamerAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#D1C4E9" opacity="0.5" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Futuristic visor/glasses */}
    <path d="M25 45 L75 45 L71 56 L29 56 Z" fill="#6C5CE7" stroke="#2D3436" strokeWidth="2.5" strokeLinejoin="round" />
    <line x1="25" y1="50" x2="75" y2="50" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.5" />
    {/* Microphone boom */}
    <path d="M28 60 Q20 62 26 68" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <circle cx="27" cy="68" r="2" fill="#FF7675" />
    {/* Confident Smile */}
    <path d="M44 65 Q50 69 56 65" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const ArtistAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#FFD180" opacity="0.4" />
    {/* Red Beret Hat */}
    <path d="M26 38 C32 25, 68 25, 74 38 C65 35, 35 35, 26 38 Z" fill="#E17055" stroke="#2D3436" strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="50" cy="27" r="3" fill="#E17055" stroke="#2D3436" strokeWidth="1.5" />
    <circle cx="50" cy="55" r="25" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Artist palette splash on cheeks */}
    <circle cx="36" cy="58" r="3" fill="#0984E3" opacity="0.6" />
    <circle cx="64" cy="58" r="3" fill="#E17055" opacity="0.6" />
    {/* Eyes */}
    <circle cx="41" cy="51" r="2.5" fill="#2D3436" />
    <circle cx="59" cy="51" r="2.5" fill="#2D3436" />
    {/* Small curious smile */}
    <path d="M46 63 Q50 66 54 63" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const BookLoverAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#FFF8E1" opacity="0.5" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Cute Book resting on head */}
    <path d="M38 28 L50 34 L62 28 L62 20 L50 24 L38 20 Z" fill="#00CEC9" stroke="#2D3436" strokeWidth="2.5" strokeLinejoin="round" />
    <line x1="50" y1="24" x2="50" y2="34" stroke="#2D3436" strokeWidth="1.5" />
    {/* Cute round reading glasses */}
    <circle cx="40" cy="51" r="7" stroke="#2D3436" strokeWidth="2.5" fill="none" />
    <circle cx="60" cy="51" r="7" stroke="#2D3436" strokeWidth="2.5" fill="none" />
    <line x1="47" y1="51" x2="53" y2="51" stroke="#2D3436" strokeWidth="2" />
    {/* Eyes */}
    <circle cx="40" cy="51" r="2" fill="#2D3436" />
    <circle cx="60" cy="51" r="2" fill="#2D3436" />
    {/* Smile */}
    <path d="M44 64 Q50 68 56 64" stroke="#2D3436" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ShyFaceAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#FFE082" opacity="0.4" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Pink blushing cheeks */}
    <ellipse cx="36" cy="59" rx="5" ry="3" fill="#FF7675" opacity="0.6" />
    <ellipse cx="64" cy="59" rx="5" ry="3" fill="#FF7675" opacity="0.6" />
    {/* Shy eyes looking inward */}
    <path d="M40 48 Q42 51 43 48" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M57 48 Q58 51 60 48" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Small nervous mouth */}
    <path d="M46 64 Q50 62 54 64" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

export const ConfidentFaceAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#CFD8DC" opacity="0.5" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Cool sunglasses */}
    <path d="M26 48 Q50 43 74 48 L71 57 Q50 54 29 57 Z" fill="#2D3436" stroke="#2D3436" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Confident Smirk */}
    <path d="M45 64 Q52 64 56 60" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const WinkAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#FF8A80" opacity="0.4" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Left Eye: Open */}
    <circle cx="41" cy="50" r="3" fill="#2D3436" />
    {/* Right Eye: Wink */}
    <path d="M54 50 Q59 45 64 50" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Tongue Sticking Out */}
    <path d="M45 61 Q50 71 55 61 Z" fill="#FF7675" stroke="#2D3436" strokeWidth="2.5" strokeLinejoin="round" />
    <line x1="50" y1="61" x2="50" y2="67" stroke="#2D3436" strokeWidth="1.5" />
  </svg>
);

export const FrecklesAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#F48FB1" opacity="0.35" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Freckles points */}
    <circle cx="34" cy="57" r="1" fill="#E17055" />
    <circle cx="36" cy="56" r="1" fill="#E17055" />
    <circle cx="37" cy="58" r="1" fill="#E17055" />
    <circle cx="63" cy="56" r="1" fill="#E17055" />
    <circle cx="64" cy="58" r="1" fill="#E17055" />
    <circle cx="66" cy="57" r="1" fill="#E17055" />
    {/* Eyes */}
    <circle cx="41" cy="50" r="2.5" fill="#2D3436" />
    <circle cx="59" cy="50" r="2.5" fill="#2D3436" />
    {/* Happy Smile */}
    <path d="M42 63 Q50 69 58 63" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const CapAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#FFE082" opacity="0.5" />
    {/* Backwards cap structure */}
    <path d="M22 44 Q50 30 78 44" stroke="#2D3436" strokeWidth="3" fill="#00CEC9" />
    <path d="M74 42 L88 47 L78 52 Z" fill="#FF7675" stroke="#2D3436" strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="50" cy="55" r="25" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Eyes */}
    <circle cx="42" cy="52" r="2.5" fill="#2D3436" />
    <circle cx="58" cy="52" r="2.5" fill="#2D3436" />
    {/* Cheeky smile */}
    <path d="M43 63 Q52 66 57 60" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const BeanieAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#C5CAE9" opacity="0.5" />
    <circle cx="50" cy="57" r="24" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Cozy Knit Beanie */}
    <path d="M24 50 C24 32, 76 32, 76 50 Z" fill="#E17055" stroke="#2D3436" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Pompom */}
    <circle cx="50" cy="30" r="6" fill="#E17055" stroke="#2D3436" strokeWidth="2" />
    {/* Ribbed lines */}
    <line x1="36" y1="41" x2="39" y2="48" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
    <line x1="50" y1="38" x2="50" y2="48" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
    <line x1="64" y1="41" x2="61" y2="48" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
    {/* Eyes */}
    <circle cx="42" cy="54" r="2.5" fill="#2D3436" />
    <circle cx="58" cy="54" r="2.5" fill="#2D3436" />
    {/* Warm Smile */}
    <path d="M44 64 Q50 68 56 64" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const CoffeeLoverAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#D7CCC8" opacity="0.5" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Coffee Mug block in front */}
    <rect x="42" y="58" width="16" height="15" rx="3" fill="#DFF9FB" stroke="#2D3436" strokeWidth="2.5" />
    <path d="M58 61 C61 61, 63 64, 61 67 C59 69, 58 68, 58 68" stroke="#2D3436" strokeWidth="2" fill="none" />
    {/* Steam vapor curly lines */}
    <path d="M46 50 Q48 45 46 42" stroke="#E17055" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M53 50 Q55 45 53 42" stroke="#E17055" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Joyous eyes */}
    <path d="M38 50 Q41 47 44 50" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M56 50 Q59 47 62 50" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

export const MusicLoverAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#B2EBF2" opacity="0.5" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Soundwaves curves around head */}
    <path d="M16 45 Q10 55 16 65" stroke="#0097A7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M84 45 Q90 55 84 65" stroke="#0097A7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Tiny Music Notes */}
    <path d="M72 26 L77 24 L77 32 Z" fill="#0097A7" />
    <circle cx="71" cy="32" r="2.5" fill="#0097A7" />
    {/* Eyes closed listening bliss */}
    <path d="M37 51 Q41 55 45 51" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M55 51 Q59 55 63 51" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Calm mouth */}
    <path d="M46 63 Q50 65 54 63" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

export const MinimalistFaceAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#ECEFF1" opacity="0.6" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="2" />
    {/* Minimalist closed-eyes arcs */}
    <path d="M40 52 Q42 50 44 52" stroke="#2D3436" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M56 52 Q58 50 60 52" stroke="#2D3436" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Elegant nose line */}
    <path d="M50 51 L48 58 L52 58" stroke="#2D3436" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Peaceful minimal dot mouth */}
    <circle cx="50" cy="64" r="1.5" fill="#2D3436" />
  </svg>
);

export const ExpressiveCartoonAvatar: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#FFCCBC" opacity="0.4" />
    <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" />
    {/* Giant manga expression bubble eyes */}
    <circle cx="39" cy="49" r="6" fill="#2D3436" stroke="#2D3436" strokeWidth="1" />
    <circle cx="37" cy="47" r="2" fill="#FFFFFF" />
    <circle cx="41" cy="51" r="1" fill="#FFFFFF" />
    
    <circle cx="61" cy="49" r="6" fill="#2D3436" stroke="#2D3436" strokeWidth="1" />
    <circle cx="59" cy="47" r="2" fill="#FFFFFF" />
    <circle cx="63" cy="51" r="1" fill="#FFFFFF" />
    {/* Blushing pink oval cheeks */}
    <ellipse cx="32" cy="57" rx="4" ry="2" fill="#FF7675" opacity="0.5" />
    <ellipse cx="68" cy="57" rx="4" ry="2" fill="#FF7675" opacity="0.5" />
    {/* Wide happy smile */}
    <path d="M42 61 Q50 69 58 61" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

// 2. EXPORTED ARRAY OF THE 24 DOODLE AVATARS WITH METADATA

export const DOODLE_AVATARS: DoodleAvatarData[] = [
  { id: 'smiling-boy', name: 'Smiling Boy', category: 'General', bgColor: 'bg-[#FFEAA7]/10', pastelAccent: '#FFEAA7', svg: SmilingBoyAvatar },
  { id: 'smiling-girl', name: 'Smiling Girl', category: 'General', bgColor: 'bg-[#FAB1A0]/10', pastelAccent: '#FAB1A0', svg: SmilingGirlAvatar },
  { id: 'sleepy-face', name: 'Sleepy Face', category: 'Expressions', bgColor: 'bg-[#74B9FF]/10', pastelAccent: '#74B9FF', svg: SleepyFaceAvatar },
  { id: 'excited-face', name: 'Excited Face', category: 'Expressions', bgColor: 'bg-[#55EFC4]/10', pastelAccent: '#55EFC4', svg: ExcitedFaceAvatar },
  { id: 'nerd-glasses', name: 'Nerd with Glasses', category: 'Style', bgColor: 'bg-[#81ECEC]/10', pastelAccent: '#81ECEC', svg: NerdGlassesAvatar },
  { id: 'hoodie', name: 'Hoodie', category: 'Style', bgColor: 'bg-[#A29BFE]/10', pastelAccent: '#A29BFE', svg: HoodieAvatar },
  { id: 'messy-hair', name: 'Messy Hair', category: 'Style', bgColor: 'bg-[#FCE4EC]/10', pastelAccent: '#E84393', svg: MessyHairAvatar },
  { id: 'curly-hair', name: 'Curly Hair', category: 'Style', bgColor: 'bg-[#E8F5E9]/10', pastelAccent: '#00B894', svg: CurlyHairAvatar },
  { id: 'ponytail', name: 'Ponytail', category: 'Style', bgColor: 'bg-[#F3E5F5]/10', pastelAccent: '#9C27B0', svg: PonytailAvatar },
  { id: 'bun-hairstyle', name: 'Bun Hairstyle', category: 'Style', bgColor: 'bg-[#E0F2F1]/10', pastelAccent: '#009688', svg: BunHairstyleAvatar },
  { id: 'headphones', name: 'Headphones', category: 'Hobbies', bgColor: 'bg-[#FFF9C4]/10', pastelAccent: '#FF7675', svg: HeadphonesAvatar },
  { id: 'gamer', name: 'Gamer', category: 'Hobbies', bgColor: 'bg-[#D1C4E9]/10', pastelAccent: '#6C5CE7', svg: GamerAvatar },
  { id: 'artist', name: 'Artist', category: 'Hobbies', bgColor: 'bg-[#FFD180]/10', pastelAccent: '#E17055', svg: ArtistAvatar },
  { id: 'book-lover', name: 'Book Lover', category: 'Hobbies', bgColor: 'bg-[#FFF8E1]/10', pastelAccent: '#00CEC9', svg: BookLoverAvatar },
  { id: 'shy-face', name: 'Shy Face', category: 'Expressions', bgColor: 'bg-[#FFE082]/10', pastelAccent: '#FFE082', svg: ShyFaceAvatar },
  { id: 'confident-face', name: 'Confident Face', category: 'Expressions', bgColor: 'bg-[#CFD8DC]/10', pastelAccent: '#CFD8DC', svg: ConfidentFaceAvatar },
  { id: 'wink', name: 'Wink', category: 'Expressions', bgColor: 'bg-[#FF8A80]/10', pastelAccent: '#FF8A80', svg: WinkAvatar },
  { id: 'freckles', name: 'Freckles', category: 'General', bgColor: 'bg-[#F48FB1]/10', pastelAccent: '#E17055', svg: FrecklesAvatar },
  { id: 'cap', name: 'Cap', category: 'Style', bgColor: 'bg-[#FFE082]/10', pastelAccent: '#00CEC9', svg: CapAvatar },
  { id: 'beanie', name: 'Beanie', category: 'Style', bgColor: 'bg-[#C5CAE9]/10', pastelAccent: '#E17055', svg: BeanieAvatar },
  { id: 'coffee-lover', name: 'Coffee Lover', category: 'Hobbies', bgColor: 'bg-[#D7CCC8]/10', pastelAccent: '#D7CCC8', svg: CoffeeLoverAvatar },
  { id: 'music-lover', name: 'Music Lover', category: 'Hobbies', bgColor: 'bg-[#B2EBF2]/10', pastelAccent: '#0097A7', svg: MusicLoverAvatar },
  { id: 'minimalist-face', name: 'Minimalist Face', category: 'General', bgColor: 'bg-[#ECEFF1]/10', pastelAccent: '#ECEFF1', svg: MinimalistFaceAvatar },
  { id: 'expressive-cartoon', name: 'Expressive Cartoon', category: 'Expressions', bgColor: 'bg-[#FFCCBC]/10', pastelAccent: '#FFCCBC', svg: ExpressiveCartoonAvatar },
];

// 3. REUSABLE AVATAR RENDERER COMPONENT AND CUSTOM SYSTEM

export const CustomizableAvatar: React.FC<{ id: string; className?: string }> = ({ id, className = 'w-full h-full' }) => {
  const parts = id.split('_');
  const expression = parts[1] || 'smile';
  const skinColor = parts[2] ? `#${parts[2]}` : '#FFEAA7';
  const hairStyle = parts[3] || 'none';
  const hairColor = parts[4] ? `#${parts[4]}` : '#2D3436';
  const accessory = parts[5] || 'none';
  const accessoryColor = parts[6] ? `#${parts[6]}` : '#FF7675';

  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 1. Background Circle using selected Skin Color */}
      <circle cx="50" cy="50" r="46" fill={skinColor} opacity="0.35" />

      {/* Background/Back Hair (like Ponytail puff or Double Buns) */}
      {hairStyle === 'ponytail' && (
        <>
          <circle cx="76" cy="46" r="12" fill={hairColor} stroke="#2D3436" strokeWidth="2.5" />
          <path d="M72 48 L84 56 C80 62, 70 60, 68 54 Z" fill={hairColor} stroke="#2D3436" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="68" cy="48" r="3" fill="#FF7675" stroke="#2D3436" strokeWidth="1.5" />
        </>
      )}
      {hairStyle === 'buns' && (
        <>
          <circle cx="28" cy="30" r="10" fill={hairColor} stroke="#2D3436" strokeWidth="2.5" />
          <circle cx="72" cy="30" r="10" fill={hairColor} stroke="#2D3436" strokeWidth="2.5" />
        </>
      )}
      {hairStyle === 'curly' && (
        <path d="M22 55 C12 50, 15 30, 28 25 C32 15, 48 12, 58 18 C68 12, 82 18, 80 32 C88 38, 82 58, 74 60 C70 65, 30 65, 22 55 Z" fill={hairColor} stroke="#2D3436" strokeWidth="3" strokeLinejoin="round" />
      )}

      {/* 2. Head Outline */}
      <circle cx="50" cy="55" r="26" fill="#FFFFFF" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />

      {/* 3. Base Face Expressions */}
      {expression === 'smile' && (
        <>
          <circle cx="41" cy="52" r="3" fill="#2D3436" />
          <circle cx="59" cy="52" r="3" fill="#2D3436" />
          <path d="M43 64 Q50 71 57 64" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="36" cy="58" r="2.5" fill="#FF7675" opacity="0.4" />
          <circle cx="64" cy="58" r="2.5" fill="#FF7675" opacity="0.4" />
        </>
      )}
      {expression === 'sleepy' && (
        <>
          <path d="M37 52 Q41 56 45 52" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M55 52 Q59 56 63 52" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="50" cy="65" r="2.5" fill="#2D3436" />
          <text x="70" y="32" fill="#6C5CE7" fontSize="11" fontWeight="bold" fontFamily="monospace" transform="rotate(10 70 32)">zZz</text>
        </>
      )}
      {expression === 'excited' && (
        <>
          <circle cx="41" cy="52" r="3" fill="#2D3436" />
          <circle cx="59" cy="52" r="3" fill="#2D3436" />
          <path d="M40 60 Q50 72 60 60 Z" fill="#FF7675" stroke="#2D3436" strokeWidth="3" strokeLinejoin="round" />
        </>
      )}
      {expression === 'shy' && (
        <>
          <path d="M40 48 Q42 51 43 48" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M57 48 Q58 51 60 48" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M46 64 Q50 62 54 64" stroke="#2D3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <ellipse cx="36" cy="59" rx="5" ry="3" fill="#FF7675" opacity="0.6" />
          <ellipse cx="64" cy="59" rx="5" ry="3" fill="#FF7675" opacity="0.6" />
        </>
      )}
      {expression === 'confident' && (
        <>
          <circle cx="41" cy="52" r="3" fill="#2D3436" />
          <circle cx="59" cy="52" r="3" fill="#2D3436" />
          <path d="M45 64 Q52 64 56 60" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      )}
      {expression === 'wink' && (
        <>
          <circle cx="41" cy="50" r="3" fill="#2D3436" />
          <path d="M54 50 Q59 45 64 50" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M45 61 Q50 71 55 61 Z" fill="#FF7675" stroke="#2D3436" strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="50" y1="61" x2="50" y2="67" stroke="#2D3436" strokeWidth="1.5" />
        </>
      )}
      {expression === 'cheeky' && (
        <>
          <circle cx="41" cy="51" r="3" fill="#2D3436" />
          <circle cx="59" cy="51" r="3" fill="#2D3436" />
          <path d="M42 61 Q50 69 58 61" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" fill="none" />
          <ellipse cx="36" cy="57" rx="3.5" ry="2" fill="#FF7675" opacity="0.5" />
          <ellipse cx="64" cy="57" rx="3.5" ry="2" fill="#FF7675" opacity="0.5" />
        </>
      )}

      {/* 4. Foreground Hair / Hats */}
      {hairStyle === 'slick' && (
        <path d="M26 44 C34 30, 66 30, 74 44 C65 38, 55 38, 48 42 C42 45, 32 45, 26 44 Z" fill={hairColor} stroke="#2D3436" strokeWidth="2" strokeLinejoin="round" />
      )}
      {hairStyle === 'bob' && (
        <>
          <path d="M22 55 C22 35, 78 35, 78 55 C74 46, 68 40, 50 42 C32 40, 26 46, 22 55 Z" fill={hairColor} stroke="#2D3436" strokeWidth="2" />
          <path d="M22 55 L25 64" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
          <path d="M78 55 L75 64" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {hairStyle === 'spiky' && (
        <path d="M42 30 L46 20 L50 28 L54 18 L58 30" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill={hairColor} />
      )}
      {hairStyle === 'messy' && (
        <path d="M22 45 C20 30, 30 18, 45 22 C50 14, 65 16, 70 24 C78 28, 80 40, 76 48 C72 45, 68 46, 65 44 C60 41, 52 45, 48 42 C40 40, 30 46, 22 45 Z" fill={hairColor} stroke="#2D3436" strokeWidth="2.5" strokeLinejoin="round" />
      )}
      {hairStyle === 'ponytail' && (
        <path d="M21 54 C21 38, 71 38, 71 54 C65 44, 45 44, 21 54 Z" fill={hairColor} stroke="#2D3436" strokeWidth="2" />
      )}
      {hairStyle === 'buns' && (
        <path d="M25 50 C25 35, 75 35, 75 50" stroke="#2D3436" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      {hairStyle === 'cap' && (
        <>
          <path d="M22 44 Q50 30 78 44" stroke="#2D3436" strokeWidth="3" fill={hairColor} />
          <path d="M74 42 L88 47 L78 52 Z" fill="#FF7675" stroke="#2D3436" strokeWidth="2.5" strokeLinejoin="round" />
        </>
      )}
      {hairStyle === 'beanie' && (
        <>
          <path d="M24 50 C24 32, 76 32, 76 50 Z" fill={hairColor} stroke="#2D3436" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="50" cy="30" r="6" fill={hairColor} stroke="#2D3436" strokeWidth="2" />
          <line x1="36" y1="41" x2="39" y2="48" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
          <line x1="50" y1="38" x2="50" y2="48" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
          <line x1="64" y1="41" x2="61" y2="48" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
        </>
      )}

      {/* 5. Accessories */}
      {accessory === 'glasses' && (
        <>
          <rect x="29" y="44" width="18" height="14" rx="4" fill="none" stroke={accessoryColor} strokeWidth="3" />
          <rect x="53" y="44" width="18" height="14" rx="4" fill="none" stroke={accessoryColor} strokeWidth="3" />
          <line x1="47" y1="51" x2="53" y2="51" stroke="#2D3436" strokeWidth="3" />
        </>
      )}
      {accessory === 'visor' && (
        <>
          <path d="M25 45 L75 45 L71 56 L29 56 Z" fill={accessoryColor} stroke="#2D3436" strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="25" y1="50" x2="75" y2="50" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.5" />
        </>
      )}
      {accessory === 'headphones' && (
        <>
          <path d="M22 52 A28 28 0 0 1 78 52" stroke={accessoryColor} strokeWidth="5" strokeLinecap="round" fill="none" />
          <rect x="18" y="44" width="8" height="22" rx="4" fill={accessoryColor} stroke="#2D3436" strokeWidth="2.5" />
          <rect x="74" y="44" width="8" height="22" rx="4" fill={accessoryColor} stroke="#2D3436" strokeWidth="2.5" />
        </>
      )}
      {accessory === 'blush' && (
        <>
          <circle cx="36" cy="58" r="3.5" fill={accessoryColor} opacity="0.5" />
          <circle cx="63" cy="59" r="3.5" fill={accessoryColor} opacity="0.5" />
        </>
      )}
      {accessory === 'freckles' && (
        <>
          <circle cx="34" cy="57" r="1" fill={accessoryColor} />
          <circle cx="36" cy="56" r="1" fill={accessoryColor} />
          <circle cx="37" cy="58" r="1" fill={accessoryColor} />
          <circle cx="63" cy="56" r="1" fill={accessoryColor} />
          <circle cx="64" cy="58" r="1" fill={accessoryColor} />
          <circle cx="66" cy="57" r="1" fill={accessoryColor} />
        </>
      )}
      {accessory === 'coffee' && (
        <>
          <rect x="42" y="58" width="16" height="15" rx="3" fill={accessoryColor} stroke="#2D3436" strokeWidth="2.5" />
          <path d="M58 61 C61 61, 63 64, 61 67 C59 69, 58 68, 58 68" stroke="#2D3436" strokeWidth="2" fill="none" />
          <path d="M46 50 Q48 45 46 42" stroke="#E17055" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M53 50 Q55 45 53 42" stroke="#E17055" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </>
      )}
      {accessory === 'notes' && (
        <>
          <path d="M72 26 L77 24 L77 32 Z" fill={accessoryColor} />
          <circle cx="71" cy="32" r="2.5" fill={accessoryColor} />
        </>
      )}
    </svg>
  );
};

export const mapPresetToCustom = (presetId: string) => {
  const config = {
    expression: 'smile',
    skinColor: 'FFEAA7',
    hairStyle: 'none',
    hairColor: '2D3436',
    accessory: 'none',
    accessoryColor: 'FF7675'
  };

  if (presetId.startsWith('custom_')) {
    const parts = presetId.split('_');
    config.expression = parts[1] || 'smile';
    config.skinColor = parts[2] || 'FFEAA7';
    config.hairStyle = parts[3] || 'none';
    config.hairColor = parts[4] || '2D3436';
    config.accessory = parts[5] || 'none';
    config.accessoryColor = parts[6] || 'FF7675';
    return config;
  }

  switch (presetId) {
    case 'smiling-boy':
      config.expression = 'smile';
      config.skinColor = 'FFEAA7';
      config.hairStyle = 'slick';
      config.hairColor = '2D3436';
      break;
    case 'smiling-girl':
      config.expression = 'smile';
      config.skinColor = 'FAB1A0';
      config.hairStyle = 'bob';
      config.hairColor = '74B9FF';
      break;
    case 'sleepy-face':
      config.expression = 'sleepy';
      config.skinColor = '74B9FF';
      break;
    case 'excited-face':
      config.expression = 'excited';
      config.skinColor = '55EFC4';
      config.hairStyle = 'spiky';
      break;
    case 'nerd-glasses':
      config.expression = 'smile';
      config.skinColor = '81ECEC';
      config.accessory = 'glasses';
      config.accessoryColor = '2D3436';
      break;
    case 'hoodie':
      config.expression = 'smile';
      config.skinColor = 'A29BFE';
      config.hairStyle = 'none';
      break;
    case 'messy-hair':
      config.expression = 'smile';
      config.skinColor = 'FCE4EC';
      config.hairStyle = 'messy';
      config.hairColor = 'E84393';
      break;
    case 'curly-hair':
      config.expression = 'smile';
      config.skinColor = 'E8F5E9';
      config.hairStyle = 'curly';
      config.hairColor = '00B894';
      break;
    case 'ponytail':
      config.expression = 'wink';
      config.skinColor = 'F3E5F5';
      config.hairStyle = 'ponytail';
      config.hairColor = '9C27B0';
      break;
    case 'bun-hairstyle':
      config.expression = 'smile';
      config.skinColor = 'E0F2F1';
      config.hairStyle = 'buns';
      config.hairColor = '009688';
      break;
    case 'headphones':
      config.expression = 'smile';
      config.skinColor = 'FFF9C4';
      config.accessory = 'headphones';
      config.accessoryColor = 'FF7675';
      break;
    case 'gamer':
      config.expression = 'smile';
      config.skinColor = 'D1C4E9';
      config.accessory = 'visor';
      config.accessoryColor = '6C5CE7';
      break;
    case 'artist':
      config.expression = 'smile';
      config.skinColor = 'FFD180';
      config.hairStyle = 'cap';
      config.hairColor = 'E17055';
      break;
    case 'book-lover':
      config.expression = 'smile';
      config.skinColor = 'FFF8E1';
      config.accessory = 'glasses';
      config.accessoryColor = '00CEC9';
      break;
    case 'shy-face':
      config.expression = 'shy';
      config.skinColor = 'FFE082';
      break;
    case 'confident-face':
      config.expression = 'confident';
      config.skinColor = 'CFD8DC';
      break;
    case 'wink':
      config.expression = 'wink';
      config.skinColor = 'FF8A80';
      break;
    case 'freckles':
      config.expression = 'smile';
      config.skinColor = 'F48FB1';
      config.accessory = 'freckles';
      config.accessoryColor = 'E17055';
      break;
    case 'cap':
      config.expression = 'smile';
      config.skinColor = 'FFE082';
      config.hairStyle = 'cap';
      config.hairColor = '00CEC9';
      break;
    case 'beanie':
      config.expression = 'smile';
      config.skinColor = 'C5CAE9';
      config.hairStyle = 'beanie';
      config.hairColor = 'E17055';
      break;
    case 'coffee-lover':
      config.expression = 'smile';
      config.skinColor = 'D7CCC8';
      config.accessory = 'coffee';
      config.accessoryColor = 'DFF9FB';
      break;
    case 'music-lover':
      config.expression = 'smile';
      config.skinColor = 'B2EBF2';
      config.accessory = 'notes';
      config.accessoryColor = '0097A7';
      break;
    case 'minimalist-face':
      config.expression = 'smile';
      config.skinColor = 'ECEFF1';
      break;
    case 'expressive-cartoon':
      config.expression = 'cheeky';
      config.skinColor = 'FFCCBC';
      break;
  }
  return config;
};

export const DoodleAvatar: React.FC<{ id: string; className?: string }> = ({ id, className = 'w-12 h-12' }) => {
  if (id.startsWith('custom_')) {
    return <CustomizableAvatar id={id} className={className} />;
  }
  const av = DOODLE_AVATARS.find(item => item.id === id);
  if (!av) {
    // Return standard fallback if ID doesn't match
    return <SmilingBoyAvatar className={className} />;
  }
  const SvgComponent = av.svg;
  return <SvgComponent className={className} />;
};

interface AvatarCustomizerScreenProps {
  onBack: () => void;
  selectedId: string;
  onSave: (serializedId: string) => void;
}

export const AvatarCustomizerScreen: React.FC<AvatarCustomizerScreenProps> = ({
  onBack,
  selectedId,
  onSave
}) => {
  const initialConfig = mapPresetToCustom(selectedId);
  
  const [expression, setExpression] = useState(initialConfig.expression);
  const [skinColor, setSkinColor] = useState(initialConfig.skinColor);
  const [hairStyle, setHairStyle] = useState(initialConfig.hairStyle);
  const [hairColor, setHairColor] = useState(initialConfig.hairColor);
  const [accessory, setAccessory] = useState(initialConfig.accessory);
  const [accessoryColor, setAccessoryColor] = useState(initialConfig.accessoryColor);

  const [activeTab, setActiveTab] = useState<'expression' | 'skin' | 'hairStyle' | 'hairColor' | 'accessory' | 'accessoryColor'>('expression');

  const expressions = [
    { id: 'smile', label: 'Smiling', emoji: '😊' },
    { id: 'sleepy', label: 'Sleepy', emoji: '😴' },
    { id: 'excited', label: 'Excited', emoji: '🤩' },
    { id: 'shy', label: 'Shy', emoji: '🥺' },
    { id: 'confident', label: 'Confident', emoji: '😎' },
    { id: 'wink', label: 'Wink', emoji: '😉' },
    { id: 'cheeky', label: 'Cheeky', emoji: '😜' }
  ];

  const skinColors = [
    { value: 'FFEAA7', label: 'Butter' },
    { value: 'FAB1A0', label: 'Peach' },
    { value: '74B9FF', label: 'Sky' },
    { value: '55EFC4', label: 'Mint' },
    { value: 'A29BFE', label: 'Lavender' },
    { value: 'FF8A80', label: 'Rose' },
    { value: 'ECEFF1', label: 'Slate' }
  ];

  const hairStyles = [
    { id: 'none', label: 'Bald/None', emoji: '🥚' },
    { id: 'slick', label: 'Slick Sweep', emoji: '💇‍♂️' },
    { id: 'bob', label: 'Bob Cut', emoji: '💇‍♀️' },
    { id: 'spiky', label: 'Spiky', emoji: '💥' },
    { id: 'messy', label: 'Messy Shag', emoji: '🦁' },
    { id: 'curly', label: 'Curly Puff', emoji: '🐑' },
    { id: 'ponytail', label: 'Ponytail', emoji: '👱‍♀️' },
    { id: 'buns', label: 'Double Buns', emoji: '🐼' },
    { id: 'cap', label: 'Backward Cap', emoji: '🧢' },
    { id: 'beanie', label: 'Cozy Beanie', emoji: '🧶' }
  ];

  const hairColors = [
    { value: '2D3436', label: 'Charcoal' },
    { value: 'E17055', label: 'Sunset' },
    { value: '0984E3', label: 'Cobalt' },
    { value: 'E84393', label: 'Hot Pink' },
    { value: '00B894', label: 'Mint' },
    { value: '6C5CE7', label: 'Purple' },
    { value: '00CEC9', label: 'Bright Teal' }
  ];

  const accessories = [
    { id: 'none', label: 'None', emoji: '❌' },
    { id: 'glasses', label: 'Round Glasses', emoji: '👓' },
    { id: 'visor', label: 'Cyber Visor', emoji: '🥽' },
    { id: 'headphones', label: 'Headphones', emoji: '🎧' },
    { id: 'blush', label: 'Pink Blush', emoji: '🌸' },
    { id: 'freckles', label: 'Freckles', emoji: '✨' },
    { id: 'coffee', label: 'Coffee Cup', emoji: '☕' },
    { id: 'notes', label: 'Music Notes', emoji: '🎵' }
  ];

  const accessoryColors = [
    { value: 'FF7675', label: 'Warm Red' },
    { value: '74B9FF', label: 'Sky Blue' },
    { value: '55EFC4', label: 'Mint Green' },
    { value: 'FFEAA7', label: 'Yellow Gold' },
    { value: 'A29BFE', label: 'Soft Purple' },
    { value: '2D3436', label: 'Midnight' }
  ];

  const getSerializedId = () => {
    return `custom_${expression}_${skinColor}_${hairStyle}_${hairColor}_${accessory}_${accessoryColor}`;
  };

  const previewId = getSerializedId();

  return (
    <div className="absolute inset-0 bg-slate-50 flex flex-col z-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 active:scale-90 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-1.5 uppercase">
          <Sparkles size={14} className="text-[#6C5CE7]" />
          <span>Avatar Studio</span>
        </h2>
        <div className="w-9" /> {/* Spacer */}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Live Preview Frame */}
        <div className="bg-white py-6 border-b border-slate-100 flex flex-col items-center justify-center shrink-0 shadow-sm relative">
          <div className="w-32 h-32 bg-[#F1F3F5] rounded-full flex items-center justify-center shadow-lg border-4 border-white p-2 relative">
            <CustomizableAvatar id={previewId} className="w-full h-full" />
            <span className="absolute bottom-0 right-0 bg-[#6C5CE7] text-white text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm">LIVE</span>
          </div>
          <span className="text-[10px] font-black text-slate-400 mt-3 tracking-wider uppercase">Your Unique Creation</span>
        </div>

        {/* Tab Selection Row */}
        <div className="bg-white border-b border-slate-100 py-2 overflow-x-auto scrollbar-none flex gap-1.5 px-4 shrink-0">
          {(
            [
              { id: 'expression', label: 'Face' },
              { id: 'skin', label: 'Skin Color' },
              { id: 'hairStyle', label: 'Hair Style' },
              { id: 'hairColor', label: 'Hair Color' },
              { id: 'accessory', label: 'Accessory' },
              { id: 'accessoryColor', label: 'Acc. Color' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#6C5CE7] text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Option Selectors area */}
        <div className="flex-1 overflow-y-auto p-4">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* 1. Face expressions options */}
            {activeTab === 'expression' && (
              <div className="grid grid-cols-2 gap-2.5">
                {expressions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setExpression(opt.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 cursor-pointer transition-all ${
                      expression === opt.id
                        ? 'border-[#6C5CE7] bg-[#6C5CE7]/5 ring-2 ring-[#6C5CE7]/20 shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl shrink-0">{opt.emoji}</span>
                    <span className="text-[11px] font-bold text-slate-700">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 2. Skin Color Options */}
            {activeTab === 'skin' && (
              <div className="grid grid-cols-4 gap-3">
                {skinColors.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSkinColor(opt.value)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border cursor-pointer transition-all ${
                      skinColor === opt.value
                        ? 'border-[#6C5CE7] bg-[#6C5CE7]/5 scale-105 shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full shadow-inner border border-slate-200" style={{ backgroundColor: `#${opt.value}` }} />
                    <span className="text-[9px] font-bold text-slate-500 mt-1.5">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 3. Hair Styles options */}
            {activeTab === 'hairStyle' && (
              <div className="grid grid-cols-2 gap-2.5">
                {hairStyles.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setHairStyle(opt.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 cursor-pointer transition-all ${
                      hairStyle === opt.id
                        ? 'border-[#6C5CE7] bg-[#6C5CE7]/5 ring-2 ring-[#6C5CE7]/20 shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl shrink-0">{opt.emoji}</span>
                    <span className="text-[11px] font-bold text-slate-700">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 4. Hair Colors Options */}
            {activeTab === 'hairColor' && (
              <div className="grid grid-cols-4 gap-3">
                {hairColors.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setHairColor(opt.value)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border cursor-pointer transition-all ${
                      hairColor === opt.value
                        ? 'border-[#6C5CE7] bg-[#6C5CE7]/5 scale-105 shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full shadow-inner border border-slate-200" style={{ backgroundColor: `#${opt.value}` }} />
                    <span className="text-[9px] font-bold text-slate-500 mt-1.5">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 5. Accessories Options */}
            {activeTab === 'accessory' && (
              <div className="grid grid-cols-2 gap-2.5">
                {accessories.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAccessory(opt.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 cursor-pointer transition-all ${
                      accessory === opt.id
                        ? 'border-[#6C5CE7] bg-[#6C5CE7]/5 ring-2 ring-[#6C5CE7]/20 shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl shrink-0">{opt.emoji}</span>
                    <span className="text-[11px] font-bold text-slate-700">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 6. Accessory Colors Options */}
            {activeTab === 'accessoryColor' && (
              <div className="grid grid-cols-4 gap-3">
                {accessoryColors.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAccessoryColor(opt.value)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border cursor-pointer transition-all ${
                      accessoryColor === opt.value
                        ? 'border-[#6C5CE7] bg-[#6C5CE7]/5 scale-105 shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full shadow-inner border border-slate-200" style={{ backgroundColor: `#${opt.value}` }} />
                    <span className="text-[9px] font-bold text-slate-500 mt-1.5">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Footer Apply Button */}
      <div className="bg-white p-4 border-t border-slate-100 shrink-0">
        <button
          onClick={() => onSave(previewId)}
          className="w-full bg-[#6C5CE7] hover:bg-[#5B4EC9] active:scale-98 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Check size={14} />
          <span>Save & Apply Custom Avatar</span>
        </button>
      </div>
    </div>
  );
};

// 4. THE INTERACTIVE AVATAR SELECTION SCREEN COMPONENT

interface AvatarSelectionScreenProps {
  onBack: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
  onContinue: () => void;
}

export const AvatarSelectionScreen: React.FC<AvatarSelectionScreenProps> = ({
  onBack,
  selectedId,
  onSelect,
  onContinue,
}) => {
  // Category tabs for filtering the 24 avatars
  const [activeTab, setActiveTab] = React.useState<string>('All');
  const tabs = ['All', 'General', 'Expressions', 'Style', 'Hobbies'];

  const filteredAvatars = DOODLE_AVATARS.filter(
    av => activeTab === 'All' || av.category === activeTab
  );

  return (
    <div className="absolute inset-0 bg-white flex flex-col z-20">
      {/* Top Header - Back Button and spacing */}
      <div className="pt-6 px-6 flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#F1F3F5] text-[#2D3436] hover:bg-gray-200 transition-all cursor-pointer"
          id="avatar-select-back"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2 bg-[#E1F5FE] text-[#039BE5] px-3 py-1.5 rounded-2xl font-bold text-[10px] uppercase">
          <Sparkles size={11} className="animate-pulse" />
          <span>New Identity System</span>
        </div>
      </div>

      {/* Title & Subtitle with Generous Whitespace */}
      <div className="px-6 pt-5 pb-4 text-left shrink-0">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#2D3436] font-display">
          Choose your avatar
        </h2>
        <p className="text-sm text-gray-400 font-medium mt-1.5">
          Pick one that feels like you.
        </p>
      </div>

      {/* Category Pills Slider */}
      <div className="px-6 py-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'bg-[#6C5CE7] text-white shadow-md shadow-purple-100'
                : 'bg-[#F1F3F5] text-gray-500 hover:text-[#2D3436] hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Scrollable Avatar Responsive Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
        <motion.div
          className="grid grid-cols-3 sm:grid-cols-4 gap-4 pb-20"
          layout
        >
          {filteredAvatars.map((av, index) => {
            const SvgRenderer = av.svg;
            const isSelected = selectedId === av.id;

            return (
              <motion.div
                key={av.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.2) }}
              >
                <button
                  onClick={() => onSelect(av.id)}
                  className={`relative w-full aspect-square rounded-[24px] bg-white border-2 transition-all duration-300 p-2 flex flex-col items-center justify-center cursor-pointer select-none group shadow-sm ${
                    isSelected
                      ? 'border-[#6C5CE7] bg-[#6C5CE7]/5 shadow-lg shadow-purple-100/50 scale-105'
                      : 'border-gray-100 hover:border-[#6C5CE7]/50 hover:shadow-md hover:-translate-y-1'
                  }`}
                >
                  {/* Selected checkmark glow and circle */}
                  {isSelected && (
                    <motion.div
                      className="absolute top-2 right-2 w-5 h-5 bg-[#6C5CE7] rounded-full flex items-center justify-center text-white z-10 shadow-sm"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </motion.div>
                  )}

                  {/* SVG Image Rendering */}
                  <div className="w-4/5 h-4/5 flex items-center justify-center">
                    <SvgRenderer className="w-full h-full transform transition-all group-hover:scale-105 duration-300" />
                  </div>

                  {/* Avatar Name Tag */}
                  <span className={`text-[9px] font-extrabold mt-1.5 text-center truncate w-full ${
                    isSelected ? 'text-[#6C5CE7]' : 'text-[#2D3436]/70'
                  }`}>
                    {av.name}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Bottom Continue Button Footer */}
      <div className="p-6 bg-white border-t border-gray-100 shrink-0 shadow-lg">
        {selectedId ? (
          <motion.button
            onClick={onContinue}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[#6C5CE7] text-white font-extrabold py-4 rounded-[20px] shadow-lg shadow-purple-100 hover:bg-[#5b4cc4] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continue</span>
            <Sparkles size={16} />
          </motion.button>
        ) : (
          <button
            disabled
            className="w-full bg-gray-100 text-gray-400 font-extrabold py-4 rounded-[20px] transition-all cursor-not-allowed"
          >
            Select an avatar to continue
          </button>
        )}
      </div>
    </div>
  );
};
