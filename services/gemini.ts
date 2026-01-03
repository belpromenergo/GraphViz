
import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../i18n";

export const getMathInsights = async (expression: string, lang: Language): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langName = lang === 'ru' ? 'Russian' : 'English';
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain the mathematical properties and physical significance of the function f(x) = ${expression}. 
      Mention its general shape, interesting properties, and real-world applications. 
      Respond strictly in ${langName}. Keep it concise (under 100 words).`,
    });
    return response.text || (lang === 'ru' ? "Нет данных." : "No insights available.");
  } catch (error) {
    console.error("AI Insight Error:", error);
    return lang === 'ru' ? "Ошибка ИИ. Попробуйте позже." : "AI error. Please try again later.";
  }
};

export const getDiscoveryInfo = async (expression: string, lang: Language): Promise<{ history: string, example: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langName = lang === 'ru' ? 'Russian' : 'English';
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a historical and practical analysis of the function family represented by: f(x) = ${expression}.
      
      Requirements:
      1. Identify the specific function type (e.g., sine wave, logistic curve, catenary, polynomial).
      2. Historical Origin: Who discovered or first formally studied THIS SPECIFIC function/curve and when? Do not talk about Newton/Leibniz unless they specifically discovered this curve. For example, if it's a sine wave, talk about Aryabhata or Hipparchus. If it's a normal distribution, talk about Gauss/De Moivre.
      3. Practical Usage: Describe one vivid, real-world modern application of this specific function.
      
      Respond strictly in ${langName}. Format as JSON with keys "history" and "example".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            history: {
              type: Type.STRING,
              description: 'Historical biography of the specific function type.',
            },
            example: {
              type: Type.STRING,
              description: 'Practical modern application example.',
            },
          },
          required: ["history", "example"],
        }
      }
    });
    
    try {
        const jsonStr = response.text?.trim() || '{}';
        const data = JSON.parse(jsonStr);
        return {
            history: data.history || (lang === 'ru' ? "История недоступна." : "History unavailable."),
            example: data.example || (lang === 'ru' ? "Пример недоступен." : "Example unavailable.")
        };
    } catch (e) {
        return { 
            history: response.text || (lang === 'ru' ? "Ошибка разбора." : "Parse error."), 
            example: lang === 'ru' ? "Попробуйте еще раз." : "Try again." 
        };
    }
  } catch (error) {
    console.error("AI Discovery Error:", error);
    return {
        history: lang === 'ru' ? "Ошибка ИИ." : "AI Error.",
        example: lang === 'ru' ? "Не удалось загрузить данные." : "Failed to load data."
    };
  }
};
