import React, { useState, useEffect, useCallback } from 'react';
import StoryGenerator from './components/StoryGenerator';
import Player from './components/Player';
import { generateStoryText, generateStoryAudio } from './services/azureService';
import { Story, StorySettings, PlayMode, UserProfile } from './types';
import { v4 as uuidv4 } from 'uuid';
import { ANIMAL_OPTIONS, THEME_SUGGESTIONS } from './constants';

// Helper for ID
const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>(PlayMode.Sequential);
  const [isBgMusicOn, setIsBgMusicOn] = useState(true);
  
  // View State: 'home' (Dashboard) or 'create' (Generator)
  const [view, setView] = useState<'home' | 'create'>('home');

  // Filter state
  const [filterTheme, setFilterTheme] = useState<string | null>(null);

  // Reading state (for Modal)
  const [readingStory, setReadingStory] = useState<Story | null>(null);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('dreamytales_profile');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Setup Form State
  const [setupName, setSetupName] = useState('');
  const [setupAge, setSetupAge] = useState(3);
  const [setupGender, setSetupGender] = useState<'Boy' | 'Girl'>('Girl');
  
  // Sequel state
  const [sequelContext, setSequelContext] = useState<Story | null>(null);

  // Audio Context
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioCtx(ctx);
    return () => { ctx.close(); };
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName.trim()) return;
    const profile: UserProfile = { name: setupName, age: setupAge, gender: setupGender };
    setUserProfile(profile);
    localStorage.setItem('dreamytales_profile', JSON.stringify(profile));
  };

  const handleResetProfile = () => {
    if (confirm("确定要修改宝宝的信息吗？")) {
        setUserProfile(null);
        setSetupName('');
        setSetupAge(3);
    }
  };

  const handleGenerate = async (settings: StorySettings) => {
    // if (!audioCtx) return; // No longer strictly required for generation, but used for duration check
    setIsGenerating(true);
    
    try {
      // 1. Generate Text
      const textData = await generateStoryText(settings, sequelContext?.content);
      
      // 2. Generate Audio
      const textToRead = `${textData.title}. ${textData.content}`;
      // Now returns ArrayBuffer (MP3 data)
      const mp3ArrayBuffer = await generateStoryAudio(textToRead, settings.selectedVoice);
      
      // Create Blob URL for playback
      const blob = new Blob([mp3ArrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      // Get duration (optional, but good for UI)
      let duration = 0;
      if (audioCtx) {
        try {
           // Decode just to get duration. Note: decodeAudioData detaches the buffer, so we slice it.
           const tempBuffer = await audioCtx.decodeAudioData(mp3ArrayBuffer.slice(0));
           duration = tempBuffer.duration;
        } catch (e) {
           console.warn("Could not determine duration", e);
        }
      }
      
      const newStory: Story = {
        id: generateId(),
        title: textData.title,
        content: textData.content,
        audioBuffer: null, // No longer storing heavy buffer
        audioUrl: audioUrl,
        settings: settings,
        createdAt: Date.now(),
        duration: duration,
        isSequelTo: sequelContext?.id
      };

      setStories(prev => [newStory, ...prev]);
      setCurrentStoryId(newStory.id);
      setIsPlaying(true);
      setSequelContext(null);
      
      // Go back to home list after generation
      setView('home');
      setFilterTheme(null); // Reset filter to show new story

    } catch (error) {
      console.error("Failed to generate story", error);
      const msg = error instanceof Error ? error.message : "未知错误";
      alert(`故事生成出错了: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayStory = (id: string) => {
    if (currentStoryId === id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStoryId(id);
      setIsPlaying(true);
    }
  };

  const handleNext = useCallback(() => {
    if (stories.length === 0) return;
    
    // Logic should respect current filter if possible, but simplest is to just play next in main list
    // or next in filtered list. Let's use the visible list for playback order if filters are active.
    const visibleStories = filterTheme ? stories.filter(s => s.settings.theme === filterTheme) : stories;
    if (visibleStories.length === 0) return;

    let nextIndex = 0;
    const currentIndex = visibleStories.findIndex(s => s.id === currentStoryId);

    if (playMode === PlayMode.LoopOne) {
        const audio = visibleStories[currentIndex]?.audioBuffer; 
        setIsPlaying(false);
        setTimeout(() => setIsPlaying(true), 10);
        return;
    } else if (playMode === PlayMode.Shuffle) {
        nextIndex = Math.floor(Math.random() * visibleStories.length);
    } else {
        nextIndex = currentIndex + 1;
        if (nextIndex >= visibleStories.length) nextIndex = 0;
    }

    setCurrentStoryId(visibleStories[nextIndex].id);
    setIsPlaying(true);
  }, [stories, currentStoryId, playMode, filterTheme]);

  const handlePrev = () => {
    const visibleStories = filterTheme ? stories.filter(s => s.settings.theme === filterTheme) : stories;
    if (visibleStories.length === 0) return;

    const currentIndex = visibleStories.findIndex(s => s.id === currentStoryId);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = visibleStories.length - 1;
    setCurrentStoryId(visibleStories[prevIndex].id);
    setIsPlaying(true);
  };

  const prepareSequel = (story: Story) => {
    setSequelContext(story);
    setView('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentStory = stories.find(s => s.id === currentStoryId) || null;
  const filteredStories = filterTheme ? stories.filter(s => s.settings.theme === filterTheme) : stories;

  // 1. PROFILE SETUP VIEW
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-xl shadow-orange-100/50 relative overflow-hidden">
           {/* Decorative circles */}
           <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-orange-100 rounded-full opacity-50"></div>
           <div className="absolute bottom-[-30px] left-[-30px] w-24 h-24 bg-teal-100 rounded-full opacity-50"></div>

           <div className="text-center mb-8 relative z-10">
               <div className="w-20 h-20 bg-orange-100 rounded-full mx-auto flex items-center justify-center mb-4 text-3xl">
                  👋
               </div>
               <h1 className="text-3xl font-black text-[#422006] mb-2">Welcome!</h1>
               <p className="text-[#9CA3AF] text-sm">让我们先认识一下宝宝吧</p>
           </div>
           
           <form onSubmit={handleSaveProfile} className="space-y-6 relative z-10">
              <div>
                 <label className="block text-sm font-bold text-[#422006] mb-2 ml-1">宝宝的名字</label>
                 <input 
                    type="text"
                    required
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    className="w-full bg-[#FDF6E3] border-none rounded-2xl py-4 px-6 text-[#422006] placeholder-orange-300/70 focus:ring-2 focus:ring-orange-300 outline-none text-lg font-bold"
                    placeholder="输入昵称..."
                 />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#422006] mb-2 ml-1">性别</label>
                    <div className="flex bg-[#FDF6E3] p-1 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setSetupGender('Girl')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${setupGender === 'Girl' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400'}`}
                        >
                            👧 女孩
                        </button>
                        <button
                            type="button"
                            onClick={() => setSetupGender('Boy')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${setupGender === 'Boy' ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-400'}`}
                        >
                            👦 男孩
                        </button>
                    </div>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-[#422006] mb-2 ml-1">年龄 ({setupAge}岁)</label>
                     <div className="h-[52px] bg-[#FDF6E3] rounded-2xl flex items-center px-4">
                        <input 
                            type="range"
                            min="1" max="10"
                            value={setupAge}
                            onChange={(e) => setSetupAge(parseInt(e.target.value))}
                            className="w-full accent-orange-400 h-2 bg-orange-100 rounded-lg appearance-none cursor-pointer"
                        />
                     </div>
                  </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 mt-4 rounded-2xl bg-[#FF9F76] text-white font-black text-lg shadow-lg shadow-orange-200 hover:shadow-xl hover:bg-[#FF8E5E] transition-all active:scale-[0.98]"
              >
                开启梦幻之旅
              </button>
           </form>
        </div>
      </div>
    );
  }

  // 2. MAIN APP VIEW
  return (
    <div className="min-h-screen bg-[#FFF9F0] pb-40">
      
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-orange-50/60 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-teal-50/60 rounded-full blur-3xl"></div>
      </div>

      <main className="max-w-md mx-auto relative z-10 px-6 pt-8">
        
        {/* --- HEADER --- */}
        {view === 'home' && (
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-[#422006]">DreamyTales</h1>
                    <p className="text-sm text-[#9CA3AF] font-bold">晚上好, {userProfile.name} 🌙</p>
                </div>
                <button 
                    onClick={handleResetProfile}
                    className="w-12 h-12 rounded-full bg-white border-2 border-[#FFF4E6] flex items-center justify-center shadow-sm overflow-hidden"
                >
                     <span className="text-2xl">{userProfile.gender === 'Girl' ? '👧' : '👦'}</span>
                </button>
            </header>
        )}

        {/* --- VIEW: CREATE --- */}
        {view === 'create' && (
             <div className="animate-fade-in-up">
                 <div className="flex items-center gap-4 mb-6">
                    <button 
                        onClick={() => {
                            setView('home');
                            setSequelContext(null);
                        }}
                        className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#422006] hover:bg-orange-50 transition-colors"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h2 className="text-xl font-bold text-[#422006]">
                        {sequelContext ? '编写续集' : '创作新故事'}
                    </h2>
                 </div>

                 {sequelContext && (
                    <div className="bg-[#FFF4E6] p-4 rounded-2xl mb-6 flex items-center gap-4 border border-orange-100">
                        <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center text-white">
                            <i className="fas fa-link"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">接续上一篇</span>
                            <p className="text-sm font-bold text-[#422006] truncate">{sequelContext.title}</p>
                        </div>
                    </div>
                )}
                
                <StoryGenerator 
                    userProfile={userProfile}
                    onGenerate={handleGenerate} 
                    isLoading={isGenerating} 
                    initialSettings={
                         sequelContext ? sequelContext.settings : undefined
                    }
                />
             </div>
        )}

        {/* --- VIEW: HOME DASHBOARD --- */}
        {view === 'home' && (
            <div className="space-y-8">
                
                {/* 1. HERO BUTTON: CREATE NEW STORY */}
                <div className="relative group">
                    <button 
                        onClick={() => setView('create')}
                        className="w-full bg-white rounded-[2rem] p-3 flex items-center shadow-[0_4px_20px_-5px_rgba(255,166,118,0.3)] hover:shadow-lg hover:-translate-y-1 transition-all active:scale-[0.99] border border-orange-100"
                    >
                         <div className="bg-[#FF9F76] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md flex-shrink-0 mr-4">
                            <i className="fas fa-plus text-xl"></i>
                        </div>
                        <div className="text-left flex-1">
                             <h3 className="font-black text-[#422006] text-lg">为宝宝创作新故事</h3>
                             <p className="text-xs text-gray-400 font-bold">✨ 今天想听什么呢？</p>
                        </div>
                        <div className="pr-4 text-orange-200">
                             <i className="fas fa-chevron-right"></i>
                        </div>
                    </button>
                </div>

                {/* 2. CATEGORY FILTERS */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="font-black text-lg text-[#422006]">故事主题</h3>
                         {filterTheme && (
                             <button 
                                onClick={() => setFilterTheme(null)}
                                className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full"
                             >
                                 清除筛选 <i className="fas fa-times ml-1"></i>
                             </button>
                         )}
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                        {THEME_SUGGESTIONS.map((theme, idx) => {
                            const isSelected = filterTheme === theme;
                            
                            // Color cycling for variety
                            const colors = [
                                { bg: 'bg-green-100', text: 'text-green-600', active: 'bg-green-500 text-white' },
                                { bg: 'bg-orange-100', text: 'text-orange-600', active: 'bg-orange-500 text-white' },
                                { bg: 'bg-blue-100', text: 'text-blue-600', active: 'bg-blue-500 text-white' },
                                { bg: 'bg-purple-100', text: 'text-purple-600', active: 'bg-purple-500 text-white' },
                                { bg: 'bg-yellow-100', text: 'text-yellow-600', active: 'bg-yellow-500 text-white' },
                            ];
                            const style = colors[idx % colors.length];
                            
                            return (
                                <button 
                                    key={theme}
                                    onClick={() => setFilterTheme(isSelected ? null : theme)}
                                    className={`flex flex-col items-center gap-2 min-w-[80px] transition-all ${isSelected ? 'scale-105' : 'opacity-80 hover:opacity-100'}`}
                                >
                                    <div className={`${isSelected ? style.active : style.bg} w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${isSelected ? '' : style.text} text-xl shadow-sm mb-1 transition-colors duration-300`}>
                                        <i className={`fas ${
                                            idx % 5 === 0 ? 'fa-leaf' :
                                            idx % 5 === 1 ? 'fa-heart' :
                                            idx % 5 === 2 ? 'fa-star' :
                                            idx % 5 === 3 ? 'fa-moon' : 'fa-sun'
                                        }`}></i>
                                    </div>
                                    <span className={`text-xs font-bold text-center w-full truncate px-1 ${isSelected ? 'text-[#422006]' : 'text-gray-400'}`}>
                                        {theme}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* 3. STORIES LIST */}
                <div>
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-lg text-[#422006]">
                            {filterTheme ? `"${filterTheme}" 故事` : '所有故事'}
                        </h3>
                        <span className="text-xs font-bold bg-[#FDF6E3] text-orange-400 px-3 py-1 rounded-full">{filteredStories.length} 个</span>
                     </div>
                     
                     {filteredStories.length === 0 ? (
                        <div className="bg-white rounded-[2rem] p-10 text-center border-2 border-dashed border-[#F3E8DB]">
                             <div className="text-4xl mb-4 text-orange-200">📖</div>
                             <p className="text-gray-400 font-bold text-sm">
                                 {stories.length === 0 ? "还没有故事哦，快去创作一个吧！" : "没有找到这个主题的故事"}
                             </p>
                        </div>
                     ) : (
                         <div className="grid gap-4">
                            {filteredStories.map(story => (
                                <div key={story.id} className={`bg-white p-4 rounded-[1.5rem] flex flex-col gap-3 transition-all ${currentStoryId === story.id ? 'ring-2 ring-orange-200 shadow-md' : 'shadow-sm'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${story.settings.mainCharacter === '小兔子' ? 'bg-pink-50' : 'bg-orange-50'}`}>
                                            {story.settings.mainCharacter === '小兔子' ? '🐰' : 
                                             story.settings.mainCharacter === '小熊' ? '🐻' : 
                                             story.settings.mainCharacter === '小猫' ? '🐱' : '🌟'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-bold text-base truncate mb-1 ${currentStoryId === story.id ? 'text-orange-500' : 'text-[#422006]'}`}>{story.title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded-md">{story.settings.theme || '温馨故事'}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handlePlayStory(story.id)}
                                            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${currentStoryId === story.id && isPlaying ? 'bg-orange-400 text-white shadow-lg shadow-orange-200' : 'bg-gray-50 text-gray-400 hover:bg-orange-100 hover:text-orange-400'}`}
                                        >
                                            <i className={`fas ${currentStoryId === story.id && isPlaying ? 'fa-pause' : 'fa-play'} ml-1 text-lg`}></i>
                                        </button>
                                    </div>
                                    
                                    {/* Action Footer */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                                        <button 
                                            onClick={() => setReadingStory(story)}
                                            className="text-xs font-bold text-gray-400 hover:text-[#422006] flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <i className="fas fa-book-open"></i> 查看文字
                                        </button>
                                        <button 
                                            onClick={() => prepareSequel(story)}
                                            className="text-xs font-bold text-orange-400 hover:text-orange-600 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors"
                                        >
                                            <i className="fas fa-wand-magic-sparkles"></i> 续写故事
                                        </button>
                                    </div>
                                </div>
                            ))}
                         </div>
                     )}
                </div>

            </div>
        )}

      </main>

      {/* READING MODAL */}
      {readingStory && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReadingStory(null)}></div>
              <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-[2rem] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-fade-in-up">
                  {/* Header */}
                  <div className="p-6 pb-2 flex items-start justify-between bg-white shrink-0">
                      <div>
                          <h2 className="text-xl font-black text-[#422006] leading-tight mb-1">{readingStory.title}</h2>
                          <div className="text-xs text-gray-400 font-bold">
                              主角: {readingStory.settings.mainCharacter} • 场景: {readingStory.settings.scene}
                          </div>
                      </div>
                      <button 
                        onClick={() => setReadingStory(null)}
                        className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-200"
                      >
                          <i className="fas fa-times"></i>
                      </button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 pt-2 overflow-y-auto custom-scrollbar">
                      <div className="text-[#422006] leading-loose text-lg whitespace-pre-line font-medium">
                          {readingStory.content}
                      </div>
                  </div>

                  {/* Footer Play Action */}
                  <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex justify-center shrink-0">
                       <button 
                            onClick={() => {
                                setCurrentStoryId(readingStory.id);
                                setIsPlaying(true);
                                setReadingStory(null);
                            }}
                            className="bg-[#FF9F76] text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-orange-200 active:scale-95 transition-transform flex items-center gap-2"
                        >
                            <i className="fas fa-play"></i> 播放此故事
                        </button>
                  </div>
              </div>
          </div>
      )}

      {/* Persistent Player */}
      <Player 
        currentStory={currentStory}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onNext={handleNext}
        onPrev={handlePrev}
        playMode={playMode}
        onToggleMode={() => {
            const modes = [PlayMode.Sequential, PlayMode.LoopOne, PlayMode.Shuffle];
            const idx = modes.indexOf(playMode);
            setPlayMode(modes[(idx + 1) % modes.length]);
        }}
        isBackgroundMusicOn={isBgMusicOn}
        onToggleBgMusic={() => setIsBgMusicOn(!isBgMusicOn)}
      />
    </div>
  );
}

export default App;