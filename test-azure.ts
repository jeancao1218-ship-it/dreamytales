import { AzureOpenAI } from "openai";

// Configuration (do NOT hardcode secrets)
// Provide via environment variables when running this script.
// Example:
// AZURE_OPENAI_ENDPOINT=... AZURE_OPENAI_API_KEY=... AZURE_OPENAI_TEXT_DEPLOYMENT=... tsx test-azure.ts
const endpoint = process.env.AZURE_OPENAI_ENDPOINT || process.env.VITE_AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.VITE_AZURE_OPENAI_API_KEY;
const textDeployment = process.env.AZURE_OPENAI_TEXT_DEPLOYMENT || process.env.VITE_AZURE_OPENAI_TEXT_DEPLOYMENT || "gpt-5-chat";
const ttsDeployment = process.env.AZURE_OPENAI_TTS_DEPLOYMENT || process.env.VITE_AZURE_OPENAI_TTS_DEPLOYMENT || "gpt-4o-mini-tts";
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-05-01-preview";

if (!endpoint || !apiKey) {
  throw new Error(
    "Missing AZURE_OPENAI_ENDPOINT/AZURE_OPENAI_API_KEY (or VITE_AZURE_OPENAI_ENDPOINT/VITE_AZURE_OPENAI_API_KEY)."
  );
}

const client = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion,
  // deployment: textDeployment // Removed global deployment setting
});

async function testTextGeneration() {
  console.log("Testing Text Generation with model:", textDeployment);
  try {
    const response = await client.chat.completions.create({
      model: textDeployment,
      messages: [
        { role: "system", content: "You are a helpful assistant. Respond in JSON format." },
        { role: "user", content: "Give me a story title and content." }
      ],
      response_format: { type: "json_object" }, // Testing JSON mode
      max_tokens: 100
    });
    console.log("Text Generation Success:", response.choices[0].message.content);
    return true;
  } catch (error) {
    console.error("Text Generation Failed:", error.message);
    if (error.code) console.error("Error Code:", error.code);
    if (error.type) console.error("Error Type:", error.type);
    return false;
  }
}

async function testAudioGeneration() {
  console.log("\nTesting Audio Generation with model:", ttsDeployment);
  try {
    const response = await client.audio.speech.create({
      model: ttsDeployment,
      voice: "alloy",
      input: "Hello, this is a test.",
    });
    console.log("Audio Generation Success: Received buffer of size", (await response.arrayBuffer()).byteLength);
    return true;
  } catch (error) {
    console.error("Audio Generation Failed:", error.message);
     if (error.code) console.error("Error Code:", error.code);
    if (error.type) console.error("Error Type:", error.type);
    return false;
  }
}

async function runTests() {
  const textSuccess = await testTextGeneration();
  if (textSuccess) {
      await testAudioGeneration();
  } else {
      console.log("Skipping Audio Test because Text Test failed.");
  }
}

runTests();
