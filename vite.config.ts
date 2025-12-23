import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/openai': {
            target: env.VITE_AZURE_OPENAI_ENDPOINT,
            changeOrigin: true,
            secure: false,
          },
          '/speech': {
            target: 'https://japaneast.tts.speech.microsoft.com',
            changeOrigin: true,
            secure: false,
            headers: {
              ...(env.VITE_AZURE_SPEECH_KEY ? { 'Ocp-Apim-Subscription-Key': env.VITE_AZURE_SPEECH_KEY } : {}),
              ...(env.VITE_AZURE_SPEECH_REGION ? { 'Ocp-Apim-Subscription-Region': env.VITE_AZURE_SPEECH_REGION } : {}),
            },
            rewrite: (path) => path.replace(/^\/speech/, '')
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
