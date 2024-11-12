import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";
import { createExitSignal, staticServer } from "./shared/server.ts";

const app = new Application();
const router = new Router();

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
  
router.get("/api/fortune", (ctx) => {
  const name = ctx.request.url.searchParams.get("name");
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

app.use(router.routes());
app.use(router.allowedMethods());

app.use(staticServer);

// Everything is set up, let's start the server
console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });