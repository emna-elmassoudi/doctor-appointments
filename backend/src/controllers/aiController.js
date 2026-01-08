const { GoogleGenerativeAI } = require("@google/generative-ai");

function getGeminiKey() {
  const raw = process.env.GEMINI_API_KEY || "";
  return raw.replace(/[^\x00-\x7F]/g, "").trim();
}

exports.aiChat = async (req, res) => {
  try {
    const { message, role = "patient" } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "message is required" });
    }

    const apiKey = getGeminiKey();
    if (!apiKey) return res.status(500).json({ message: "GEMINI_API_KEY missing in .env" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const system = `
You are an assistant inside a doctor-appointments web app.
Give general guidance only (NOT medical diagnosis).
If symptoms are urgent/severe: advise emergency services.
Be concise and friendly. The user role is: ${role}.
`;

    const prompt = `${system}\nUser: ${message}\nAssistant:`;

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || "No response.";

    return res.json({ reply: text });
  } catch (err) {
    console.error("AI error:", err);
    return res.status(500).json({ message: "AI error", error: String(err?.message || err) });
  }
};
