/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone } from 'lucide-react';
import { ScreenId, UserProfile, AppSettings } from '../types';
import { InteractiveScreens } from './InteractiveScreens';

interface PhoneSimulatorProps {
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  favorites: string[];
  setFavorites: React.Dispatch<React.SetStateAction<string[]>>;
  notifications: Array<{ id: string; title: string; body: string; time: string; read: boolean }>;
  setNotifications: React.Dispatch<React.SetStateAction<Array<{ id: string; title: string; body: string; time: string; read: boolean }>>>;
  isParentUnlocked: boolean;
  setIsParentUnlocked: (unlocked: boolean) => void;
  onShowNotificationBanner: (title: string, message: string) => void;
  theme?: 'light' | 'dark';
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  currentScreen,
  setCurrentScreen,
  profile,
  setProfile,
  settings,
  setSettings,
  favorites,
  setFavorites,
  notifications,
  setNotifications,
  isParentUnlocked,
  setIsParentUnlocked,
  onShowNotificationBanner,
  theme = 'light',
}) => {
  const [currentTime, setCurrentTime] = useState('09:41');

  // Realistic live battery state and time updating in simulator
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${mins} ${ampm}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div id="phone-container-wrapper" className="flex flex-col items-center justify-center p-2">
      {/* Premium Flat Handset Frame - Vibrant Palette Theme */}
      <div id="smartphone-chassis" className={`relative w-[340px] h-[680px] rounded-[40px] flex flex-col transition-all duration-300 transform select-none hover:shadow-2xl ${isDark ? 'bg-slate-900 border-[8px] border-slate-700 shadow-[#030712]/80' : 'bg-white border-[8px] border-[#2D3436] shadow-xl'}`}>
        
        {/* Smartphone Screen Inner Frame */}
        <div id="smartphone-screen-body" className={`relative flex-1 rounded-[30px] overflow-hidden flex flex-col border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-900/10'}`}>
          
          {/* Subtle speaker line in header to keep look refined */}
          <div className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full z-40 opacity-30 ${isDark ? 'bg-slate-400' : 'bg-slate-800'}`} />

          {/* Phone Status Bar */}
          <div className={`h-8 px-5 pt-1.5 flex items-center justify-between z-30 shrink-0 ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}`}>
            {/* Status Time */}
            <span className="text-[10px] font-black tracking-tight font-sans">{currentTime}</span>
            
            {/* Status Icons */}
            <div className="flex items-center space-x-1.5">
              {/* Cellular Signal Bars */}
              <div className="flex items-end space-x-0.5 h-2.5">
                <span className={`w-0.5 h-1 rounded-full ${isDark ? 'bg-slate-200' : 'bg-slate-800'}`} />
                <span className={`w-0.5 h-1.5 rounded-full ${isDark ? 'bg-slate-200' : 'bg-slate-800'}`} />
                <span className={`w-0.5 h-2 rounded-full ${isDark ? 'bg-slate-200' : 'bg-slate-800'}`} />
                <span className={`w-0.5 h-2.5 rounded-full ${isDark ? 'bg-slate-200' : 'bg-slate-800'}`} />
              </div>
              <Wifi size={10} className="stroke-[3]" />
              <Battery size={13} className="stroke-[2.5]" />
            </div>
          </div>

          {/* Interactive Screen viewport */}
          <div className={`flex-1 relative overflow-hidden flex flex-col ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
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
              isParentUnlocked={isParentUnlocked}
              setIsParentUnlocked={setIsParentUnlocked}
              onShowNotificationBanner={onShowNotificationBanner}
              theme={theme}
            />
          </div>

          {/* Modern Home Swipe Indicator Pill */}
          <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full z-30 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
        </div>
      </div>
      
      {/* Mobile Spec Indicator */}
      <span className={`text-[10px] font-mono mt-3 uppercase tracking-wider flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        <Smartphone size={11} /> 1080x2400 IPS • Multi-touch Display
      </span>
    </div>
  );
};
