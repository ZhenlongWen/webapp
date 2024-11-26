import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { createExitSignal, staticServer } from "./shared/server.ts";
import { promptGPT, gpt } from "./shared/openai.ts";
const app = new Application();
const router = new Router();
const apiUrl = `https://api.cooperhewitt.org/`;

router.post("/api/analyze", async (ctx) => {
    console.log("ctx.request.url.pathname:", ctx.request.url.pathname);
    console.log("ctx.request.method:", ctx.request.method);

    const JSONdata = await ctx.request.body({ limit: "20mb" }).value;
    const data = JSON.parse(JSONdata);
    const base64Image = data.image;

    if (!base64Image) {
        ctx.response.status = 400;
        ctx.response.body = { error: "No image file uploaded" };
        return;
    }

    // Call ChatGPT to analyze the image
    const analysis = await analyzeImageWithGPT(base64Image);

    // Now use the analysis term to query the Cooper Hewitt API
    const cooperHewittData = await searchCooperHewittAPI(analysis);
    ctx.response.body = {
        analysis: analysis,
        cooperHewittData: cooperHewittData,
    };
});

// Function to call Cooper Hewitt API with the GPT analysis term
async function searchCooperHewittAPI(analysis) {
    const query = `
        query getObject($description: String!) {
        object(hasImages:true, description: $description) {
          title
          description
          multimedia
          department
        }
      }
    `;

    const variables = {
        description: analysis  // Replace with the actual search description
    };

    const requestBody = {
        query,
        variables
    };

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",  // Correct content type
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Error data:", errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        //console.log("Cooper Hewitt API Response:", data);
        // Assuming the API returns an object with an array of objects
        //console.log(data.data.object[0].multimedia[0].large.url);

        const objects = data.data.object;

        const limitedObjects = objects.slice(0, 10);
        //console.log(limitedObjects);
        return limitedObjects;


        //return data.data.object[0].multimedia[0].large.url;

    } catch (error) {
        console.error("Error searching Cooper Hewitt API:", error);
        throw error;
    }
}

// Function to interact with OpenAI API for image analysis
async function analyzeImageWithGPT(imageBase64) {
    console.log("Complete image data:", imageBase64);
    const response = await gpt({
        model: "gpt-4o",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `Recgonize the main object in this image, output a query term describing what does it look like, avoid words like irregular. 
                        only output the term, try to use one word to describe the most defining feature.
                        examples: Tear drop, Tripod, Stars, tablet, Apple, Fragments, Gourd, wooden box, Spikes....
                        If there's people in it, describe their activity, only using one word.`,
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
}

app.use(router.routes());
app.use(router.allowedMethods());
app.use(staticServer);

console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });
