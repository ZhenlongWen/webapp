import { Application, Router, Context } from "https://deno.land/x/oak@v12.6.0/mod.ts";
import { promptGPT } from "./shared/openai.ts";

const app = new Application();
const router = new Router();

// Root route to check if the server is running
router.get("/", (ctx) => {
  ctx.response.body = "Welcome to the Image Analysis API!";
});

// Route to handle image upload and interpretation using promptGPT
router.post("/api/analyze", async (ctx: Context) => {
  try {
    const body = await ctx.request.body({ type: "form-data" }).value;
    const file = body.get("image");

    if (file && file instanceof File) {
      // Convert the image file to a base64 string
      const fileData = await file.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(fileData)));

      // Use promptGPT to analyze the image
      const description = await promptGPT(`Analyze the contents of this image: ${base64Image}`);

      // Respond with the generated description
      ctx.response.status = 200;
      ctx.response.body = { description };
    } else {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid image upload" };
    }
  } catch (error) {
    console.error("Error analyzing image:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to analyze image" };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

// Start the server for Deno Deploy
addEventListener("fetch", app.fetch);