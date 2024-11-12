import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { createExitSignal } from "./shared/server.ts";

const app = new Application();

// Global variable to keep track of hit count
let hit_counter = 0;

// Default route
app.use((ctx) => {
  hit_counter += 1; // Increment hit counter
  console.log("Received a request, hit count:", hit_counter);
  ctx.response.body = `Hello! This page has been visited ${hit_counter} times.`;
});

console.log("\nListening on http://localhost:8000");

await app.listen({ port: 8000, signal: createExitSignal() });

// Try this with
// http://localhost:8000/
