/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScreenId, UserProfile, AppSettings } from './types';
import { InteractiveScreens } from './components/InteractiveScreens';
import SoundEngine from './utils/audio';

export default function App() {
  // Global States
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('playzone-theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('playzone-theme', theme);
  }, [theme]);

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
    language: 'English',
    landscapeMode: false
  });

  // Configure Sound Engine
  useEffect(() => {
    SoundEngine.configure(settings.soundEnabled, settings.musicEnabled);
  }, [settings.soundEnabled, settings.musicEnabled]);

  // Audio setup on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      SoundEngine.play('popup_open');
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Toast banner state
  const [toast, setToast] = useState<{ title: string; message: string; show: boolean }>({
    title: '',
    message: '',
    show: false
  });

  const triggerToast = (title: string, message: string) => {
    setToast({ title, message, show: true });
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

  // Haptic feedback listener to shake the device chassis visually
  const [vibrationClass, setVibrationClass] = useState('');

  useEffect(() => {
    const handleVibrate = (e: Event) => {
      if (!settings.vibrationEnabled) return;
      const customEvent = e as CustomEvent<{ intensity: 'light' | 'medium' | 'heavy' | 'tick' }>;
      const intensity = customEvent.detail?.intensity || 'medium';
      
      const cls = `animate-vibrate-${intensity}`;
      setVibrationClass('');
      requestAnimationFrame(() => {
        setVibrationClass(cls);
      });
    };

    window.addEventListener('phone-vibrate', handleVibrate);
    return () => {
      window.removeEventListener('phone-vibrate', handleVibrate);
    };
  }, [settings.vibrationEnabled]);

  useEffect(() => {
    if (vibrationClass) {
      const duration = vibrationClass.includes('heavy') ? 350 : vibrationClass.includes('medium') ? 250 : vibrationClass.includes('light') ? 150 : 80;
      const timer = setTimeout(() => {
        setVibrationClass('');
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [vibrationClass]);

  return (
    <div
      id="app-root-container"
      className={`min-h-screen w-full flex items-center justify-center font-sans antialiased selection:bg-[#6C5CE7] selection:text-white transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#0F172A] text-slate-100' : 'bg-slate-100 bg-gradient-to-br from-[#6C5CE7]/5 via-white to-[#FF7675]/5 text-[#2D3436]'
      }`}
    >
      {/* Centered Device Chassis on Desktop, Full-Screen on Mobile */}
      <div
        id="app-phone-container"
        className={`w-full h-screen md:max-w-6xl md:max-h-[92vh] md:my-6 md:rounded-[36px] md:shadow-2xl overflow-hidden relative border-0 md:border-[6px] ${
          theme === 'dark'
            ? 'bg-slate-900 md:border-slate-800 shadow-[#030712]/80'
            : 'bg-white md:border-slate-350 shadow-2xl shadow-slate-300'
        } transition-all duration-300 flex flex-col`}
      >
        {/* Dynamic Slide-in Toast Banner inside the App View */}
        {toast.show && (
          <div className="absolute top-4 left-4 right-4 bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-xl z-50 flex items-center space-x-3 border border-slate-800 animate-slide-in">
            <span className="text-lg">✨</span>
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

        {/* PlayZone Web App viewport */}
        <div className={`flex-1 relative overflow-hidden flex flex-col transition-all duration-500 origin-center ${
          settings.landscapeMode ? 'rotate-90 scale-95 md:scale-90' : ''
        }`}>
          <InteractiveScreens
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
            onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          />
        </div>
      </div>
    </div>
  );
}
