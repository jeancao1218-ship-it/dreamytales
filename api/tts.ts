function methodNotAllowed(res: any) {
  res.statusCode = 405;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "Method not allowed" }));
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const speechKey = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION || "japaneast";

  if (!speechKey) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error: "Missing server configuration. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.",
      })
    );
    return;
  }

  const body = req.body || {};
  const text = typeof body.text === "string" ? body.text : "";

  if (!text.trim()) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Missing text" }));
    return;
  }

  const voice = "zh-CN-XiaoxiaoNeural";
  const style = "affectionate";
  const rate = "-15%";
  const pitch = "-5%";

  const safeText = escapeXml(text);

  const ssml = `
<speak version='1.0' xml:lang='zh-CN' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'>
  <voice name='${voice}'>
    <mstts:express-as style='${style}'>
      <prosody rate='${rate}' pitch='${pitch}'>
        ${safeText}
      </prosody>
    </mstts:express-as>
  </voice>
</speak>
`;

  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": speechKey,
        "Ocp-Apim-Subscription-Region": region,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        "User-Agent": "DreamyTales",
      },
      body: ssml,
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.statusCode = response.status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: errorText }));
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    res.statusCode = 200;
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.end(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: err?.message || "TTS failed" }));
  }
}
