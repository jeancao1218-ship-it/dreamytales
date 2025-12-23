import { VoiceName } from "./types";

export const ANIMAL_OPTIONS = [
  { label: '🐰 小兔子', value: '小兔子' },
  { label: '🐻 小熊', value: '小熊' },
  { label: '🐱 小猫', value: '小猫' },
  { label: '🐶 小狗', value: '小狗' },
  { label: '🐷 小猪', value: '小猪' },
  { label: '🐣 小鸡', value: '小鸡' },
  { label: '🦍 大猩猩', value: '大猩猩' },
  { label: '🐟 小鱼', value: '小鱼' },
  { label: '🦐 小虾', value: '小虾' },
  { label: '🦁 狮子', value: '狮子' },
  { label: '🐘 大象', value: '大象' },
  { label: '🦊 狐狸', value: '狐狸' },
  { label: '🦉 猫头鹰', value: '猫头鹰' },
  { label: '🐼 熊猫', value: '熊猫' },
  { label: '🐨 考拉', value: '考拉' },
  { label: '🐯 老虎', value: '老虎' },
  { label: '🦒 长颈鹿', value: '长颈鹿' },
  { label: '🐧 企鹅', value: '企鹅' },
  { label: '🐬 海豚', value: '海豚' },
  { label: '🦄 独角兽', value: '独角兽' },
  { label: '🦖 恐龙', value: '恐龙' },
  { label: '🐵 小猴子', value: '小猴子' },
  { label: '🦆 小鸭子', value: '小鸭子' },
  { label: '🐲 龙', value: '龙' },
];

export const SCENE_OPTIONS = [
  { label: '🚜 快乐农场', value: '快乐农场' },
  { label: '🌲 魔法森林', value: '魔法森林' },
  { label: '🏰 梦幻城堡', value: '梦幻城堡' },
  { label: '🚀 太空探险', value: '外太空' },
  { label: '🌊 深海世界', value: '海底世界' },
  { label: '🌈 彩虹云朵', value: '彩虹云端' },
  { label: '🍬 糖果王国', value: '糖果王国' },
  { label: '🦕 恐龙岛', value: '恐龙岛' },
  { label: '🎡 奇幻游乐园', value: '奇幻游乐园' },
  { label: '🛖 温暖树屋', value: '温暖树屋' },
  { label: '🍄 蘑菇村', value: '蘑菇村' },
];

// Optimized to 4-character fluent Chinese phrases
export const THEME_SUGGESTIONS = [
  '勇敢无畏', // Brave
  '学会分享', // Sharing
  '知错就改', // Apologizing
  '珍视友谊', // Friendship
  '乐于助人', // Helping others
  '诚实守信', // Honesty
  '懂得感恩', // Gratitude
  '讲究卫生', // Hygiene
  '礼貌待人', // Politeness
  '独立自主', // Independence
];

// Map friendly names to API voice names
export const VOICE_OPTIONS = [
  { label: '睡前哄睡 (Shimmer)', value: VoiceName.Shimmer, gender: 'Female' },
  { label: '绘本时刻 (Fable)', value: VoiceName.Fable, gender: 'Female' },
  { label: '活力玩耍 (Nova)', value: VoiceName.Nova, gender: 'Female' },
  { label: '吃饭香香 (Alloy)', value: VoiceName.Alloy, gender: 'Male' },
  { label: '沉稳陪伴 (Onyx)', value: VoiceName.Onyx, gender: 'Male' },
  { label: '轻松午后 (Echo)', value: VoiceName.Echo, gender: 'Male' },
];

// Placeholder for background music (Royalty Free Sleep Music Loop)
export const BACKGROUND_MUSIC_URL = "https://cdn.pixabay.com/audio/2022/10/28/audio_65529f5b24.mp3";