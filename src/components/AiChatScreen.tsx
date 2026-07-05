import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  Settings,
  X,
  ArrowLeft,
  Copy,
  RotateCcw,
  Sparkles,
  Shield,
  Square,
  Check,
  CheckCircle,
  Sliders,
  Send,
  Keyboard,
  Bot,
  Info,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerVibration } from '../utils/vibration';
import SoundEngine from '../utils/audio';

interface AiChatScreenProps {
  onBack: () => void;
  theme: 'light' | 'dark';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AiChatScreen: React.FC<AiChatScreenProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';

  // State managers
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamText, setCurrentStreamText] = useState('');
  const [activeMode, setActiveMode] = useState<'chat' | 'voice'>('chat');
  
  // Voice & Interaction states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSubtitles, setVoiceSubtitles] = useState('');
  const [consentAccepted, setConsentAccepted] = useState<boolean>(() => {
    return localStorage.getItem('playzone-ai-consent') === 'true';
  });

  // Settings
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    return localStorage.getItem('playzone-ai-voice-enabled') !== 'false';
  });
  const [micAccessGranted, setMicAccessGranted] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState<number>(() => {
    return parseFloat(localStorage.getItem('playzone-ai-speech-speed') || '1.0');
  });
  const [enableSubtitles, setEnableSubtitles] = useState<boolean>(() => {
    return localStorage.getItem('playzone-ai-subtitles-enabled') !== 'false';
  });
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('playzone-ai-sounds-enabled') !== 'false';
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // References
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // System instruction for Pixel's child-safe companion persona
  const SYSTEM_INSTRUCTION = `You are "Pixel", a super friendly, encouraging, and intelligent companion inside PlayZone, a premium mini-games hub for kids and families.
Your personality is warm, playful, calm, and positive. You speak in a highly expressive, conversational, and caring tone.
Since many users are children:
1. Always keep explanations simple, clear, creative, and completely age-appropriate.
2. Refuse and filter any inappropriate, violent, explicit, unsafe, or dangerous requests politely and encourage them to do safe, creative activities.
3. Keep responses relatively brief and conversational (especially for voice mode) so it's easy to read or listen to.
4. You can tell jokes, generate riddles, help with homework, explain complex things in fun ways, give gaming tips (for Ludo, Tic-Tac-Toe, and Snake), and recommend playing specific PlayZone games based on their mood!
5. Play fun, interactive text-based games (like trivia, 20 questions, roleplay, or sentence-by-sentence storytelling) when requested.
6. Be patient, respectful, and highly encouraging. Celebrate their achievements!`;

  // Play micro sound effect
  const playAiSound = (type: 'beep_in' | 'beep_out' | 'pop' | 'type') => {
    if (!soundEffectsEnabled) return;
    try {
      if (type === 'beep_in') SoundEngine.play('toggle_on');
      else if (type === 'beep_out') SoundEngine.play('back');
      else if (type === 'pop') SoundEngine.play('coin');
      else if (type === 'type') SoundEngine.play('click');
    } catch (e) {
      console.warn("AI sound error:", e);
    }
  };

  // Keep scroll at bottom of chat history
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamText]);

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('playzone-ai-messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved AI messages:", e);
      }
    } else {
      // Welcome message
      const welcome: Message = {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm Pixel, your friendly AI companion! 🌟 We can chat, play games, tell riddles, or help you learn anything. What would you like to do today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcome]);
    }
  }, []);

  // Save messages to localStorage
  const saveMessages = (newMsgs: Message[]) => {
    setMessages(newMsgs);
    localStorage.setItem('playzone-ai-messages', JSON.stringify(newMsgs));
  };

  // Web Speech: SpeechSynthesis setup (warm natural female voice)
  const speakText = (text: string) => {
    if (!voiceEnabled) return;

    // Stop previous speaking
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setVoiceSubtitles('');

    // Setup utterance
    const utterance = new SpeechSynthesisUtterance(text);
    synthesisUtteranceRef.current = utterance;
    
    // Choose voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      return lang.startsWith('en') && (
        name.includes('female') ||
        name.includes('google') ||
        name.includes('zira') ||
        name.includes('samantha') ||
        name.includes('karen') ||
        name.includes('hazel')
      );
    }) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    utterance.rate = speechSpeed;
    utterance.pitch = 1.1; // Slightly higher pitch for a friendly child-like sparkle

    utterance.onboundary = (event) => {
      if (event.name === 'word' && enableSubtitles) {
        // Simple incremental subtitle display based on words
        const words = text.split(' ');
        const charsEstimate = text.substring(0, event.charIndex).split(' ').length;
        const currentSub = words.slice(Math.max(0, charsEstimate - 4), charsEstimate + 3).join(' ');
        setVoiceSubtitles(currentSub || text);
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setVoiceSubtitles('');
      // If voice conversation mode is continuous, automatically start listening again
      if (activeMode === 'voice') {
        startSpeechRecognition();
      }
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      setIsSpeaking(false);
      setVoiceSubtitles('');
      if (activeMode === 'voice') {
        startSpeechRecognition();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Web Speech: SpeechRecognition setup (Continuous voice dialogue)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setMicAccessGranted(true);
        playAiSound('beep_in');
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          handleSendMessage(transcript.trim());
        }
      };

      rec.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setMicAccessGranted(false);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis.cancel();
    };
  }, [activeMode, voiceEnabled, speechSpeed, enableSubtitles]);

  const startSpeechRecognition = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Recognition already started or error:", e);
      }
    } else {
      onShowWarning("Voice recognition is not supported in this browser.");
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    playAiSound('beep_out');
  };

  // Display toast warning if API issues occur
  const onShowWarning = (msg: string) => {
    triggerVibration('heavy');
    // We can show a visual temporary toast alert
    const toast = document.createElement('div');
    toast.className = "absolute top-20 left-1/2 transform -translate-x-1/2 bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg z-50 animate-bounce";
    toast.innerText = msg;
    document.getElementById('ai-chat-screen')?.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  };

  // Clear chat history
  const clearHistory = () => {
    const welcome: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm Pixel, your friendly AI companion! 🌟 We can chat, play games, tell riddles, or help you learn anything. What would you like to do today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    saveMessages([welcome]);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    playAiSound('pop');
  };

  // Toggle Voice Mode vs Keyboard Mode
  useEffect(() => {
    if (activeMode === 'voice') {
      // Start listening automatically on voice screen
      setTimeout(() => {
        startSpeechRecognition();
      }, 300);
    } else {
      stopSpeechRecognition();
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [activeMode]);

  // Stop Generation
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setCurrentStreamText('');
    playAiSound('beep_out');
  };

  // Send Message to Gemini server endpoint (Proxied for privacy security)
  const handleSendMessage = async (textToSend: string, isRegenerate = false) => {
    if (!textToSend.trim() && !isRegenerate) return;
    
    // Stop speaking if talking
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    let updatedHistory = [...messages];

    if (!isRegenerate) {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updatedHistory.push(userMsg);
      saveMessages(updatedHistory);
      setInputMessage('');
    }

    setIsStreaming(true);
    setCurrentStreamText('');

    // Prepare history payload for server side
    const payloadHistory = updatedHistory.map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      abortControllerRef.current = new AbortController();

      // Initiate SSE request to server-side Gemini Proxy
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: payloadHistory,
          systemInstruction: SYSTEM_INSTRUCTION
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamAccumulator = "";

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.substring(6).trim();
              if (dataStr === "[DONE]") {
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  streamAccumulator += parsed.text;
                  setCurrentStreamText(streamAccumulator);
                  
                  // Trigger small typing click sound
                  if (Math.random() < 0.15) playAiSound('type');
                }
              } catch (e: any) {
                // If it's a parsing error of custom payload, ignore or handle
                if (e.message.includes("Unexpected token")) continue;
                throw e;
              }
            }
          }
        }
      }

      // Add finalized streaming response to chat history
      if (streamAccumulator.trim()) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: streamAccumulator.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const finalizedList = [...updatedHistory, aiMsg];
        saveMessages(finalizedList);

        // Auto speak response if voice is enabled or in voice mode
        if (voiceEnabled || activeMode === 'voice') {
          speakText(streamAccumulator.trim());
        }
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Gemini generation aborted successfully.");
      } else {
        console.error("Gemini API stream failure:", err);
        onShowWarning("Network glitch! Let's try saying that again.");
      }
    } finally {
      setIsStreaming(false);
      setCurrentStreamText('');
      abortControllerRef.current = null;
    }
  };

  // Re-generate response
  const handleRegenerate = () => {
    if (messages.length < 2) return;
    // Find the last user message to regenerate from
    const lastUserMsgIdx = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserMsgIdx !== -1) {
      const realIdx = messages.length - 1 - lastUserMsgIdx;
      const textToUse = messages[realIdx].content;
      // Slice out any messages following that user input
      const slicedHistory = messages.slice(0, realIdx + 1);
      setMessages(slicedHistory);
      handleSendMessage(textToUse, true);
    }
  };

  // Copy message to Clipboard
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerVibration('tick');
    playAiSound('pop');
    // Flash dynamic toast
    const copyAlert = document.createElement('div');
    copyAlert.className = "fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-50 animate-bounce";
    copyAlert.innerText = "📋 Text Copied!";
    document.getElementById('ai-chat-screen')?.appendChild(copyAlert);
    setTimeout(() => copyAlert.remove(), 1500);
  };

  // Consent Screen acceptance
  const acceptConsent = () => {
    localStorage.setItem('playzone-ai-consent', 'true');
    setConsentAccepted(true);
    triggerVibration('medium');
    playAiSound('pop');
  };

  // Settings persistence toggles
  const handleToggleVoice = () => {
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    localStorage.setItem('playzone-ai-voice-enabled', String(newVal));
    if (!newVal) window.speechSynthesis.cancel();
    playAiSound('pop');
  };

  const handleToggleSubtitles = () => {
    const newVal = !enableSubtitles;
    setEnableSubtitles(newVal);
    localStorage.setItem('playzone-ai-subtitles-enabled', String(newVal));
    playAiSound('pop');
  };

  const handleToggleSounds = () => {
    const newVal = !soundEffectsEnabled;
    setSoundEffectsEnabled(newVal);
    localStorage.setItem('playzone-ai-sounds-enabled', String(newVal));
    playAiSound('pop');
  };

  const handleChangeSpeed = (speed: number) => {
    setSpeechSpeed(speed);
    localStorage.setItem('playzone-ai-speech-speed', String(speed));
    playAiSound('pop');
  };

  // Pre-configured suggestions to trigger funny dialogues
  const SUGGESTED_PROMPTS = [
    { label: "Tell a funny joke! 😆", text: "Tell me a super funny joke appropriate for kids." },
    { label: "Give me a riddle! 🧩", text: "Create an exciting riddle and let me guess the answer!" },
    { label: "Homework help! 📚", text: "Explain how solar eclipses work in a super simple, fun way." },
    { label: "Recommend a game! 🎮", text: "Which PlayZone game should I play today? Tell me why!" }
  ];

  return (
    <div
      id="ai-chat-screen"
      className={`absolute inset-0 flex flex-col z-40 overflow-hidden select-none transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-[#2D3436]'
      }`}
    >
      {/* 1. Privacy Consent Overlay */}
      <AnimatePresence>
        {!consentAccepted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border text-center relative overflow-hidden ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
              }`}
            >
              {/* Fun playful absolute glowing orb background */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#6C5CE7]/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl" />

              <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-[#6C5CE7] to-[#FF7675] rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-[#6C5CE7]/20 mb-4 animate-pulse">
                <Bot size={32} />
              </div>

              <h3 className="text-lg font-black tracking-tight mb-2">Meet Pixel, Your AI Bestie! 🤖✨</h3>
              <p className={`text-xs leading-relaxed mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Pixel is a friendly, creative, and safe AI companion. To keep our conversations fun and secure:
              </p>

              <div className={`space-y-3 text-left text-[11px] font-bold p-4 rounded-2xl border mb-6 ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="flex items-start space-x-3">
                  <Shield size={16} className="text-[#6C5CE7] shrink-0 mt-0.5" />
                  <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                    AI-powered: Responses are synthesized automatically.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                    Privacy Guard: Never share passwords, bank accounts, cards, or other sensitive details.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                    Safe Space: Our chat is fully moderated and kept 100% kid-safe.
                  </p>
                </div>
              </div>

              <button
                onClick={acceptConsent}
                className="w-full bg-gradient-to-r from-[#6C5CE7] to-[#8C7AE6] hover:from-[#5b4cc4] hover:to-[#7966cf] text-white text-xs font-black py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                Let's Chat! 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main App Header */}
      <div className={`px-4 pt-3 pb-3 border-b flex items-center justify-between shrink-0 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-100 active:bg-slate-100'
            }`}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-xs">Pixel AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className={`text-[9px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Friendly Companion</p>
          </div>
        </div>

        {/* Header Interactions */}
        <div className="flex items-center space-x-2">
          {/* Mode Switcher pill */}
          <div className={`flex items-center rounded-full p-1 border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveMode('chat')}
              className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center space-x-1 transition-all ${
                activeMode === 'chat'
                  ? 'bg-gradient-to-r from-[#6C5CE7] to-[#8C7AE6] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Keyboard size={12} />
              <span>Keyboard</span>
            </button>
            <button
              onClick={() => {
                setActiveMode('voice');
                triggerVibration('tick');
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center space-x-1 transition-all ${
                activeMode === 'voice'
                  ? 'bg-gradient-to-r from-[#6C5CE7] to-[#8C7AE6] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Mic size={12} />
              <span>Voice</span>
            </button>
          </div>

          {/* AI Settings trigger */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-100 text-slate-500 active:bg-slate-100'
            }`}
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* 3. Screen View Renderer */}
      <div className="flex-1 overflow-hidden flex flex-col relative">

        {/* CHAT MODE VIEW */}
        {activeMode === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable conversation thread */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-pink-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                        <Bot size={14} />
                      </div>
                    )}
                    <div>
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm font-bold border ${
                        msg.role === 'user'
                          ? 'bg-[#6C5CE7] border-[#5b4cc4] text-white rounded-tr-none'
                          : isDark
                            ? 'bg-slate-900 border-slate-800 text-slate-100 rounded-tl-none'
                            : 'bg-white border-slate-150 text-[#2D3436] rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>

                      {/* Toolbars for messages */}
                      <div className={`flex items-center space-x-2 mt-1.5 px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[8px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{msg.timestamp}</span>
                        {msg.role === 'assistant' && (
                          <>
                            <button
                              onClick={() => handleCopyText(msg.content)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Copy response"
                            >
                              <Copy size={11} />
                            </button>
                            <button
                              onClick={() => speakText(msg.content)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Listen aloud"
                            >
                              <Volume2 size={11} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Streaming state bubble */}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2 max-w-[85%]">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-pink-500 flex items-center justify-center text-white shrink-0 mt-0.5 animate-pulse">
                      <Bot size={14} />
                    </div>
                    <div>
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm font-bold border rounded-tl-none ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-150 text-[#2D3436]'
                      }`}>
                        {currentStreamText || (
                          <div className="flex items-center space-x-1.5 py-1 px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <button
                          onClick={stopGeneration}
                          className="text-rose-500 hover:text-rose-600 text-[9px] font-black flex items-center space-x-1 border border-rose-500/20 px-2 py-0.5 rounded-full bg-rose-500/5 cursor-pointer"
                        >
                          <Square size={8} className="fill-rose-500" />
                          <span>Stop Generation</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Helper Suggestion Prompts */}
            {messages.length <= 1 && !isStreaming && (
              <div className="px-4 py-2 flex items-center space-x-2 overflow-x-auto shrink-0 scrollbar-none pb-4">
                {SUGGESTED_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.text)}
                    className={`shrink-0 px-3 py-2 rounded-2xl text-[10px] font-black border cursor-pointer transition-all active:scale-95 ${
                      isDark 
                        ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' 
                        : 'bg-white border-slate-150 text-slate-600 hover:border-[#6C5CE7]/40 active:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Chat bottom typing input container */}
            <div className={`p-3 border-t shrink-0 flex items-center space-x-2 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <div className={`flex-1 rounded-2xl border flex items-center px-3 py-1.5 transition-all ${
                isDark ? 'bg-slate-950 border-slate-800 focus-within:border-[#6C5CE7]' : 'bg-slate-50 border-slate-150 focus-within:border-[#6C5CE7]'
              }`}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage(inputMessage);
                  }}
                  disabled={isStreaming}
                  placeholder="Ask Pixel anything..."
                  className={`bg-transparent text-xs w-full focus:outline-none py-1 font-bold ${
                    isDark ? 'text-slate-100' : 'text-slate-800'
                  }`}
                />
                
                {messages.length > 1 && !isStreaming && (
                  <button
                    onClick={handleRegenerate}
                    className="text-slate-400 hover:text-[#6C5CE7] p-1.5 rounded-full shrink-0"
                    title="Regenerate last response"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>

              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isStreaming}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-md ${
                  inputMessage.trim() && !isStreaming
                    ? 'bg-gradient-to-r from-[#6C5CE7] to-[#8C7AE6] text-white shadow-[#6C5CE7]/20 active:scale-95'
                    : 'bg-slate-200 text-slate-400 border border-transparent dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        {/* VOICE CONVERSATION MODE VIEW */}
        {activeMode === 'voice' && (
          <div className="flex-1 flex flex-col justify-between p-6">
            
            {/* Top status info indicator */}
            <div className="text-center">
              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                isListening
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : isSpeaking
                    ? 'bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20'
                    : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
              }`}>
                {isListening ? 'Listening...' : isSpeaking ? 'Pixel is Speaking...' : 'Tap Mic to Start'}
              </span>
            </div>

            {/* Central glowing interaction ORB / Animated Avatar */}
            <div className="my-auto flex flex-col items-center justify-center relative">
              
              {/* Pulsing halos behind orb */}
              <div className={`absolute w-44 h-44 rounded-full blur-3xl opacity-30 transition-all duration-1000 ${
                isListening 
                  ? 'bg-emerald-400 scale-125 animate-pulse'
                  : isSpeaking 
                    ? 'bg-[#6C5CE7] scale-110'
                    : isStreaming 
                      ? 'bg-amber-400 animate-spin'
                      : 'bg-[#6C5CE7]/60'
              }`} />

              <div className={`absolute w-32 h-32 rounded-full blur-2xl opacity-40 transition-all duration-1000 ${
                isListening 
                  ? 'bg-emerald-500 scale-110 animate-ping'
                  : isSpeaking 
                    ? 'bg-pink-500 scale-125'
                    : isStreaming 
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-pink-500/60'
              }`} />

              {/* The main interactive AI Orb container */}
              <button
                onClick={() => {
                  triggerVibration('medium');
                  if (isListening) {
                    stopSpeechRecognition();
                  } else {
                    startSpeechRecognition();
                  }
                }}
                className={`w-28 h-28 rounded-full bg-gradient-to-tr from-[#6C5CE7] via-[#8C7AE6] to-pink-500 flex items-center justify-center text-white relative z-10 shadow-2xl transition-all active:scale-90 cursor-pointer ${
                  isListening
                    ? 'ring-4 ring-emerald-500/40 border-4 border-white'
                    : isSpeaking
                      ? 'ring-4 ring-pink-500/40 border-4 border-white'
                      : 'border-2 border-white/20'
                }`}
              >
                {/* Visual state renderer inside orb */}
                <AnimatePresence mode="wait">
                  {isListening ? (
                    <motion.div
                      key="listening"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                      className="flex flex-col items-center justify-center text-center"
                    >
                      <Mic size={28} className="animate-bounce" />
                      <span className="text-[7px] font-black tracking-widest uppercase mt-1">Talk Now</span>
                    </motion.div>
                  ) : isSpeaking ? (
                    <motion.div
                      key="speaking"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                      className="flex items-center space-x-0.5 justify-center py-4"
                    >
                      {/* Animated audio speech waveform bars */}
                      <span className="w-1 h-6 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-9 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                      <span className="w-1 h-8 bg-white rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                      <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
                    </motion.div>
                  ) : isStreaming ? (
                    <motion.div
                      key="thinking"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    >
                      <Sparkles size={28} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                      className="flex flex-col items-center justify-center text-center"
                    >
                      <Bot size={32} />
                      <span className="text-[7px] font-black tracking-widest uppercase mt-1">Tap To Speak</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* Dynamic waveform visualizer bars below orb */}
              {isListening && (
                <div className="flex items-center space-x-1.5 justify-center mt-8 relative z-10">
                  <span className="w-1.5 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-6 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                  <span className="w-1.5 h-8 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  <span className="w-1.5 h-5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-1.5 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
              )}

              {/* User transcript / Subtitle caption overlay */}
              {enableSubtitles && (voiceSubtitles || isListening) && (
                <div className={`mt-8 px-6 py-3 rounded-2xl border text-center max-w-sm z-10 shadow-sm animate-fade-in ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-150 text-slate-600'
                }`}>
                  <p className="text-[10px] font-bold tracking-wider text-[#6C5CE7] mb-0.5 uppercase">
                    {isSpeaking ? 'Pixel Says:' : isListening ? 'Your Voice:' : ''}
                  </p>
                  <p className="text-xs font-black italic leading-relaxed">
                    {isSpeaking ? voiceSubtitles : isListening ? "Speak naturally now... I'm listening!" : ""}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom controls panel */}
            <div className="flex items-center justify-around shrink-0 relative z-10">
              <button
                onClick={() => {
                  triggerVibration('light');
                  setActiveMode('chat');
                }}
                className={`w-12 h-12 rounded-full border flex items-center justify-center cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-150 text-slate-500'
                }`}
                title="Switch to Keyboard Chat"
              >
                <Keyboard size={18} />
              </button>

              <button
                onClick={() => {
                  triggerVibration('medium');
                  if (isListening) stopSpeechRecognition();
                  else startSpeechRecognition();
                }}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                    : 'bg-gradient-to-r from-[#6C5CE7] to-[#8C7AE6] hover:from-[#5b4cc4] hover:to-[#7966cf] shadow-[#6C5CE7]/20'
                }`}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <button
                onClick={handleToggleVoice}
                className={`w-12 h-12 rounded-full border flex items-center justify-center cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-150'
                } ${voiceEnabled ? 'text-emerald-500' : 'text-slate-400'}`}
                title={voiceEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
              >
                {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>

          </div>
        )}

      </div>

      {/* 4. AI Settings Modal panel */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              className={`w-full max-w-lg rounded-t-3xl p-5 border-t shadow-2xl relative ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-150 text-[#2D3436]'
              }`}
            >
              {/* Drag handles style */}
              <div className="w-12 h-1 px-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4">
                <h4 className="font-black text-sm flex items-center space-x-2">
                  <Sliders size={16} className="text-[#6C5CE7]" />
                  <span>Pixel Companion Settings</span>
                </h4>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center border cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Settings Rows */}
              <div className="space-y-4">
                
                {/* Voice toggle */}
                <div className="flex items-center justify-between py-2 border-b dark:border-slate-800">
                  <div>
                    <p className="text-xs font-black">Enable AI Voice Responses</p>
                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Pixel will speak all her responses aloud.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleVoice}
                    className={`w-10 h-6 rounded-full p-1 transition-all cursor-pointer ${
                      voiceEnabled ? 'bg-emerald-500 flex justify-end' : 'bg-slate-300 dark:bg-slate-800 flex justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* Speech rate slider */}
                {voiceEnabled && (
                  <div className="py-2 border-b dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-black">AI Speech Speed</p>
                      <span className="text-[10px] font-bold font-mono text-[#6C5CE7]">{speechSpeed}x</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-[9px] text-slate-400">Slower</span>
                      <input
                        type="range"
                        min="0.6"
                        max="1.8"
                        step="0.2"
                        value={speechSpeed}
                        onChange={(e) => handleChangeSpeed(parseFloat(e.target.value))}
                        className="flex-1 accent-[#6C5CE7] cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-400">Faster</span>
                    </div>
                  </div>
                )}

                {/* Subtitles Toggle */}
                <div className="flex items-center justify-between py-2 border-b dark:border-slate-800">
                  <div>
                    <p className="text-xs font-black">Enable Subtitles & Captions</p>
                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Display spoken words as subtitles during voice chats.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleSubtitles}
                    className={`w-10 h-6 rounded-full p-1 transition-all cursor-pointer ${
                      enableSubtitles ? 'bg-emerald-500 flex justify-end' : 'bg-slate-300 dark:bg-slate-800 flex justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* AI Sound Effects */}
                <div className="flex items-center justify-between py-2 border-b dark:border-slate-800">
                  <div>
                    <p className="text-xs font-black">Interaction Sound Effects</p>
                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Play playful chirps and indicators.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleSounds}
                    className={`w-10 h-6 rounded-full p-1 transition-all cursor-pointer ${
                      soundEffectsEnabled ? 'bg-emerald-500 flex justify-end' : 'bg-slate-300 dark:bg-slate-800 flex justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* Clear conversations button */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-black text-rose-500">Reset Conversation History</p>
                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Wipes history from storage to start fresh.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      triggerVibration('medium');
                      clearHistory();
                      setShowSettingsModal(false);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-[10px] font-black flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Clear All</span>
                  </button>
                </div>

              </div>

              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full mt-6 bg-[#6C5CE7] hover:bg-[#5b4cc4] text-white text-xs font-black py-3 rounded-2xl active:scale-95 transition-all cursor-pointer"
              >
                Apply & Save Settings
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
