import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { promptGPT } from "./shared/openai.ts"; // Import your custom promptGPT function


const app = new Application();
const router = new Router();

// Route to handle image upload and interpretation using promptGPT
router.post("/api/analyze", async (ctx) => {
  const body = await ctx.request.body({ type: "form-data" }).value;
  const file = body.get("image");

  if (file && file instanceof File) {
    try {
      // Convert the image file to a base64 string
      const fileData = await file.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(fileData)));

      // Use promptGPT to analyze the image
      const description = await promptGPT(`Analyze the contents of this image: ${base64Image}`);

      // Respond with the generated description
      ctx.response.body = { description };
    } catch (error) {
      console.error("Error analyzing image:", error);
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