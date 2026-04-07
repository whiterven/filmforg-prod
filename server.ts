import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import os from "os";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post("/api/upload-script", async (req, res) => {
    let tmpFilePath = "";
    try {
      const { fileName, mimeType, fileData, isFile, apiKey } = req.body;
      
      // If apiKey is explicitly passed from frontend and is valid, use it.
      // Otherwise, let the SDK automatically use process.env.GEMINI_API_KEY
      const aiConfig: any = {};
      if (apiKey && apiKey !== "undefined" && apiKey !== "MY_GEMINI_API_KEY") {
        aiConfig.apiKey = apiKey;
      }
      
      const ai = new GoogleGenAI(aiConfig);
      
      tmpFilePath = path.join(os.tmpdir(), `upload-${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
      
      if (isFile) {
        const buffer = Buffer.from(fileData, 'base64');
        fs.writeFileSync(tmpFilePath, buffer);
      } else {
        fs.writeFileSync(tmpFilePath, fileData);
      }

      const fileSearchStore = await ai.fileSearchStores.create({
        config: { displayName: `store-${Date.now()}` }
      });

      let operation = await ai.fileSearchStores.uploadToFileSearchStore({
        file: tmpFilePath,
        fileSearchStoreName: fileSearchStore.name,
        config: {
          displayName: fileName,
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        operation = await ai.operations.get({ operation });
      }

      res.json({ fileSearchStoreName: fileSearchStore.name });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    } finally {
      if (tmpFilePath && fs.existsSync(tmpFilePath)) {
        fs.unlinkSync(tmpFilePath);
      }
    }
  });

  app.post("/api/analyze-script", async (req, res) => {
    try {
      const { fileSearchStoreName, apiKey } = req.body;
      
      const aiConfig: any = {};
      if (apiKey && apiKey !== "undefined" && apiKey !== "MY_GEMINI_API_KEY") {
        aiConfig.apiKey = apiKey;
      }
      
      const ai = new GoogleGenAI(aiConfig);
      
      const prompt = `
        Analyze the script and extract a list of distinct visual shots.
        For each shot, provide:
        - sceneReference: A short name for the scene
        - description: A brief description of the action.
        - characters: Array of character names in the shot.
        - location: The location of the shot.
        - imagePrompt: A highly detailed prompt for an image generation model.
        - videoPrompt: A prompt for a video generation model.
        - durationEstimate: Estimated duration (e.g., "~4 sec").
        
        Return the result as a JSON array of objects.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [
            {
              fileSearch: {
                fileSearchStoreNames: [fileSearchStoreName]
              }
            }
          ]
        }
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
