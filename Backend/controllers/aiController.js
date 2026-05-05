// backend/controllers/aiController.js
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config(); //

// Initialize Groq with your API key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateAIText = async (req, res) => {
  // Defensive check: ensure context is at least an empty string to avoid .replace errors
  const { prompt, context = "" } = req.body;

  try {
    const response = await groq.chat.completions.create({
      // Llama 3.3 70B is the modern high-performance model for Groq
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a professional writing assistant. Based on the document context provided, fulfill the user's request accurately.",
        },
        {
          role: "user",
          content: `Document Context: "${context}"\n\nTask: ${prompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const suggestion = response.choices[0]?.message?.content;

    if (!suggestion) {
      throw new Error("Groq returned an empty response.");
    }

    res.status(200).json({ suggestion });
  } catch (error) {
    // Detailed logging for your Render dashboard
    console.error("GROQ AI ERROR:", error.message);

    res.status(500).json({
      message: "AI Generation failed",
      details: error.message,
    });
  }
};
