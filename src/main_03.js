// Import the the Application and Router classes from the Oak module
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// Import the createExitSignal function from the JS+OAI shared library
import { createExitSignal } from "./shared/server.ts";

// Create an instance of the Application and Router classes
const app = new Application();
const router = new Router();

// Configure a custom route
// This function will run when "/api/test" is requested
router.get("/api/test", (ctx) => {
  console.log("someone made a request to /api/test");

  // output some info about the request
  const myParam = ctx.request.url.searchParams.get("myParam");
  console.log("ctx.request.url.pathname:", ctx.request.url.pathname);
  console.log("myParam:", myParam);
  console.log("ctx.request.method:", ctx.request.method);

  // send a response back to the browser with the value of myParam
  ctx.response.body = `You sent the parameter 'myParam' with the value: ${myParam}`;
});

// Tell the app to use the router
app.use(router.routes());
app.use(router.allowedMethods());

// Provide a function to handle requests to unknown routes
app.use((ctx) => {
  console.log("someone made a default request");
  ctx.response.type = "text/html";
  ctx.response.body = `
    <h1>Welcome to the Experimental Oak Server!</h1>
    <p>This is the default route.</p>
    <p>Try visiting a custom route like <a href="http://localhost:8000/api/test?myParam=hello">/api/test?myParam=hello</a> to see more.</p>
  `;
});

// Everything is set up, let's start the server
console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });