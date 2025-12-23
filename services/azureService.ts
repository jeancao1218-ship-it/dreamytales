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

// Azure Speech Service Config
const speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY || '';
const speechRegion = import.meta.env.VITE_AZURE_SPEECH_REGION || 'japaneast';

console.log("Azure Config:", { 
  endpoint, 
  textDeployment, 
  ttsDeployment,
  hasKey: !!apiKey,
  hasSpeechKey: !!speechKey
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

const readTextOrJsonError = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const data = await response.json();
      return data?.error ? String(data.error) : JSON.stringify(data);
    } catch {
      return `HTTP ${response.status}`;
    }
  }
  try {
    return await response.text();
  } catch {
    return `HTTP ${response.status}`;
  }
};

export const generateStoryText = async (
  settings: StorySettings,
  isSequelToContext?: string
): Promise<GeneratedStoryData> => {
  // In production (Vercel), never call Azure directly from the browser.
  // Use serverless API to keep keys private.
  if (!isDev) {
    const resp = await fetch('/api/story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, sequelContext: isSequelToContext })
    });
    if (!resp.ok) {
      const message = await readTextOrJsonError(resp);
      throw new Error(message || `Story API failed (${resp.status})`);
    }
    return await resp.json();
  }

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
    userMessage += `\n\n【续集模式开启】
    这是一个连续剧故事的最新一集。
    
    上一集剧情回顾:
    "${isSequelToContext.substring(0, 800)}..."
    
    续写要求:
    1. **强关联性**: 必须自然地承接上一集的结尾或核心事件。
    2. **角色记忆**: 主角 ${childName} 和伙伴们应该记得上一集发生的事情（例如提到的物品、学到的道理）。
    3. **新旧交替**: 在新的场景 ${scene} 中展开冒险，但要巧妙地融入上一集的元素。
    4. **性格一致**: 保持所有角色的性格特征不变。
    
    请开始讲述这个精彩的续集！`;
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

    // In production (Vercel), call serverless TTS so keys are never exposed.
    if (!isDev) {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!resp.ok) {
        const message = await readTextOrJsonError(resp);
        throw new Error(message || `TTS API failed (${resp.status})`);
      }
      return await resp.arrayBuffer();
    }

    if (!isDev && !speechKey) {
      throw new Error("Missing Azure Speech key (VITE_AZURE_SPEECH_KEY)");
    }

    // Use Azure Speech Service REST API
    // Use proxy in dev to avoid CORS, direct URL in prod
    const baseUrl = isDev 
      ? '/speech' 
      : `https://${speechRegion}.tts.speech.microsoft.com`;
      
    const url = `${baseUrl}/cognitiveservices/v1`;
    
    // Construct SSML for advanced control (style, rate, pitch)
    // Using zh-CN-XiaoxiaoNeural with affectionate style as requested
    const ssml = `
      <speak version='1.0' xml:lang='zh-CN' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'>
        <voice name='zh-CN-XiaoxiaoNeural'>
          <mstts:express-as style='affectionate'>
            <prosody rate='-15%' pitch='-5%'>
              ${text}
            </prosody>
          </mstts:express-as>
        </voice>
      </speak>
    `;

    const headers: Record<string, string> = {
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'DreamyTales'
    };

    // In dev, the Vite proxy injects subscription headers to avoid CORS and keep keys out of browser requests.
    if (!isDev) {
      headers['Ocp-Apim-Subscription-Key'] = speechKey;
      headers['Ocp-Apim-Subscription-Region'] = speechRegion;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: ssml
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Azure Speech API Error Details:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          url: url,
          keyLength: speechKey ? speechKey.length : 0
      });
      throw new Error(`Azure Speech API failed (${response.status}): ${errorText}`);
    }

    return await response.arrayBuffer();

  } catch (error) {
    console.error("Error generating audio:", error);
    throw error;
  }
};
