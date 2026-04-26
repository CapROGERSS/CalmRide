import { GoogleGenAI, Type } from "@google/genai";
import { StressProfile, PredictionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeStress(profile: StressProfile): Promise<PredictionResult> {
  const prompt = `Analyze the potential stress level for a driver with the following profile:
- Age: ${profile.age} years old
- Commute Time: ${profile.commuteTime} minutes
- Sleep Last Night: ${profile.sleepHours} hours
- Traffic Condition: ${profile.trafficState}
- Current Mood/Context: ${profile.mood}

Provide a prediction result in JSON format including:
1. stressScore: A number from 1 to 10.
2. confidence: A number from 0 to 1 representing the prediction confidence.
3. primaryStressors: An array of 2-3 main reasons for this stress level.
4. remedies: An array of 3 actionable, real-time stress relief tips for someone currently in a car.
5. whatIfScenarios: An array of 2 objects describing how the stress would change if conditions changed (e.g., "If traffic becomes heavy", "If sleep improves"). 
   Each must have: title, description, projectedScore, and trend ('up' or 'down').`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stressScore: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            primaryStressors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            remedies: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            whatIfScenarios: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  projectedScore: { type: Type.NUMBER },
                  trend: { type: Type.STRING, enum: ['up', 'down'] }
                },
                required: ['title', 'description', 'projectedScore', 'trend']
              }
            }
          },
          required: ['stressScore', 'confidence', 'primaryStressors', 'remedies', 'whatIfScenarios']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as PredictionResult;
  } catch (error) {
    console.error("Stress analysis failed:", error);
    // Return a safe fallback
    return {
      stressScore: 5,
      confidence: 0.5,
      primaryStressors: ["Insufficient data"],
      remedies: ["Take a deep breath", "Adjust your seat", "Listen to calm music"],
      whatIfScenarios: [
        { title: "If traffic clears", description: "Standard reduction", projectedScore: 3, trend: 'down' },
        { title: "If delay persists", description: "Standard increase", projectedScore: 7, trend: 'up' }
      ]
    };
  }
}
