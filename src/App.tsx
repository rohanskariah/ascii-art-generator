import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Terminal,
  Download,
  Heart,
  Trash2,
  Search,
  Sliders,
  Cpu,
  Clock,
  Shuffle,
  FileDown
} from 'lucide-react';
import { AsciiStyle, CharacterType, AsciiArtItem } from './types';
import { STYLE_OPTIONS, CHARACTER_OPTIONS, PRESET_PHRASES, INITIAL_WELCOME_ART } from './data';
import { apiService, GenerateRequest } from './services/apiService';
import { downloadPNG } from './services/pngService';

export default function App() {
  // Input controls
  const [inputText, setInputText] = useState('ASCII ART');
  const [selectedStyle, setSelectedStyle] = useState<AsciiStyle>('block');
  const [selectedCharType, setSelectedCharType] = useState<CharacterType>('simple');
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Terminal Art Output State
  const [outputArt, setOutputArt] = useState<string>(INITIAL_WELCOME_ART);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Customization HUD
  const [themeColor, setThemeColor] = useState<'gold' | 'bronze' | 'rose' | 'silver'>('gold');
  const [customColor, setCustomColor] = useState<string>('#D4AF37');
  const [fontSize, setFontSize] = useState<'xs' | 'sm' | 'md' | 'lg'>('xs');
  const [wrapText, setWrapText] = useState<boolean>(false);
  const [centerText, setCenterText] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // History & Storage
  const [history, setHistory] = useState<AsciiArtItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterFavorites, setFilterFavorites] = useState<boolean>(false);

  // Clock
  const [currentTime, setCurrentTime] = useState<string>(new Date().toISOString().substring(11, 19));

  // Initialize Clock & LocalStorage
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString().substring(11, 19));
    }, 1000);

    const savedHistory = localStorage.getItem('ascii_art_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse saved ASCII art history');
      }
    }

    // Load custom color preference
    const savedColor = localStorage.getItem('custom_color');
    if (savedColor) {
      setCustomColor(savedColor);
    }

    return () => clearInterval(timer);
  }, []);

  // Save history to localStorage
  const saveHistoryToStorage = (updatedHistory: AsciiArtItem[]) => {
    setHistory(updatedHistory);
    localStorage.setItem('ascii_art_history', JSON.stringify(updatedHistory));
  };

  // Generate ASCII Art Action
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) {
      setErrorMessage('Please enter some text first!');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const request: GenerateRequest = {
        text: inputText.trim(),
        style: selectedStyle,
        characterType: selectedCharType,
        customPrompt: customPrompt.trim()
      };

      const data = await apiService.generateAscii(request);

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate ASCII art');
      }

      const generatedArt = data.ascii;
      setOutputArt(generatedArt);

      // Add to local history
      const newItem: AsciiArtItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        inputText: inputText.trim(),
        asciiArt: generatedArt,
        style: selectedStyle,
        characterType: selectedCharType,
        customPrompt: customPrompt.trim(),
        timestamp: Date.now(),
        isFavorite: false
      };

      saveHistoryToStorage([newItem, ...history]);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Connection lost. Ensure the development server is active.');
    } finally {
      setLoading(false);
    }
  };

  // Preset click generator
  const handlePresetClick = (phrase: string) => {
    setInputText(phrase);
  };

  // Select random phrase
  const handleRandomPreset = () => {
    const remaining = PRESET_PHRASES.filter(p => p !== inputText.toUpperCase());
    const randomSource = remaining.length > 0 ? remaining : PRESET_PHRASES;
    const randomPhrase = randomSource[Math.floor(Math.random() * randomSource.length)];
    setInputText(randomPhrase);
  };

  // Copy output to clipboard
  const handleCopy = () => {
    if (!outputArt || outputArt === INITIAL_WELCOME_ART) return;
    navigator.clipboard.writeText(outputArt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Download Output as text file
  const handleDownload = () => {
    if (!outputArt || outputArt === INITIAL_WELCOME_ART) return;
    const element = document.createElement('a');
    const file = new Blob([outputArt], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    const sanitizedName = inputText.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'ascii';
    const sanitizedPrompt = customPrompt.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
    const promptPart = sanitizedPrompt ? `_${sanitizedPrompt}` : '';
    element.download = `ascii_${sanitizedName}_${selectedStyle}_${selectedCharType}${promptPart}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Favorite toggle
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.map(item => {
      if (item.id === id) {
        return { ...item, isFavorite: !item.isFavorite };
      }
      return item;
    });
    saveHistoryToStorage(updated);
  };

  // Delete history item
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    saveHistoryToStorage(updated);
  };

  // Apply visual parameters from a historic card item
  const handleLoadHistoryItem = (item: AsciiArtItem) => {
    setInputText(item.inputText);
    setSelectedStyle(item.style);
    setSelectedCharType(item.characterType);
    setCustomPrompt(item.customPrompt || '');
    setOutputArt(item.asciiArt);
    setErrorMessage('');
  };

  // Clean whole Local History
  const clearAllHistory = () => {
    if (window.confirm('Delete all rendered history from local session storage?')) {
      saveHistoryToStorage([]);
    }
  };

  // Map theme variables
  const themeStyles = {
    gold: {
      text: 'text-[#D4AF37]',
      bgGlow: 'shadow-[#D4AF37]/5',
      border: 'border-[#D4AF37]/25 focus-within:border-[#D4AF37]',
      accentBg: 'bg-[#D4AF37]',
      accentText: 'text-[#D4AF37]',
      solidButton: 'bg-[#D4AF37] hover:bg-[#F3CD55] focus:ring-[#D4AF37] text-black font-bold tracking-wide transition-all duration-300 shadow-lg shadow-[#D4AF37]/10',
      lightBg: 'bg-[#D4AF37]/10',
      glowClass: 'terminal-glow-gold',
      iconColor: '#D4AF37',
    },
    bronze: {
      text: 'text-[#CD7F32]',
      bgGlow: 'shadow-[#CD7F32]/5',
      border: 'border-[#CD7F32]/25 focus-within:border-[#CD7F32]',
      accentBg: 'bg-[#CD7F32]',
      accentText: 'text-[#CD7F32]',
      solidButton: 'bg-[#CD7F32] hover:bg-[#E99645] focus:ring-[#CD7F32] text-black font-bold tracking-wide transition-all duration-300 shadow-lg shadow-[#CD7F32]/10',
      lightBg: 'bg-[#CD7F32]/10',
      glowClass: 'terminal-glow-bronze',
      iconColor: '#CD7F32',
    },
    rose: {
      text: 'text-[#E899A5]',
      bgGlow: 'shadow-[#B76E79]/5',
      border: 'border-[#B76E79]/25 focus-within:border-[#B76E79]',
      accentBg: 'bg-[#B76E79]',
      accentText: 'text-[#E899A5]',
      solidButton: 'bg-[#B76E79] hover:bg-[#CE838E] focus:ring-[#B76E79] text-black font-bold tracking-wide transition-all duration-300 shadow-lg shadow-[#B76E79]/10',
      lightBg: 'bg-[#B76E79]/10',
      glowClass: 'terminal-glow-rose',
      iconColor: '#B76E79',
    },
    silver: {
      text: 'text-[#CCCCCC]',
      bgGlow: 'shadow-zinc-400/5',
      border: 'border-zinc-700 focus-within:border-zinc-400',
      accentBg: 'bg-zinc-400',
      accentText: 'text-[#CCCCCC]',
      solidButton: 'bg-zinc-200 hover:bg-zinc-100 focus:ring-zinc-400 text-black font-bold tracking-wide transition-all duration-300 shadow-lg shadow-zinc-200/10',
      lightBg: 'bg-zinc-800/30',
      glowClass: 'terminal-glow-silver',
      iconColor: '#CCCCCC',
    },
    custom: {
      text: 'text-[custom]',
      bgGlow: 'shadow-[custom]/5',
      border: 'border-[custom]/25 focus-within:border-[custom]',
      accentBg: 'bg-[custom]',
      accentText: 'text-[custom]',
      solidButton: 'bg-[custom] hover:bg-[custom] focus:ring-[custom] text-black font-bold tracking-wide transition-all duration-300 shadow-lg shadow-[custom]/10',
      lightBg: 'bg-[custom]/10',
      glowClass: 'terminal-glow-custom',
      iconColor: 'custom',
    },
  };

  const activeTheme = themeStyles[themeColor];

  // Map size classes
  const sizeClasses = {
    xs: 'text-[9px] md:text-xs leading-[1.1]',
    sm: 'text-xs md:text-sm leading-[1.2]',
    md: 'text-sm md:text-base leading-normal',
    lg: 'text-base md:text-lg leading-relaxed',
  };

  // Filter lists based on target search
  const filteredHistory = history.filter(item => {
    const matchesSearch = item.inputText.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterFavorites) {
      return matchesSearch && item.isFavorite;
    }
    return matchesSearch;
  });


  return (
    <div className="min-h-screen bg-[#050505] text-[#E5E5E5] font-sans flex flex-col antialiased">
      {/* Visual background atmospheric gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_70%_30%,_#151515_0%,_#050505_100%)] z-0"></div>
      
      {/* Sophisticated Top HUD Bar */}
      <header className="relative z-40 border-b border-white/10 bg-black/85 backdrop-blur-md sticky top-0 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          {/* Logo with Serif Cormorant Elegance */}
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-2">
              <span className={`font-serif italic font-bold text-2.5xl tracking-normal ${activeTheme.text}`}>
                G-ASCII
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Composition No. 12</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>
            <p className="text-xs text-[#888888] font-light hidden sm:block">
              Powered by <span className="italic">Gemini AI</span>
            </p>
          </div>

          {/* Controls & Diagnostics HUD */}
          <div className="flex items-center gap-4 flex-wrap text-xs">
            {/* HUD theme chooser */}
            <div className="flex items-center gap-1.5 bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800">
              <span className="text-[10px] uppercase font-mono text-zinc-500 mr-1 pl-1">PALETTE:</span>
              {(['gold', 'bronze', 'rose', 'silver', 'custom'] as const).map(color => (
                <button
                  key={color}
                  id={`hud-theme-${color}`}
                  onClick={() => setThemeColor(color)}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    color === 'gold' ? 'bg-[#D4AF37] border-zinc-950 hover:scale-110' :
                    color === 'bronze' ? 'bg-[#CD7F32] border-zinc-950 hover:scale-110' :
                    color === 'rose' ? 'bg-[#B76E79] border-zinc-950 hover:scale-110' :
                    color === 'silver' ? 'bg-[#CCCCCC] border-zinc-950 hover:scale-110' :
                    'border-zinc-950 hover:scale-110'
                  } ${themeColor === color ? 'ring-2 ring-white scale-110' : 'opacity-65'}`}
                  style={color === 'custom' ? { backgroundColor: customColor } : undefined}
                  title={`${color} mode`}
                />
              ))}
              {themeColor === 'custom' && (
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    localStorage.setItem('custom_color', e.target.value);
                  }}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent ml-1"
                  title="Pick custom color"
                />
              )}
            </div>

            {/* Time stamp telemetry */}
            <div className="hidden md:flex items-center gap-2 bg-zinc-900/40 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 font-mono text-[11px]">
              <Clock size={12} className={activeTheme.text} />
              <span>UTC: {currentTime}</span>
            </div>

            {/* Online status indicator */}
            <div className="flex items-center gap-2 bg-zinc-900/40 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-zinc-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[11px]">API: READY</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* Left Side: Input control engine (Columns: 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          <form onSubmit={handleGenerate} className="relative z-10 bg-[#111111]/90 backdrop-blur-md border border-white/10 rounded pb-6 pt-5 px-6 shadow-2xl space-y-6">
            {/* Form Section Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Sliders size={14} className={activeTheme.text} />
                <h2 className="font-serif text-lg font-light tracking-wide text-[#E5E5E5]">Artistic Options</h2>
              </div>
              <button
                type="button"
                id="random-phrase-btn"
                onClick={handleRandomPreset}
                className="text-[10px] uppercase tracking-widest font-mono text-[#888888] hover:text-white transition flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded border border-white/10 hover:border-white/20"
                title="Input a stylish random phrase"
              >
                <Shuffle size={10} />
                <span>Random</span>
              </button>
            </div>

            {/* Core Text Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label htmlFor="input-string" className="text-[10px] uppercase tracking-widest text-[#888888] font-mono">Source Characters</label>
                <span className="text-[10px] font-mono text-zinc-600">{inputText.length}/25 characters</span>
              </div>
              <div className={`flex rounded border transition-all ${activeTheme.border} bg-black/50 p-0.5`}>
                <input
                  id="input-string"
                  type="text"
                  maxLength={25}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="EX: GEMINI"
                  className="w-full bg-transparent px-3.5 py-2.5 text-white font-serif tracking-normal text-base focus:outline-none placeholder-zinc-700"
                  required
                />
              </div>

              {/* Fast Presets Grid */}
              <div className="pt-2">
                <span className="text-[10px] text-[#888888] block mb-2 uppercase font-mono tracking-widest">Library Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_PHRASES.slice(0, 8).map(phrase => (
                    <button
                      key={phrase}
                      type="button"
                      id={`preset-btn-${phrase.replace(/\s+/g, '-')}`}
                      onClick={() => handlePresetClick(phrase)}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded transition border ${
                        inputText.toUpperCase() === phrase
                          ? `${activeTheme.lightBg} ${activeTheme.text} border-${activeTheme.accentText}/40`
                          : 'bg-black/20 text-[#888888] border-white/5 hover:bg-white/5 hover:text-[#E5E5E5]'
                      }`}
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Typography Styles Grid */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[#888888] font-mono block">Artistic Style</label>
              <div className="grid grid-cols-2 gap-2 max-h-[175px] overflow-y-auto pr-1">
                {STYLE_OPTIONS.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    id={`style-btn-${style.value}`}
                    onClick={() => setSelectedStyle(style.value)}
                    className={`p-3 rounded text-left transition-all ${
                      selectedStyle === style.value
                        ? `${activeTheme.lightBg} border border-${activeTheme.accentText}/40 relative overflow-hidden`
                        : 'bg-black/20 border border-white/5 hover:bg-black/40 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <span className={`text-[13px] font-medium font-serif ${selectedStyle === style.value ? 'text-white' : 'text-[#E5E5E5]'}`}>
                        {style.label}
                      </span>
                      {selectedStyle === style.value && (
                        <div className={`w-1.5 h-1.5 rounded-full ${activeTheme.accentBg}`}></div>
                      )}
                    </div>
                    <span className="text-[10px] text-[#888888] min-h-[30px] line-clamp-2 leading-tight">
                      {style.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Character Mapping Options */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[#888888] font-mono block">Mapping Complexity</label>
              <div className="grid grid-cols-1 gap-2">
                {CHARACTER_OPTIONS.map((char) => (
                  <button
                    key={char.value}
                    type="button"
                    id={`char-btn-${char.value}`}
                    onClick={() => setSelectedCharType(char.value)}
                    className={`flex items-center justify-between p-3 rounded border text-left transition ${
                      selectedCharType === char.value
                        ? `${activeTheme.lightBg} border-${activeTheme.accentText}/40`
                        : 'bg-black/20 border-white/5 hover:bg-black/40 hover:border-white/10'
                    }`}
                  >
                    <div>
                      <span className={`text-xs font-semibold block ${selectedCharType === char.value ? 'text-white' : 'text-[#E5E5E5]'}`}>
                        {char.label}
                      </span>
                      <span className="text-[10px] text-[#888888] leading-tight">
                        {char.description}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                      {char.value === 'simple' && '# / \\'}
                      {char.value === 'blocks' && '█ ▓ ▒'}
                      {char.value === 'classic' && '@ % $'}
                      {char.value === 'binary' && '0 1 0'}
                      {char.value === 'letters' && 'A B C'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom instruction / Prompt extensions */}
            <div className="space-y-2">
              <label htmlFor="custom-instructions" className="text-[10px] uppercase tracking-widest text-[#888888] font-mono block">
                Prompt modifiers (Optional)
              </label>
              <input
                id="custom-instructions"
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="E.g. use stars, stacked text, ultra thick borders..."
                className="w-full bg-[#0a0a0a] border border-white/5 px-3.5 py-2.5 text-xs rounded text-white focus:outline-none focus:border-[#D4AF37] placeholder-zinc-700 font-serif"
              />
            </div>

            {/* Action Trigger Button */}
            <button
              type="submit"
              id="generate-art-btn"
              disabled={loading || !inputText.trim()}
              className={`w-full py-4 px-4 rounded flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${activeTheme.solidButton} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="tracking-widest uppercase text-xs font-semibold">Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span className="tracking-widest uppercase text-xs font-semibold">Generate Art</span>
                </>
              )}
            </button>
          </form>

          {/* Diagnostic status alerts if needed */}
          {errorMessage && (
            <div id="diagnostic-error" className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-400 flex items-start gap-2">
              <div className="p-1 bg-red-500/20 rounded">
                <Cpu size={12} />
              </div>
              <div>
                <p className="font-semibold mb-0.5">API Processing Fault</p>
                <p className="opacity-80 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Monospace Viewer Terminal (Columns: 7) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Main Output terminal box */}
          <div className={`bg-[#111111]/90 backdrop-blur-md border border-white/10 rounded flex-1 flex flex-col overflow-hidden relative group transition-all duration-300 shadow-2xl ${activeTheme.bgGlow}`}>
            
            {/* Sophisticated Toolbar matching HTML mockup */}
            <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/30">
              <div>
                <h1 className="font-serif text-3xl font-light tracking-wide text-white leading-tight">
                  Composition: <span className="italic">{inputText ? `"${inputText}"` : 'Untitled'}</span>
                </h1>
                <p className="text-[10px] font-mono text-[#888888] uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/80"></span>
                  <span>Rendering Template: {selectedStyle} style / {selectedCharType} chars</span>
                </p>
              </div>

              {/* Utility buttons directly tied to active text with circle border designs */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="copy-terminal-btn"
                  onClick={handleCopy}
                  disabled={outputArt === INITIAL_WELCOME_ART}
                  className="px-4 py-2 text-xs font-mono rounded-full border border-white/10 bg-transparent text-[#E5E5E5] hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-[#E5E5E5] disabled:cursor-not-allowed transition duration-200"
                >
                  {copied ? (
                    <span className="text-emerald-400">Copied</span>
                  ) : (
                    <span>Copy to Clipboard</span>
                  )}
                </button>

                <button
                  type="button"
                  id="download-terminal-btn"
                  onClick={handleDownload}
                  disabled={outputArt === INITIAL_WELCOME_ART}
                  className="p-2 rounded-full border border-white/10 bg-transparent text-[#888888] hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Download Raw Artwork (.txt)"
                >
                  <Download size={14} />
                </button>

                <button
                  type="button"
                  id="download-png-terminal-btn"
                  onClick={() => { const n = inputText.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'ascii'; const p = customPrompt.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20); const pp = p ? `_${p}` : ''; downloadPNG(outputArt, `ascii_${n}_${selectedStyle}_${selectedCharType}${pp}.png`, themeColor === 'custom' ? customColor : activeTheme.iconColor); }}
                  disabled={outputArt === INITIAL_WELCOME_ART}
                  className="p-2 rounded-full border border-white/10 bg-transparent text-[#888888] hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Download as PNG with color support"
                >
                  <FileDown size={14} />
                </button>
              </div>
            </div>

            {/* Output HUD customization shelf in thin layout */}
            <div className="bg-black/20 border-b border-white/5 px-6 py-3 flex flex-wrap justify-between items-center gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-3">
                {/* Size Controls */}
                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded border border-white/5">
                  <span className="text-[10px] uppercase font-mono px-2 text-zinc-550">Scale:</span>
                  {(['xs', 'sm', 'md', 'lg'] as const).map(size => (
                    <button
                      key={size}
                      id={`font-size-${size}`}
                      onClick={() => setFontSize(size)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                        fontSize === size 
                          ? `${activeTheme.lightBg} ${activeTheme.text} font-bold` 
                          : 'hover:text-white'
                      }`}
                    >
                      {size.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Text Wrapping Toggle */}
                <button
                  type="button"
                  id="wrap-toggle"
                  onClick={() => setWrapText(!wrapText)}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded border flex items-center gap-1 ${
                    wrapText 
                      ? `${activeTheme.lightBg} ${activeTheme.text} border-${activeTheme.accentText}/20` 
                      : 'bg-black/40 border-white/5 hover:text-white'
                  }`}
                  title="Toggle visual word wrapping inside the preview window"
                >
                  <span>Wrap:</span>
                  <span className="font-bold">{wrapText ? 'ON' : 'OFF'}</span>
                </button>

                {/* Centering Alignment Toggle */}
                <button
                  type="button"
                  id="center-toggle"
                  onClick={() => setCenterText(!centerText)}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded border flex items-center gap-1 ${
                    centerText 
                      ? `${activeTheme.lightBg} ${activeTheme.text} border-${activeTheme.accentText}/20` 
                      : 'bg-black/40 border-white/5 hover:text-white'
                  }`}
                  title="Toggle centering of the ASCII artwork inside the viewer canvas"
                >
                  <span>Center:</span>
                  <span className="font-bold">{centerText ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Status information details */}
              <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-[#888888]">
                <span>Width: {outputArt ? outputArt.split('\n')[0]?.length || 0 : 0}px</span>
                <span>•</span>
                <span>Characters: {outputArt ? outputArt.length : 0}</span>
              </div>
            </div>

            {/* Monospace Code Display terminal layer */}
            <div className={`flex-1 p-6 sm:p-8 relative overflow-auto bg-[#0a0a0a] min-h-[350px] flex flex-col ${
              centerText ? 'items-center justify-center' : 'justify-start items-start'
            }`}>
              {loading && (
                <div id="terminal-loader" className="absolute inset-0 bg-[#050505]/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
                  <div className={`w-8 h-8 rounded-full border-2 border-t-transparent ${activeTheme.text} animate-spin`}></div>
                  <div className="text-center">
                    <p className="font-serif text-sm italic text-white tracking-wider mb-1">Synthesizing Artwork Matrix...</p>
                    <p className="text-[10px] font-mono text-[#888888] uppercase tracking-widest">Translating font template parameters</p>
                  </div>
                </div>
              )}

              {/* Real character art matrix */}
              <pre
                id="ascii-art-canvas-pre"
                className={`font-mono transition-all duration-350 select-text outline-none ${sizeClasses[fontSize]} ${
                  themeColor === 'custom' ? `text-[${customColor}]` : activeTheme.text
                } ${activeTheme.glowClass} ${
                  wrapText ? 'whitespace-pre-wrap' : 'whitespace-pre'
                } ${centerText ? `text-left mx-auto ${wrapText ? 'w-full max-w-full' : 'w-max max-w-none'}` : 'text-left'}`}
              >
                {outputArt}
              </pre>
            </div>

            {/* Tiny informational footer in terminal block */}
            <div className="bg-black/40 px-6 py-3 border-t border-white/5 flex justify-between items-center text-[10px] text-[#888888]">
              <div className="flex items-center gap-3">
                <span>Lines: {outputArt ? outputArt.split('\n').length : 0}</span>
                <span>•</span>
                <span>Characters: {outputArt ? outputArt.length : 0}</span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">Exhibition Mode OK</span>
            </div>
          </div>

          {/* BELOW panel - Art history & saved logs */}
          <div className="bg-[#111111]/90 backdrop-blur-md border border-white/10 rounded p-6 shadow-2xl space-y-4">
            
            {/* Board Header details */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className={activeTheme.text} />
                <h3 className="font-serif text-lg font-light tracking-wide text-white">Composition Archives</h3>
                <span className="text-[10px] bg-black/40 text-zinc-500 px-2.5 py-0.5 rounded border border-white/5 font-mono uppercase tracking-wider">
                  {history.length} Saved
                </span>
              </div>

              {/* Filters & Actions row */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex bg-black/40 p-0.5 rounded border border-white/5 text-[10px] font-mono mr-1">
                  <button
                    type="button"
                    id="filter-all-btn"
                    onClick={() => setFilterFavorites(false)}
                    className={`px-3 py-1 rounded transition duration-200 ${!filterFavorites ? `${activeTheme.lightBg} ${activeTheme.text} font-bold` : 'text-zinc-500 hover:text-zinc-200'}`}
                  >
                    ALL
                  </button>
                  <button
                    type="button"
                    id="filter-favorites-btn"
                    onClick={() => setFilterFavorites(true)}
                    className={`px-3 py-1 rounded transition duration-200 flex items-center gap-1 ${filterFavorites ? `${activeTheme.lightBg} ${activeTheme.text} font-bold` : 'text-zinc-500 hover:text-zinc-200'}`}
                  >
                    <Heart size={10} fill={filterFavorites ? activeTheme.iconColor : 'transparent'} />
                    <span>FAVES</span>
                  </button>
                </div>

                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllHistory}
                    id="clear-history-btn"
                    className="text-[10px] font-mono px-3 py-1.5 bg-black/20 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-zinc-500 hover:text-red-400 rounded transition flex items-center gap-1.5"
                    title="Nuke whole historic session"
                  >
                    <Trash2 size={10} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mini search inputs */}
            {history.length > 5 && (
              <div className="flex items-center gap-2.5 bg-black/45 border border-white/5 rounded px-3 py-2">
                <Search size={12} className="text-zinc-600" />
                <input
                  type="text"
                  placeholder="Filter archives by keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder-zinc-700 focus:outline-none w-full font-serif"
                />
              </div>
            )}

            {/* The list output render view */}
            <AnimatePresence mode="popLayout">
              {filteredHistory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {filteredHistory.map((item) => (
                    <motion.div
                       layout
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       transition={{ duration: 0.2 }}
                       key={item.id}
                       onClick={() => handleLoadHistoryItem(item)}
                       id={`history-item-${item.id}`}
                       className="p-3.5 bg-black/20 border border-white/5 hover:border-white/15 rounded group/item cursor-pointer hover:bg-black/40 transition-all flex items-center justify-between gap-3 text-left animate-fade-in"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="font-serif text-[13px] text-white font-medium truncate">
                            {item.inputText}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-black/40 text-zinc-500 rounded font-mono uppercase tracking-wider border border-white/5">
                            {item.style}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-[#888888] font-mono">
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span className="truncate max-w-[120px] italic">{item.customPrompt || 'Default template'}</span>
                        </div>
                      </div>

                      {/* Item controls logic */}
                      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button
                          type="button"
                          id={`history-item-fave-${item.id}`}
                          onClick={(e) => toggleFavorite(item.id, e)}
                          className={`p-1.5 rounded bg-black/45 hover:bg-black/80 border border-white/5 transition duration-200 ${
                            item.isFavorite ? 'text-pink-400 hover:text-pink-300' : 'text-zinc-650 hover:text-zinc-300'
                          }`}
                          title={item.isFavorite ? "Remove favorite" : "Save as favorite"}
                        >
                          <Heart size={11} fill={item.isFavorite ? "currentColor" : "transparent"} />
                        </button>
                        <button
                          type="button"
                          id={`history-item-delete-${item.id}`}
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-1.5 rounded bg-black/45 hover:bg-red-500/10 hover:border-red-500/25 border border-white/5 hover:text-red-400 text-zinc-650 transition duration-200"
                          title="Delete design"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#888888] space-y-1 bg-black/10 border border-white/5 rounded">
                  <Terminal size={20} className="mx-auto opacity-30 mb-2" />
                  <p className="text-xs font-semibold font-serif text-zinc-400">Archive catalog empty</p>
                  <p className="text-[10px] opacity-75 max-w-xs mx-auto">
                    {filterFavorites ? "No starred outputs registered." : "Formulated graphics accumulate inside the session storage."}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
          
        </div>
      </main>

      {/* Elegant minimalist footer */}
      <footer className="border-t border-white/5 py-5 px-6 bg-black/30 text-center text-xs text-[#888888] font-serif tracking-wide mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Composition Framework • G-ASCII Art Forge</span>
          <span className="font-mono text-[10px] text-zinc-600">Session Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </footer>
    </div>
  );
}
