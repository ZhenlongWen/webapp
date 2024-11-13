import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.js";
import { config } from "https://deno.land/x/dotenv/mod.js";
import { promptGPT } from "./shared/openai.js";

config(); // Load environment variables

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const app = new Application();
const router = new Router();

// Function to analyze the uploaded image using OpenAI's GPT-4 vision capabilities
async function analyzeImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4-vision",
      messages: [
        {
          role: "system",
          content: "You are an AI that interprets the contents of images.",
        },
        {
          role: "user",
          content: "Describe the contents of this uploaded image.",
        },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || "No description available.";
}

router.post("/api/analyze", async (ctx) => {
  const body = await ctx.request.body({ type: "form-data" }).value;
  const file = body.get("image");

  if (file && file instanceof File) {
    try {
      const description = await analyzeImage(file);
      ctx.response.body = { description };
    } catch (error) {
      console.error("Error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to analyze image" };
    }
  } else {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid image upload" };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 8000;
console.log(`Server running on http://localhost:${PORT}`);
await app.listen({ port: PORT });