// backend/controllers/aiController.js
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

// Initialize Groq with your API key from environment variables
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateAIText = async (req, res) => {
  const { prompt, context } = req.body;

  try {
    const response = await groq.chat.completions.create({
      // Llama 3.3 70B is incredibly fast on Groq
      model: "llama-3.3-70b-versatile",
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
      // Optional: Adjust temperature for more creative or factual responses
      temperature: 0.7,
      max_tokens: 1024,
    });

    const suggestion = response.choices[0]?.message?.content;

    if (!suggestion) {
      throw new Error("No suggestion returned from Groq");
    }

    res.status(200).json({ suggestion });
  } catch (error) {
    // Log the specific Groq error details for debugging
    console.error("GROQ AI ERROR:", error.response?.data || error.message);

    res.status(500).json({
      message: "AI Generation failed",
      details: error.message,
    });
  }
};
