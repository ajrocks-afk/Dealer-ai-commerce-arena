import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");

const match = env.match(/^GEMINI_API_KEY=(.*)$/m);

if (!match) {
  console.error("GEMINI_API_KEY was not found in .env.local");
  process.exit(1);
}

const apiKey = match[1].trim().replace(/^["']|["']$/g, "");

console.log("Gemini API key found:", apiKey.length > 0);

const client = new GoogleGenAI({
  apiKey,
});

try {
  console.log("Sending direct Gemini test...");

  const response = await client.models.generateContent({
    model: "gemini-3.6-flash",
    contents: "Reply with exactly: GEMINI_TEST_OK",
  });

  console.log("GEMINI SUCCESS:");
  console.log(response.text);
} catch (error) {
  console.error("GEMINI FAILED:");
  console.error(error);
}