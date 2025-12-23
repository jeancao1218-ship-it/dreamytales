import { GoogleGenAI, Modality } from "@google/genai";
import { StorySettings, VoiceName } from "../types";
import { decodeAudioData } from "../utils/audio";

const API_KEY = process.env.API_KEY || '';

// Initialize client
const ai = new GoogleGenAI({ apiKey: API_KEY });

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

  // Constructing a prompt that emphasizes the child as the MAIN character
  let prompt = `
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
    
    请严格按照以下 JSON 格式返回结果（**绝对不要**包含 Markdown 代码块标记，直接返回纯 JSON 字符串）：
    {
      "title": "一个简短可爱的标题",
      "content": "故事的正文内容..."
    }
  `;

  if (isSequelToContext) {
    prompt += `\n\n重要提示: 这是一个续集故事。
    前情提要: ${isSequelToContext.substring(0, 500)}...
    请保持角色性格一致，在新的场景 ${scene} 中开始新的温柔冒险。`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    let text = response.text;
    if (!text) throw new Error("No text generated from Gemini");
    
    // Cleanup Markdown if present (common issue with LLMs)
    text = text.replace(/```json\n?|```/g, '').trim();
    
    try {
        const parsed = JSON.parse(text);
        return {
            title: parsed.title,
            content: parsed.content
        };
    } catch (parseError) {
        console.error("JSON Parse Error. Raw text received:", text);
        throw new Error("AI 返回的数据格式不正确，请重试");
    }

  } catch (error) {
    console.error("Error generating text:", error);
    throw error;
  }
};

export const generateStoryAudio = async (
  text: string,
  voiceName: VoiceName,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  try {
    // Basic validation
    if (!text || text.length === 0) {
        throw new Error("Audio generation text is empty");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from Gemini");
    }

    return await decodeAudioData(base64Audio, audioContext, 24000);

  } catch (error) {
    console.error("Error generating audio:", error);
    throw error;
  }
};