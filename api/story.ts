import { AzureOpenAI } from "openai";

const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-05-01-preview";

function badRequest(res: any, message: string) {
  res.statusCode = 400;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: message }));
}

function methodNotAllowed(res: any) {
  res.statusCode = 405;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "Method not allowed" }));
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const textDeployment = process.env.AZURE_OPENAI_TEXT_DEPLOYMENT;

  if (!endpoint || !apiKey || !textDeployment) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error:
          "Missing server configuration. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_TEXT_DEPLOYMENT.",
      })
    );
    return;
  }

  const body = req.body || {};
  const settings = body.settings;
  const sequelContext = typeof body.sequelContext === "string" ? body.sequelContext : undefined;

  if (!settings) return badRequest(res, "Missing settings");

  const {
    childName,
    age,
    mainCharacter,
    secondaryCharacters,
    scene,
    theme,
    language,
    customPrompt,
  } = settings;

  if (!childName || !age || !mainCharacter || !scene || !theme || !language) {
    return badRequest(res, "Invalid settings payload");
  }

  const others = Array.isArray(secondaryCharacters) ? secondaryCharacters : [];
  const characterStr = others.length > 0 ? `和其他小伙伴: ${others.join(", ")}` : "";

  const systemPrompt = `
你是一个温柔的睡前故事讲述者。
请为一个叫 ${childName} 的 ${age} 岁小朋友讲一个睡前故事。

【故事设定】
1. 故事背景/场景: ${scene}。
2. 核心主角: ${childName} (小朋友本人)。
3. 陪伴伙伴: 最好的朋友 ${mainCharacter} ${characterStr}。
4. 故事主题/寓意: ${theme}。
5. 额外要求: ${customPrompt || "无"}。

【讲述要求】
1. 语气温柔、舒缓、有画面感，适合儿童睡前。
2. 故事温馨正能量，结局安心。
3. 语言风格: ${language === "Chinese" ? "中文" : "English"}。
4. 字数适中，适合3-5分钟朗读。

请严格按照以下 JSON 格式返回结果：
{
  "title": "一个简短可爱的标题",
  "content": "故事的正文内容..."
}
`;

  let userMessage = "请开始讲故事。";
  if (sequelContext) {
    userMessage += `\n\n【续集模式开启】\n这是一个连续剧故事的最新一集。\n\n上一集剧情回顾:\n"${sequelContext.substring(
      0,
      800
    )}..."\n\n续写要求:\n1. 必须自然承接上一集结尾或核心事件。\n2. 角色要记得上一集发生的事。\n3. 在新场景 ${scene} 中展开，但融入上一集元素。\n4. 保持角色性格一致。\n\n请开始讲述续集！`;
  }

  const client = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
    dangerouslyAllowBrowser: false,
  });

  try {
    const response = await client.chat.completions.create({
      model: textDeployment,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "No content from model" }));
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Model did not return valid JSON" }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        title: String(parsed.title || ""),
        content: String(parsed.content || ""),
      })
    );
  } catch (err: any) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error: err?.message || "Failed to generate story",
      })
    );
  }
}
