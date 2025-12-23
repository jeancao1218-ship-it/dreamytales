import { AzureOpenAI } from "openai";
import { StorySettings, VoiceName } from "../types";

// Initialize Azure OpenAI client
// Note: In a real app, these should be in .env.local
// In development, use local proxy to avoid CORS
const isDev = import.meta.env.DEV;
const originalEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || '';
// Use window.location.origin in dev to route through Vite proxy
const endpoint = isDev && typeof window !== 'undefined' ? window.location.origin : originalEndpoint;

const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY || '';
const apiVersion = "2024-05-01-preview";
// Update defaults to match user's actual resources
const textDeployment = import.meta.env.VITE_AZURE_OPENAI_TEXT_DEPLOYMENT || 'gpt-5-chat';
const ttsDeployment = import.meta.env.VITE_AZURE_OPENAI_TTS_DEPLOYMENT || 'gpt-4o-mini-tts';

console.log("Azure Config:", { 
  endpoint, 
  textDeployment, 
  ttsDeployment,
  hasKey: !!apiKey 
});

const client = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion,
  dangerouslyAllowBrowser: true // Allow running in browser for this demo
});

interface GeneratedStoryData {
  title: string;
  content: string;
}

export const generateStoryText = async (
  settings: StorySettings,
  isSequelToContext?: string
): Promise<GeneratedStoryData> => {
  const { childName, age, mainCharacter, secondaryCharacters, scene, theme, language, customPrompt } = settings;

  const characterStr = secondaryCharacters.length > 0 
    ? `和其他小伙伴: ${secondaryCharacters.join(', ')}` 
    : '';

  const systemPrompt = `
    你是一个温柔的睡前故事讲述者。
    请为一个叫 ${childName} 的 ${age} 岁小朋友讲一个睡前故事。
    
    【故事设定】
    1. 故事背景/场景: ${scene}。
    2. 核心主角: ${childName} (小朋友本人)。
    3. 陪伴伙伴: 最好的朋友 ${mainCharacter} ${characterStr}。
    4. 故事主题/寓意: ${theme}。
    5. 额外要求: ${customPrompt || '无'}。
    
    【讲述要求】
    1. 故事要以 ${childName} 为第一视角或第三人称的核心视角，让他/她感觉到自己是故事的小英雄。
    2. 动物伙伴们 (${mainCharacter}等) 是来陪伴和帮助 ${childName} 的。
    3. 语言风格: ${language === 'Chinese' ? '中文' : 'English'}，语调要温柔、舒缓，适合睡前助眠。
    4. 充满童趣和正能量，结局温馨。
    5. 字数适中，适合3-5分钟朗读。
    
    请严格按照以下 JSON 格式返回结果：
    {
      "title": "一个简短可爱的标题",
      "content": "故事的正文内容..."
    }
  `;

  let userMessage = "请开始讲故事。";
  if (isSequelToContext) {
    userMessage += `\n\n重要提示: 这是一个续集故事。
    前情提要: ${isSequelToContext.substring(0, 500)}...
    请保持角色性格一致，在新的场景 ${scene} 中开始新的温柔冒险。`;
  }

  try {
    const response = await client.chat.completions.create({
      model: textDeployment,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content generated from Azure OpenAI");

    const parsed = JSON.parse(content);
    return {
      title: parsed.title,
      content: parsed.content
    };

  } catch (error) {
    console.error("Error generating text:", error);
    throw error;
  }
};

export const generateStoryAudio = async (
  text: string,
  voiceName: VoiceName
): Promise<ArrayBuffer> => {
  try {
    if (!text || text.length === 0) {
        throw new Error("Audio generation text is empty");
    }

    const response = await client.audio.speech.create({
      model: ttsDeployment,
      voice: voiceName,
      input: text,
      response_format: 'mp3',
    });

    return await response.arrayBuffer();

  } catch (error) {
    console.error("Error generating audio:", error);
    throw error;
  }
};
