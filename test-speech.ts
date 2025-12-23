// import 'dotenv/config';
// import fetch from 'node-fetch';
// Use global fetch if available (Node 18+)
const fetch = globalThis.fetch;

// Configuration (do NOT hardcode secrets)
// Example:
// AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=japaneast tsx test-speech.ts
const speechKey = process.env.AZURE_SPEECH_KEY || process.env.VITE_AZURE_SPEECH_KEY;
const speechRegion = process.env.AZURE_SPEECH_REGION || process.env.VITE_AZURE_SPEECH_REGION || "japaneast";

if (!speechKey) {
    throw new Error("Missing AZURE_SPEECH_KEY (or VITE_AZURE_SPEECH_KEY)");
}

async function testSpeech() {
    console.log("Testing Azure Speech API...");
    console.log("Region:", speechRegion);
    console.log("Key Length:", speechKey.length);

    const url = `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
    
    const ssml = `
      <speak version='1.0' xml:lang='zh-CN' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'>
        <voice name='zh-CN-XiaoxiaoNeural'>
            你好，这是一个测试。
        </voice>
      </speak>
    `;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Ocp-Apim-Subscription-Region': speechRegion,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                'User-Agent': 'DreamyTales-Test'
            },
            body: ssml
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`FAILED: ${response.status} ${response.statusText}`);
            console.error("Response:", text);
        } else {
            console.log("SUCCESS! Audio generated.");
            const buffer = await response.arrayBuffer();
            console.log("Received bytes:", buffer.byteLength);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

testSpeech();
