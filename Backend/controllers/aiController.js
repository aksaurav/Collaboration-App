// backend/controllers/aiController.js
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5173", // OpenRouter requires a valid URL here
    "X-Title": "Collaboratron",
  },
});

export const generateAIText = async (req, res) => {
  const { prompt, context } = req.body;

  try {
    const response = await openai.chat.completions.create({
      // FIXED MODEL ID: Using the specific OpenRouter string for Gemini Flash
      model: "meta-llama/llama-3.3-70b-instruct",
      messages: [
        {
          role: "system",
          content:
            "You are a professional writing assistant. Based on the document context provided, fulfill the user's request accurately.",
        },
        {
          role: "user",
          content: `Document Context: "${context || "The document is currently empty."}"\n\nTask: ${prompt}`,
        },
      ],
    });

    const suggestion = response.choices[0].message.content;
    res.status(200).json({ suggestion });
  } catch (error) {
    // This will now catch and log the specific reason if it fails again
    console.error("AI ERROR:", error.response?.data || error.message);
    res.status(500).json({
      message: "AI Generation failed",
      details: error.message,
    });
  }
};
