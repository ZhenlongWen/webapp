import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { createExitSignal } from "./shared/server.ts";  // Adjust path if needed

const app = new Application();
const router = new Router();

// Dice roll route
router.get("/api/d6", (ctx) => {
  const roll = Math.floor(Math.random() * 6) + 1;
  ctx.response.body = { value: roll };
});

router.get("/api/test", (ctx) => {
    console.log("someone made a request to /api/test");
  
    // output some info about the request
    console.log("ctx.request.url.pathname:", ctx.request.url.pathname);
    console.log("myParam:", ctx.request.url.searchParams.get("myParam"));
    console.log("ctx.request.method:", ctx.request.method);
  
    // send a response back to the browser
    ctx.response.body = "This is a test.";
  });
  
// Set up routes
app.use(router.routes());
app.use(router.allowedMethods());

// Serve static files
app.use(async (ctx, next) => {
  try {
    await ctx.send({ root: `${Deno.cwd()}/public`, index: "index.html" });
  } catch {
    await next();
  }
});

// Start the server
console.log("Listening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });