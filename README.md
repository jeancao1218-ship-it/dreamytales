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
   ```
3. Run the app:
   `npm run dev`
