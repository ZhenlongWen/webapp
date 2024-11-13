import { Application, Router } from "https://deno.land/x/oak@v12.6.0/mod.ts";

// Initialize a new Router
const router = new Router();

// Route to handle image upload and respond with "yes"
router.post("/api/analyze", async (ctx) => {
  try {
    // Get the form data
    const body = await ctx.request.body({ type: "form-data" }).value;
    const file = body.get("image");

    // Check if a file was uploaded
    if (file && file instanceof File) {
      console.log("Image received:", file.name);
      ctx.response.status = 200;
      ctx.response.body = { description: "yes" };
    } else {
      ctx.response.status = 400;
      ctx.response.body = { description: "No image uploaded" };
    }
  } catch (error) {
    console.error("Error processing request:", error);
    ctx.response.status = 500;
    ctx.response.body = { description: "Server error" };
  }
});

// Initialize the Oak application
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

// Use the event listener pattern required by Deno Deploy
addEventListener("fetch", (event) => {
  event.respondWith(app.handle(event.request));
});