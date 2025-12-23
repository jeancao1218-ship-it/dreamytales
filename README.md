<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1YXgT498wX6dRzXboeIZYCnq2MMVz4dOr

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the following environment variables in [.env.local](.env.local):
   ```
   VITE_AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
   VITE_AZURE_OPENAI_API_KEY=your_api_key
   VITE_AZURE_OPENAI_TEXT_DEPLOYMENT=gpt-4o
   VITE_AZURE_OPENAI_TTS_DEPLOYMENT=tts-1
   VITE_AZURE_SPEECH_KEY=your_speech_key
   VITE_AZURE_SPEECH_REGION=japaneast
   ```
3. Run the app:
   `npm run dev`

## Deploy to Vercel (recommended)

This app uses Vercel Serverless Functions to keep your Azure keys private:
- Text generation: `POST /api/story`
- TTS (mp3): `POST /api/tts`

### Steps
1. Push this repo to GitHub.
2. Create a new project on Vercel and import the repo.
3. In Vercel Project Settings -> Environment Variables, set:
   ```
   AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
   AZURE_OPENAI_API_KEY=your_api_key
   AZURE_OPENAI_TEXT_DEPLOYMENT=gpt-4o
   AZURE_OPENAI_API_VERSION=2024-05-01-preview
   AZURE_SPEECH_KEY=your_speech_key
   AZURE_SPEECH_REGION=japaneast
   ```
4. Deploy.

### Notes
- Do not put secrets in `VITE_*` variables for production. `VITE_*` variables are embedded into the client bundle.
- `.env.local` should stay local and never be committed.
