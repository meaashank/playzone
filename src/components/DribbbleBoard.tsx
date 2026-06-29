/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Palette,
  Type,
  Maximize2,
  Lock,
  Compass,
  Zap,
  CheckCircle2,
  Info,
  Layers,
  Activity,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { ScreenId, UserProfile, AppSettings } from '../types';
import { GAME_PLACEHOLDERS, DEFAULT_ACHIEVEMENTS } from '../constants';
import { InteractiveScreens } from './InteractiveScreens';

interface DribbbleBoardProps {
  onSelectScreen: (screenId: ScreenId) => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  favorites: string[];
  setFavorites: React.Dispatch<React.SetStateAction<string[]>>;
  notifications: Array<{ id: string; title: string; body: string; time: string; read: boolean }>;
  setNotifications: React.Dispatch<React.SetStateAction<Array<{ id: string; title: string; body: string; time: string; read: boolean }>>>;
  onShowNotificationBanner: (title: string, message: string) => void;
  theme?: 'light' | 'dark';
}

export const DribbbleBoard: React.FC<DribbbleBoardProps> = ({
  onSelectScreen,
  profile,
  setProfile,
  settings,
  setSettings,
  favorites,
  setFavorites,
  notifications,
  setNotifications,
  onShowNotificationBanner,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  // Simulator states frozen inside mini phone templates
  const [parentUnlockedState, setParentUnlockedState] = useState(false);

  // Micro interaction preview states
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showShimmer, setShowShimmer] = useState(true);

  const screens: { id: ScreenId; label: string; tag: string; color: string; desc: string }[] = [
    {
      id: 'splash',
      label: '1. Splash Screen',
      tag: 'Brand Entry',
      color: 'from-indigo-600 to-indigo-800',
      desc: 'Minimal centered gaming mascot logo with clean custom-block typography & loading progress.'
    },
    {
      id: 'home',
      label: '2. Home Screen',
      tag: 'Main Hub',
      color: 'from-blue-600 to-indigo-600',
      desc: 'Hero banner greeting, coin indicators, categories carousel, and reusable game placeholder grid.'
    },
    {
      id: 'settings',
      label: '3. Settings Screen',
      tag: 'App Control',
      color: 'from-amber-500 to-orange-600',
      desc: 'Tactile switches for sound/music/vibration, and strict parent verification security gates.'
    },
    {
      id: 'profile',
      label: '4. Profile Screen',
      tag: 'User Identity',
      color: 'from-purple-600 to-indigo-700',
      desc: 'Interactive character selector, customizable gamer tag, and high-contrast statistic cards.'
    },
    {
      id: 'achievements',
      label: '5. Badges & Rewards',
      tag: 'Gamification',
      color: 'from-yellow-500 to-amber-600',
      desc: 'Shiny trophy stats banner, milestone progression trackers, and completed checkmarks.'
    },
    {
      id: 'favorites',
      label: '6. Favorites Screen',
      tag: 'Saved Games',
      color: 'from-rose-500 to-pink-600',
      desc: 'Minimal empty state illustration of a loving folder guiding the child back to exploring.'
    },
    {
      id: 'search',
      label: '7. Search Screen',
      tag: 'Navigation',
      color: 'from-sky-500 to-blue-600',
      desc: 'Clean dynamic search bar with category pills filtering the placeholder cards instantaneously.'
    },
    {
      id: 'notifications',
      label: '8. Alert Center',
      tag: 'Notifications',
      color: 'from-teal-500 to-emerald-600',
      desc: 'Sleek notifications board. Supports simulated alerts like screen-time warnings from parents.'
    },
    {
      id: 'about',
      label: '9. About Screen',
      tag: 'Legal info',
      color: 'from-indigo-500 to-violet-600',
      desc: 'Safe children policy terms, credit logs, and version listings under an aesthetic card container.'
    },
    {
      id: 'parent-area',
      label: '10. Parents Area',
      tag: 'Parent Portal',
      color: 'from-red-500 to-rose-600',
      desc: 'Tactile verification keypad. Unlocks kid-safe time counters, content rules & offline modes.'
    }
  ];

  return (
    <div id="dribbble-board" className="space-y-12">
      
      {/* Behance-Style Premium Banner Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 rounded-[32px] p-8 md:p-12 text-white shadow-xl relative overflow-hidden text-left">
        
        {/* Artistic background abstract circles */}
        <div className="absolute right-[-100px] top-[-100px] w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-[-50px] bottom-[-50px] w-64 h-64 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1.5 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-yellow-400" />
            <span>Premium UI/UX System Showcase</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-purple-200">
            PLAYZONE HUB CONCEPT
          </h1>
          
          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl font-medium">
            An original, high-fidelity casual mobile gaming platform designed for children (ages 5-12) and parents. 
            Aiming for Google Play Editors' Choice quality, the system merges kid-friendly playfulness with clean Swiss minimalism.
          </p>

          {/* Core Brand Goals indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center space-x-2.5">
              <span className="text-xl">🎨</span>
              <div>
                <span className="text-xs font-bold block text-white">Flat Design</span>
                <span className="text-[10px] text-slate-400">Zero raw gradients</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center space-x-2.5">
              <span className="text-xl">📱</span>
              <div>
                <span className="text-xs font-bold block text-white">Touch-First</span>
                <span className="text-[10px] text-slate-400">Large hit targets</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center space-x-2.5">
              <span className="text-xl">🔒</span>
              <div>
                <span className="text-xs font-bold block text-white">Parents Gate</span>
                <span className="text-[10px] text-slate-400">Secure math PINs</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center space-x-2.5">
              <span className="text-xl">✨</span>
              <div>
                <span className="text-xs font-bold block text-white">Ad-Free</span>
                <span className="text-[10px] text-slate-400">100% kid-safe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of All 10 Phone Screen Mockups Side-by-Side */}
      <div className="space-y-4 text-left">
        <div>
          <h2 className={`text-xl font-extrabold tracking-tight flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <Layers className="text-indigo-600" size={20} />
            <span>Interactive Concept Screen Matrix</span>
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Displaying all 10 modular views requested by the design guide. Click <strong className="text-indigo-600">"Interactive Simulator"</strong> on any screen card to launch that view in active mode.
          </p>
        </div>

        {/* 10 Screen Device Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {screens.map((screen) => (
            <div
              key={screen.id}
              className={`${isDark ? 'bg-slate-800 border-slate-700 shadow-xl text-slate-100' : 'bg-white border-slate-100 shadow-sm text-slate-800'} rounded-[32px] p-4 border transition-all duration-300 group flex flex-col justify-between`}
            >
              <div>
                {/* Visual Label Tag */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{screen.tag}</span>
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                </div>

                {/* Miniature Smartphone Container - Styled with thick borders from Vibrant Palette */}
                <div className={`relative w-full aspect-[9/18] rounded-[32px] shadow-md border-[6px] overflow-hidden mb-4 shrink-0 select-none ${isDark ? 'border-slate-700 bg-slate-900' : 'border-[#2D3436] bg-white'}`}>
                  
                  {/* Real-time mini viewport scale down */}
                  <div className="w-full h-full overflow-hidden relative bg-slate-50 text-[9px]">
                    
                    {/* Fake Status Bar */}
                    <div className="h-4 bg-white px-2.5 flex items-center justify-between shrink-0 text-slate-800 text-[6px]">
                      <span className="font-extrabold text-[7px]">09:41</span>
                      <div className="flex items-center space-x-0.5 opacity-60">
                        <span className="w-1.5 h-1 bg-slate-800 rounded-full" />
                        <span className="w-1.5 h-1 bg-slate-800 rounded-full" />
                      </div>
                    </div>

                    {/* Active Component with frozen data inside a scale wrapper */}
                    <div className="absolute inset-x-0 bottom-0 top-4 overflow-hidden origin-top scale-100 pointer-events-none select-none">
                      <InteractiveScreens
                        currentScreen={screen.id}
                        setCurrentScreen={() => {}}
                        profile={profile}
                        setProfile={setProfile}
                        settings={settings}
                        setSettings={setSettings}
                        favorites={favorites}
                        setFavorites={setFavorites}
                        notifications={notifications}
                        setNotifications={setNotifications}
                        isParentUnlocked={screen.id === 'parent-area' ? true : parentUnlockedState}
                        setIsParentUnlocked={setParentUnlockedState}
                        onShowNotificationBanner={() => {}}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Meta details */}
                <h3 className={`text-xs font-black px-1 leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{screen.label}</h3>
                <p className="text-[10px] text-slate-400 mt-1 px-1 leading-relaxed text-left min-h-[44px]">
                  {screen.desc}
                </p>
              </div>

              {/* Action trigger to launch simulator */}
              <button
                onClick={() => {
                  onSelectScreen(screen.id);
                  onShowNotificationBanner('Simulator Launched', `Loaded view: ${screen.label}`);
                }}
                className={`mt-4 w-full active:scale-95 font-extrabold text-[10px] py-2 px-3 rounded-2xl border flex items-center justify-center space-x-1 transition-all cursor-pointer ${isDark ? 'bg-slate-700/50 hover:bg-slate-700 border-slate-600 text-slate-200 hover:text-white group-hover:border-indigo-500/50' : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border-slate-100 text-slate-600 group-hover:border-indigo-100'}`}
              >
                <Maximize2 size={11} />
                <span>Interact in Phone</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Style Guide & Brand Assets */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 text-left border-t pt-8 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        
        {/* Style Guide 1: Typography & Visual Principles */}
        <div className={`rounded-3xl p-6 border shadow-sm space-y-5 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-100 text-slate-800'}`}>
          <h3 className={`text-sm font-black tracking-tight flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <Palette className="text-indigo-600" size={16} />
            <span>Style Guide: Color Palette & Swatches</span>
          </h3>
          <p className="text-xs text-slate-400 leading-normal">
            Flat design colors. Bright but tasteful, providing extreme readability without causing visual overload or rainbow fatigue. White cards sitting on clean off-white backgrounds.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { hex: '#2563EB', name: 'Billiard Blue', use: 'Grid Games / Headers' },
              { hex: '#16A34A', name: 'Grid Green', use: 'Checkboxes / Sliders' },
              { hex: '#CA8A04', name: 'Star Yellow', use: 'Scores / Trophy' },
              { hex: '#EA580C', name: 'Disc Orange', use: 'Highlights / Alerts' },
              { hex: '#DC2626', name: 'Gate Red', use: 'Parent Area Bypass' },
              { hex: '#7C3AED', name: 'Hub Purple', use: 'Main Brand Accents' }
            ].map((sw) => (
              <div key={sw.hex} className={`p-2.5 rounded-2xl flex items-center space-x-2 border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <span className={`w-7 h-7 rounded-lg shrink-0 border ${isDark ? 'border-slate-700' : 'border-slate-100'}`} style={{ backgroundColor: sw.hex }} />
                <div className="min-w-0">
                  <span className={`text-[10px] font-black block truncate leading-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{sw.name}</span>
                  <span className="text-[8px] text-slate-400 font-mono block tracking-wider mt-0.5">{sw.hex}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Design Principles Applied</span>
            <ul className={`text-[10px] space-y-1.5 leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                <span><strong>No Gradients:</strong> Flat solid fills represent high-fidelity modern digital cards.</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                <span><strong>Large Spacing:</strong> 24px rounded corners and generous paddings facilitate children tapping.</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                <span><strong>High Contrast:</strong> Tested text-to-background contrast ratio (exceeds WCAG AAA specs).</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Style Guide 2: Micro-Interaction & Animation Demonstrations */}
        <div className={`rounded-3xl p-6 border shadow-sm space-y-5 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-100 text-slate-800'}`}>
          <h3 className={`text-sm font-black tracking-tight flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <Zap className="text-amber-500" size={16} />
            <span>Micro-Interactions Playground</span>
          </h3>
          <p className="text-xs text-slate-400 leading-normal">
            Illustrating app transitions & state feedback. Tap the triggers below to preview how cards and loaders animate during touch events.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Hover Micro Interaction */}
            <div className={`p-3 rounded-2xl text-center border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Card Hover Animation</span>
              <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`mx-auto w-24 h-24 rounded-2xl border flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                  isHovered ? 'bg-blue-600 border-blue-500 text-white shadow-lg scale-105' : (isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-100 text-slate-600')
                }`}
              >
                <Compass size={24} className={isHovered ? 'animate-spin' : ''} />
                <span className="text-[9px] font-extrabold mt-1">{isHovered ? 'Hover active!' : 'Hover mouse'}</span>
              </div>
            </div>

            {/* Tap/Ripple Feedback */}
            <div className={`p-3 rounded-2xl text-center border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Button Touch/Press Feedback</span>
              <button
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                onMouseLeave={() => setIsPressed(false)}
                className={`mx-auto w-24 h-24 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isPressed ? 'bg-indigo-600 border-indigo-500 text-white scale-92' : (isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50')
                }`}
              >
                <Activity size={24} />
                <span className="text-[9px] font-extrabold mt-1">{isPressed ? 'Tapped!' : 'Click and hold'}</span>
              </button>
            </div>
          </div>

          {/* Shimmer / Skeleton Loader state preview */}
          <div className={`p-3 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Skeleton Loader Shimmer Demo</span>
              <button
                onClick={() => setShowShimmer(!showShimmer)}
                className="text-[9px] font-black text-indigo-600 hover:underline flex items-center space-x-1"
              >
                <Layers size={10} />
                <span>Toggle Loading Shimmer</span>
              </button>
            </div>

            {showShimmer ? (
              <div className="space-y-2">
                <div className={`h-4 rounded-lg animate-pulse w-3/4 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <div className={`h-3.5 rounded-lg animate-pulse w-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <div className={`h-3 rounded-lg animate-pulse w-1/2 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
              </div>
            ) : (
              <div className="space-y-1">
                <h4 className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Live Loaded Cards!</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  The loaders completed their loading state and transformed into clean text content smoothly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
