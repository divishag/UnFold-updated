const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3000;
const { GoogleGenerativeAI } = require('@google/generative-ai');

app.use(cors());
app.use(express.json());
// Ensure your client-side files are served from a 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const mindMaps = {}; // Store for mind maps
// The API key must be available in the environment variables (e.g., in a .env file)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use a modern, fast model for chat like gemini-2.5-flash
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// API routes
app.get('/api/mindmaps/:caseId', (req, res) => {
    const { caseId } = req.params;
    if (mindMaps[caseId]) {
        res.json(mindMaps[caseId]);
    } else {
        res.status(404).json({ message: 'Mind map not found' });
    }
});

app.post('/api/chat', async (req, res) => {
    const { messages, currentCaseTitle } = req.body;

    if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages must be an array" });
    }

    // --- Correctly format messages for Gemini API ---
    const contents = messages.map(msg => ({
        // Map 'assistant' (client-side) to 'model' (Gemini API's role for AI)
        role: msg.role === "assistant" ? "model" : "user", 
        parts: [{ text: msg.content }]
    }));

    // Add a system instruction to guide the model's behavior
    const systemInstruction = `You are a helpful, historical detective's assistant for the case: "${currentCaseTitle}". Use the provided chat history and evidence to help the user build their mind map. Be insightful, but brief.`;


    try {
        const aiResponse = await model.generateContent({
            // Pass the correctly formatted conversation history
            contents: contents, 
            // --- FIX: Use systemInstruction directly in the payload or use systemInstruction field ---
            systemInstruction: systemInstruction, 
        });

        // --- CRITICAL FIX: Manually extract text from the raw response structure ---
        // When using a contents array, the SDK may return a raw response object.
        const reply = aiResponse.response?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (reply) {
            // --- SUCCESS PATH: Text found and returned ---
            res.json({ reply });
        } else {
            // --- FALLBACK/DEBUGGING PATH: Log the full response if text is missing ---
            console.error("Gemini API Error: AI response was successful but contained no text. Full response:", JSON.stringify(aiResponse, null, 2));
            res.status(500).json({ error: "AI request succeeded, but received no text response. Check server logs for full response structure." });
        }
    } catch (err) {
        // This block catches network errors or 4xx/5xx responses
        console.error("Gemini API Error:", err.message);
        // Include error details for easier debugging
        res.status(500).json({ error: "AI request failed", details: err.message });
    }
});


app.post('/api/mindmaps/:caseId', (req, res) => {
    const { caseId } = req.params;
    mindMaps[caseId] = req.body;
    res.json({ message: 'Mind map saved successfully' });
});

// Catch-all to serve the index.html for SPA routing
// This should serve the file from the 'public' directory
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
