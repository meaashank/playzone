/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Smartphone,
  Layers,
  Heart,
  Settings,
  User,
  Trophy,
  Volume2,
  Shield,
  Search,
  Bell,
  Info,
  ExternalLink,
  Plus,
  Compass,
  Zap,
  CheckCircle2,
  Star,
  Activity,
  Sun,
  Moon
} from 'lucide-react';

import { ScreenId, UserProfile, AppSettings } from './types';
import { PhoneSimulator } from './components/PhoneSimulator';
import { DribbbleBoard } from './components/DribbbleBoard';
import { GAME_PLACEHOLDERS } from './constants';

export default function App() {
  // Global States
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('playzone-theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('playzone-theme', theme);
  }, [theme]);

  const [viewMode, setViewMode] = useState<'board' | 'simulator'>('board');
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('splash');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; title: string; body: string; time: string; read: boolean }>
  >([]);

  const [profile, setProfile] = useState<UserProfile>({
    username: 'Kid Gamer',
    avatarId: 'smiling-boy',
    level: 4,
    coins: 120,
    xp: 35
  });

  const [settings, setSettings] = useState<AppSettings>({
    soundEnabled: true,
    musicEnabled: true,
    vibrationEnabled: true,
    vibrationIntensity: 'medium',
    notificationsEnabled: true,
    language: 'English'
  });

  // Action/Interaction Logs
  const [logs, setLogs] = useState<Array<{ time: string; text: string; id: string }>>([
    { time: '09:41 AM', text: 'PlayZone UI Sandbox loaded successfully.', id: 'log-1' }
  ]);

  // Toast banner state
  const [toast, setToast] = useState<{ title: string; message: string; show: boolean }>({
    title: '',
    message: '',
    show: false
  });

  const addLog = (text: string) => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const uniqueId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setLogs((prev) => [{ time: formattedTime, text, id: uniqueId }, ...prev.slice(0, 19)]);
  };

  const triggerToast = (title: string, message: string) => {
    setToast({ title, message, show: true });
    addLog(`Event triggered: ${title} — ${message}`);
  };

  // Auto hide toast
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Track state changes to output in logs for sandbox transparency
  useEffect(() => {
    addLog(`Changed screen view in simulator to: "${currentScreen.toUpperCase()}"`);
  }, [currentScreen]);

  useEffect(() => {
    addLog(`Background music toggled: ${settings.musicEnabled ? 'ACTIVE' : 'INACTIVE'}`);
  }, [settings.musicEnabled]);

  useEffect(() => {
    addLog(`Sound effects toggled: ${settings.soundEnabled ? 'ACTIVE' : 'INACTIVE'}`);
  }, [settings.soundEnabled]);

  useEffect(() => {
    addLog(`Tactile feedback toggled: ${settings.vibrationEnabled ? 'ACTIVE' : 'INACTIVE'}`);
  }, [settings.vibrationEnabled]);

  useEffect(() => {
    addLog(`Haptic feedback intensity set to: ${settings.vibrationIntensity.toUpperCase()}`);
  }, [settings.vibrationIntensity]);

  const screenNames: Record<ScreenId, string> = {
    splash: 'Splash Screen',
    home: 'Home Screen',
    settings: 'Settings Screen',
    profile: 'Profile Screen',
    achievements: 'Badges & Rewards',
    favorites: 'Favorites (Saved)',
    search: 'Search & Filters',
    notifications: 'Alert Center',
    about: 'About App Info',
    'group-play': 'Group Play',
    'tic-tac-toe': 'Tic Tac Toe Game'
  };

  return (
    <div id="app-root-container" className={`min-h-screen flex flex-col font-sans antialiased selection:bg-[#6C5CE7] selection:text-white pb-12 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] text-slate-100' : 'bg-[#F7F8FA] text-[#2D3436]'}`}>
      
      {/* Dynamic Slide-in Toast Banner */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-2xl px-5 py-3 shadow-xl z-50 flex items-center space-x-3 border border-slate-800 animate-slide-in max-w-sm w-full mx-4">
          <span className="text-xl">✨</span>
          <div className="text-left min-w-0 flex-1">
            <h4 className="text-xs font-black text-amber-400 truncate">{toast.title}</h4>
            <p className="text-[10px] text-slate-300 leading-snug mt-0.5">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main App Workspace Navigation Header */}
      <header className={`p-6 md:p-8 sticky top-0 z-40 shadow-sm shrink-0 transition-colors duration-300 border-b ${theme === 'dark' ? 'bg-[#1E293B] border-slate-800 text-white' : 'bg-white border-gray-100 text-[#2D3436]'}`}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          
          {/* Logo Title Group styled exactly like Vibrant Palette */}
          <div className="text-left">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#6C5CE7] flex items-center justify-center text-white text-xl shadow-md transform rotate-3">
                🎮
              </div>
              <h1 className={`text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#2D3436]'}`}>
                PlayZone <span className="text-[#6C5CE7]">System</span>
              </h1>
            </div>
            <p className={`text-sm font-medium uppercase tracking-widest mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>
              Premium Mini-Game Framework • Design Concept 2026
            </p>
          </div>

          {/* Mode Switcher Buttons & Design Badges from Vibrant Palette */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Mode Switcher Buttons */}
            <div className={`flex p-1 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-[#F1F3F5] border-gray-200'}`}>
              <button
                onClick={() => {
                  setViewMode('board');
                  triggerToast('Switched to Concept Board', 'Displaying all 10 mock mobile frames side-by-side.');
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'board'
                    ? (theme === 'dark' ? 'bg-slate-700 text-[#a29bfe] shadow-sm' : 'bg-white text-[#6C5CE7] shadow-sm')
                    : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-[#2D3436]')
                }`}
              >
                <Layers size={14} />
                <span>Concept Board (Behance Mode)</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('simulator');
                  triggerToast('Simulator Activated', 'Interactive smartphone simulator initialized.');
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'simulator'
                    ? (theme === 'dark' ? 'bg-slate-700 text-[#a29bfe] shadow-sm' : 'bg-white text-[#6C5CE7] shadow-sm')
                    : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-[#2D3436]')
                }`}
              >
                <Smartphone size={14} />
                <span>Interactive Phone Simulator</span>
              </button>
            </div>

            {/* Interactive Theme Switcher Badge */}
            <button
              onClick={() => {
                const nextTheme = theme === 'light' ? 'dark' : 'light';
                setTheme(nextTheme);
                triggerToast('Theme Switched', `Interface style is now: ${nextTheme === 'light' ? 'Light Interface' : 'Dark Mode'}`);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs shrink-0 transition-all cursor-pointer border ${
                theme === 'dark'
                  ? 'bg-indigo-950/40 border-indigo-900/40 text-indigo-400 hover:bg-indigo-950/60'
                  : 'bg-[#E1F5FE] border-[#E1F5FE] text-[#039BE5] hover:bg-[#B3E5FC]'
              }`}
              id="theme-switcher-badge"
            >
              {theme === 'dark' ? (
                <>
                  <Moon size={12} className="fill-indigo-400" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun size={12} className="fill-amber-400 text-amber-500" />
                  <span>Light Interface</span>
                </>
              )}
            </button>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs shrink-0 ${theme === 'dark' ? 'bg-amber-950/40 text-amber-500' : 'bg-[#FFF8E1] text-[#FFB300]'}`}>
              <div className="w-2.5 h-2.5 bg-[#FFB300] rounded-full"></div>
              Safe Mode Active
            </div>
          </div>
        </div>
      </header>

      {/* Primary Page Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 pt-6">
        {viewMode === 'board' ? (
          /* Behance/Dribbble Concept board View */
          <DribbbleBoard
            onSelectScreen={(screenId) => {
              setCurrentScreen(screenId);
              setViewMode('simulator');
            }}
            profile={profile}
            setProfile={setProfile}
            settings={settings}
            setSettings={setSettings}
            favorites={favorites}
            setFavorites={setFavorites}
            notifications={notifications}
            setNotifications={setNotifications}
            onShowNotificationBanner={triggerToast}
            theme={theme}
          />
        ) : (
          /* Left Column Tools + Right Column Phone Simulator Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Control Column (Span 4) */}
            <div className="lg:col-span-4 space-y-6 text-left">
              
              {/* Box 1: Screen Navigation controller */}
              <div className={`rounded-3xl p-5 border shadow-sm space-y-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-100'}`}>
                <div>
                  <h3 className={`text-sm font-black tracking-tight flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    <Compass className="text-indigo-600" size={16} />
                    <span>Quick Screen Jumper</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    Instantly load and test any of the 10 views inside the simulator chassis without needing to tap around standard flow links.
                  </p>
                </div>

                {/* Grid of Screen options */}
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(screenNames) as ScreenId[]).map((screenId) => {
                    const isActive = currentScreen === screenId;
                    return (
                      <button
                        key={screenId}
                        onClick={() => {
                          setCurrentScreen(screenId);
                          triggerToast('Screen Changed', `Simulator navigated to: ${screenNames[screenId]}`);
                        }}
                        className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-between border cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : (theme === 'dark' ? 'bg-[#0F172A] border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white' : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600')
                        }`}
                      >
                        <span className="truncate">{screenNames[screenId]}</span>
                        {isActive && <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Box 2: Reactive Identity Stats */}
              <div className={`rounded-3xl p-5 border shadow-sm space-y-3.5 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#1E293B] border-slate-800' : 'bg-white border-slate-100'}`}>
                <h3 className={`text-sm font-black tracking-tight flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  <User className="text-indigo-600" size={16} />
                  <span>Interactive Gamer Stats (Synced)</span>
                </h3>
                <p className="text-[10px] text-slate-400 leading-normal">
                  These states are reactive. Modify items in the profile settings, coin trigger, or character picker inside the phone to see values change instantly below:
                </p>

                <div className={`grid grid-cols-2 gap-2 p-3.5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Player Name</span>
                    <span className={`text-xs font-extrabold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{profile.username}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Collected Stars</span>
                    <span className="text-xs font-extrabold text-amber-600 flex items-center space-x-1 font-mono">
                      <Star size={11} className="fill-amber-500 text-amber-500" />
                      <span>{profile.coins}</span>
                    </span>
                  </div>
                  <div className="space-y-0.5 mt-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Gamer Level</span>
                    <span className={`text-xs font-extrabold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>Level {profile.level}</span>
                  </div>
                  <div className="space-y-0.5 mt-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Saved Favorites</span>
                    <span className={`text-xs font-extrabold ${theme === 'dark' ? 'text-red-400' : 'text-red-500'} font-mono`}>
                      {favorites.length} {favorites.length === 1 ? 'Game' : 'Games'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 3: Console Logs */}
              <div className={`text-slate-200 rounded-3xl p-4 border shadow-xl space-y-3 ${theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-wider uppercase text-indigo-400 flex items-center gap-1">
                    <Activity size={12} className="text-indigo-400" /> System Action Logger
                  </span>
                  <button
                    onClick={() => setLogs([{ time: 'System', text: 'Logs cleared.', id: 'clear' }])}
                    className="text-[9px] text-slate-500 hover:text-indigo-300 underline font-medium"
                  >
                    Clear Board
                  </button>
                </div>

                <div className="h-[120px] overflow-y-auto text-[10px] space-y-2 font-mono scrollbar-none opacity-90">
                  {logs.map((log) => (
                    <div key={log.id} className="leading-normal flex items-start space-x-1">
                      <span className="text-indigo-400 font-bold shrink-0">[{log.time}]</span>
                      <span className="text-slate-300 text-left">{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Simulator Column (Span 8) */}
            <div className="lg:col-span-8 flex flex-col items-center">
              
              {/* Simulator Header hints */}
              <div className={`mb-4 p-4 rounded-3xl max-w-lg w-full text-left flex items-start space-x-3 shadow-inner ${theme === 'dark' ? 'bg-indigo-950/40 border border-indigo-900/40 text-indigo-200' : 'bg-indigo-50 border border-indigo-100 text-indigo-800'}`}>
                <span className="text-xl">💡</span>
                <p className="text-xs font-medium leading-relaxed">
                  <strong>Sandbox Hint:</strong> You can interact with the smartphone simulator natively! Toggle sound switches, tap navigation buttons, edit username, choose avatar, or spin the interactive bottle!
                </p>
              </div>

              <PhoneSimulator
                currentScreen={currentScreen}
                setCurrentScreen={setCurrentScreen}
                profile={profile}
                setProfile={setProfile}
                settings={settings}
                setSettings={setSettings}
                favorites={favorites}
                setFavorites={setFavorites}
                notifications={notifications}
                setNotifications={setNotifications}
                onShowNotificationBanner={triggerToast}
                theme={theme}
              />
            </div>
          </div>
        )}
      </main>

      {/* Premium Footer from Vibrant Palette */}
      <footer className={`max-w-7xl w-full mx-auto mt-8 p-6 flex flex-col md:flex-row justify-between items-center transition-colors duration-300 border-t gap-4 ${theme === 'dark' ? 'bg-[#1E293B] border-slate-800 text-white' : 'bg-white border-gray-100 text-[#2D3436]'}`}>
        <div className="flex gap-8">
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Version</span>
            <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-[#2D3436]'}`}>1.0.4-beta</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Accessibility</span>
            <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-[#2D3436]'}`}>AAA Rated</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <span className="text-xs text-gray-400 font-medium italic">Design built with precision for children 5-12</span>
          <div className={`hidden md:block w-px h-6 ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
          <span className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-[#2D3436]'}`}>© 2026 PlayZone Games</span>
        </div>
      </footer>
    </div>
  );
}
