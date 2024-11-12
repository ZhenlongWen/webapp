import { Application, Router, send } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { createExitSignal, staticServer } from "./shared/server.ts";

const app = new Application();
const router = new Router();

// API route to roll a dice
router.get("/api/d6", (ctx) => {
  const roll = Math.floor(Math.random() * 6) + 1;
  ctx.response.body = { value: roll };
});

// API test route
router.get("/api/test", (ctx) => {
  console.log("Received request to /api/test");
  console.log("Path:", ctx.request.url.pathname);
  console.log("Parameter:", ctx.request.url.searchParams.get("myParam"));
  console.log("Method:", ctx.request.method);
  ctx.response.body = "This is a test.";
});

// API route to provide a fortune
router.get("/api/fortune", (ctx) => {
  const name = ctx.request.url.searchParams.get("name") || "friend";
  const fortunes = [
    `Good things are coming your way, ${name}!`,
    `${name}, a pleasant surprise awaits you.`,
    `${name}, an old friend will bring you joy.`,
    `${name}, trust your instincts in the days ahead.`,
    `A great adventure is on the horizon for you, ${name}.`
  ];
  const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
  ctx.response.body = randomFortune;
});

// Register API routes
app.use(router.routes());
app.use(router.allowedMethods());

// Serve static files and handle subpaths
app.use(async (ctx, next) => {
  try {
    // Serve static files from the "public" directory
    await send(ctx, ctx.request.url.pathname, {
      root: "./public",
      index: "index.html",
    });
  } catch {
    // If the file is not found, serve the main "index.html"
    await send(ctx, "/index.html", { root: "./public" });
  }
  await next();
});

// Start the server with Deno Deploy's PORT or default to 8000
const port = Number(Deno.env.get("PORT") || 8000);
console.log(`\nListening on http://localhost:${port}`);
await app.listen({ port });