/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_AZURE_OPENAI_ENDPOINT?: string;
  readonly VITE_AZURE_OPENAI_API_KEY?: string;
  readonly VITE_AZURE_OPENAI_TEXT_DEPLOYMENT?: string;
  readonly VITE_AZURE_OPENAI_TTS_DEPLOYMENT?: string;
  readonly VITE_AZURE_SPEECH_KEY?: string;
  readonly VITE_AZURE_SPEECH_REGION?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
