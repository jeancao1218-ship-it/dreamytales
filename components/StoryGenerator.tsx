import React, { useState } from 'react';
import { ANIMAL_OPTIONS, THEME_SUGGESTIONS, VOICE_OPTIONS, SCENE_OPTIONS } from '../constants';
import { Language, StorySettings, UserProfile, VoiceName } from '../types';

interface StoryGeneratorProps {
  userProfile: UserProfile;
  onGenerate: (settings: StorySettings) => void;
  isLoading: boolean;
  initialSettings?: Partial<StorySettings>;
}

const StoryGenerator: React.FC<StoryGeneratorProps> = ({ userProfile, onGenerate, isLoading, initialSettings }) => {
  // Merged character selection into one list
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>(
    initialSettings?.secondaryCharacters 
      ? (initialSettings.mainCharacter ? [initialSettings.mainCharacter, ...initialSettings.secondaryCharacters] : initialSettings.secondaryCharacters)
      : []
  );
  
  const [scene, setScene] = useState(initialSettings?.scene || SCENE_OPTIONS[0].value);
  const [theme, setTheme] = useState(initialSettings?.theme || '');
  const [language, setLanguage] = useState<Language>(initialSettings?.language || Language.Chinese);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(initialSettings?.selectedVoice || VoiceName.Kore);
  const [customPrompt, setCustomPrompt] = useState('');

  const toggleAnimal = (char: string) => {
    setSelectedAnimals(prev => 
      prev.includes(char) ? prev.filter(c => c !== char) : [...prev, char]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let mainChar = '神秘的小动物'; 
    let secChars: string[] = [];

    if (selectedAnimals.length > 0) {
      mainChar = selectedAnimals[0];
      secChars = selectedAnimals.slice(1);
    }

    onGenerate({
      childName: userProfile.name,
      age: userProfile.age,
      mainCharacter: mainChar,
      secondaryCharacters: secChars,
      scene,
      theme,
      language,
      customPrompt,
      selectedVoice
    });
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl shadow-orange-100/50">
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Animal Selection (Unified) */}
        <div>
          <label className="block text-sm font-black text-[#422006] mb-3 ml-1">
             邀请动物小伙伴
          </label>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x">
            {ANIMAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleAnimal(opt.value)}
                className={`snap-start flex-shrink-0 flex flex-col items-center gap-2 min-w-[70px] group`}
              >
                 <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center text-3xl transition-all border-2 ${
                    selectedAnimals.includes(opt.value) 
                    ? 'bg-orange-50 border-orange-400 shadow-md scale-105' 
                    : 'bg-[#FDF6E3] border-transparent group-hover:bg-orange-50'
                 }`}>
                     {opt.label.split(' ')[0]}
                 </div>
                 <span className={`text-xs font-bold ${selectedAnimals.includes(opt.value) ? 'text-orange-500' : 'text-gray-400'}`}>
                     {opt.label.split(' ')[1]}
                 </span>
              </button>
            ))}
          </div>
        </div>

        {/* Scene Selection */}
        <div>
          <label className="block text-sm font-black text-[#422006] mb-3 ml-1">
            故事发生的场景
          </label>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x">
            {SCENE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScene(opt.value)}
                className={`snap-start flex-shrink-0 px-4 py-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                  scene === opt.value 
                    ? 'bg-teal-50 border-teal-400 text-teal-700 shadow-sm' 
                    : 'bg-[#FDF6E3] border-transparent text-gray-500'
                }`}
              >
                <span className="mr-1 text-base">{opt.label.split(' ')[0]}</span>
                <span>{opt.label.split(' ')[1]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-black text-[#422006] mb-3 ml-1">
             故事主题
          </label>
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
            {THEME_SUGGESTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                    theme === t 
                    ? 'bg-purple-100 text-purple-600 border border-purple-200'
                    : 'bg-[#FDF6E3] text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative">
            <input 
                type="text" 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-[#FDF6E3] border-none rounded-2xl p-4 pl-12 text-[#422006] placeholder-gray-400 font-bold focus:ring-2 focus:ring-purple-200 outline-none"
                placeholder="例如: 克服恐惧..."
            />
            <i className="fas fa-magic absolute left-4 top-1/2 -translate-y-1/2 text-purple-300"></i>
          </div>
        </div>

        {/* Voice & Language */}
        <div className="bg-[#FDF6E3] p-5 rounded-[1.5rem]">
            <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-black text-[#422006]">讲述声音</label>
                <div className="flex bg-white rounded-xl p-1 shadow-sm">
                    {[Language.Chinese, Language.English].map((lang) => (
                    <button
                        key={lang}
                        type="button"
                        onClick={() => setLanguage(lang)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        language === lang 
                            ? 'bg-[#422006] text-white' 
                            : 'text-gray-400'
                        }`}
                    >
                        {lang === Language.Chinese ? '中文' : 'EN'}
                    </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {VOICE_OPTIONS.map(v => (
                        <button
                        key={v.value}
                        type="button"
                        onClick={() => setSelectedVoice(v.value)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                            selectedVoice === v.value 
                            ? 'bg-white border-orange-400 shadow-sm' 
                            : 'bg-white border-transparent text-gray-400 opacity-70'
                        }`}
                        >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${selectedVoice === v.value ? 'bg-orange-100 text-orange-600' : 'bg-gray-100'}`}>
                            <i className={`fas ${v.gender === 'Female' ? 'fa-venus' : 'fa-mars'}`}></i>
                        </div>
                        <span className={`text-xs font-bold ${selectedVoice === v.value ? 'text-[#422006]' : 'text-gray-400'}`}>{v.label.split(' ')[0]}</span>
                        </button>
                ))}
            </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full py-4 rounded-[2rem] font-black text-lg shadow-lg transition-all active:scale-[0.98] ${
            isLoading 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
              : 'bg-[#FF9F76] text-white shadow-orange-200 hover:bg-[#FF8E5E]'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <i className="fas fa-circle-notch fa-spin"></i> 正在创作中...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              <i className="fas fa-sparkles"></i> 开始生成
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default StoryGenerator;