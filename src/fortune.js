import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { createExitSignal, staticServer } from "./shared/server.ts";
import { promptGPT, gpt } from "./shared/openai.ts";
const app = new Application();
const router = new Router();

router.post("/api/analyze", async (ctx) => {
  console.log("ctx.request.url.pathname:", ctx.request.url.pathname);
  console.log("ctx.request.method:", ctx.request.method);


  const JSONdata = await ctx.request.body({ limit: "20mb" }).value;
  const data = JSON.parse(JSONdata);
  const base64Image = data.image;

  /*   const body = await ctx.request.body({ type: "form-data" }).value;
    const file = body.files?.[0]; */

  if (!base64Image) {
    ctx.response.status = 400;
    ctx.response.body = { error: "No image file uploaded" };
    return;
  }

  // Call ChatGPT to analyze the image
  const analysis = await analyzeImageWithGPT(base64Image);

  ctx.response.body = {
    analysis: analysis,
  };
});

// Function to interact with OpenAI API
async function analyzeImageWithGPT(imageBase64) {
  const response = await gpt({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `recgonize the main object in this image, output a query term describing its shape, only out put the shape.`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64
            },
          }
        ],
      },
    ],
    max_tokens: 1000,
    temperature: 0.8,
  });
  console.log(response.content);
  return response.content;

};


app.use(router.routes());
app.use(router.allowedMethods());


app.use(staticServer);


console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });