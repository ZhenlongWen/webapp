// src/main_05_joke.js
// Simple Deno backend with a static server and a custom route that
// uses the OpenAI API to generate jokes.

// ?
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// ?
import { createExitSignal, staticServer } from "./shared/server.ts";

// ?
import { promptGPT } from "./shared/openai.ts";

// ?
const app = new Application();
const router = new Router();

// ?
router.get("/api/joke", async (ctx) => {
  // ?
  const topic = ctx.request.url.searchParams.get("topic");

  // ?
  console.log("someone made a request to /api/joke", topic);

  // ?
  const joke = await promptGPT(`Tell me a brief joke about ${topic}.`);

  // ?
  ctx.response.body = joke;
});

// ?
app.use(router.routes());
app.use(router.allowedMethods());

// ?
app.use(staticServer);

// ?
console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });

// Create an instance of the Application and Router classes
// Everything is set up, let's start the server
// Import the promptGPT function from the class library
// Create a route to handle requests to /api/joke
// Ask GPT to generate a joke about the topic
// Get the topic from the query string `?topic=...`
// Log the request to the terminal
// Import the the Application and Router classes from the Oak module
// Import server helper functions from the class library
// Send the joke back to the client
// Try serving undefined routes with static files
// Tell the app to use the custom routes
