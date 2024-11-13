import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { createExitSignal, staticServer } from "./shared/server.ts";
import { promptGPT } from "./shared/openai.ts";


const app = new Application();
const router = new Router();


router.post("/api/analyze", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "form-data" }).value;
    const file = body.get("image");

    // Check if an image file was uploaded
    if (file && file instanceof File) {
      console.log("Image received:", file.name);

      // Convert the image to a base64 string
      const fileData = await file.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(fileData)));

      // Use promptGPT to analyze the image
      const prompt = `Analyze the contents of this image: ${base64Image}`;
      const description = await promptGPT(prompt);

      // Respond with the generated description
      ctx.response.status = 200;
      ctx.response.body = { description };
    } else {
      ctx.response.status = 400;
      ctx.response.body = { error: "No image uploaded" };
    }
  } catch (error) {
    console.error("Error processing image:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to analyze image" };
  }
});



app.use(router.routes());
app.use(router.allowedMethods());


app.use(staticServer);


console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });