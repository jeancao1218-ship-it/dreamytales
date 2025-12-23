export enum Language {
  Chinese = 'Chinese',
  English = 'English',
}

export enum VoiceGender {
  Male = 'Male',
  Female = 'Female',
}

// Mapping to Azure OpenAI Voices
export enum VoiceName {
  Alloy = 'alloy',
  Echo = 'echo',
  Fable = 'fable',
  Onyx = 'onyx',
  Nova = 'nova',
  Shimmer = 'shimmer',
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'Boy' | 'Girl';
}

export interface StorySettings {
  childName: string;
  age: number;
  mainCharacter: string; // Now represents "Best Animal Friend"
  secondaryCharacters: string[];
  scene: string; // New: Scene setting
  theme: string; // e.g., "Learning to share"
  language: Language;
  customPrompt?: string;
  selectedVoice: VoiceName;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  audioBuffer: AudioBuffer | null; // Deprecated, but kept for type compatibility if needed
  audioUrl?: string; // New: Blob URL for audio playback
  settings: StorySettings;
  createdAt: number;
  duration: number; // in seconds
  isSequelTo?: string; // ID of parent story
}

export enum PlayMode {
  Sequential = 'Sequential',
  LoopOne = 'LoopOne',
  Shuffle = 'Shuffle',
}