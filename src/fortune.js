import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { createExitSignal, staticServer } from "./shared/server.ts";
import { promptGPT } from "./shared/openai.ts";


const app = new Application();
const router = new Router();


// Route to handle image upload
router.post("/api/analyze", async (ctx) => {
  try {
    console.log("ctx.request.url.pathname:", ctx.request.url.pathname);
    console.log("ctx.request.method:", ctx.request.method);

    // Parse the JSON body
    const { image } = await ctx.request.body({ type: "json" }).value;

    if (!image) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "No image provided" };
      return;
    }

    console.log("Received Image URL:", image.slice(0, 50)); // Log the first 50 characters of the image URL

    // Pass the image URL to the GPT function to generate a query
    const query = await getQuery(image);

    // Send back the query result
    ctx.response.body = { success: true, query };
  } catch (error) {
    console.error("Error processing request:", error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error" };
  }
});



app.use(router.routes());
app.use(router.allowedMethods());


app.use(staticServer);


console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });

async function getQuery(imageURL) {
  const response = await gpt({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze the artwork and provide a query to search a vector database for similar artworks. You do not have to identify people, only form the query. Be as specific as you can in your analysis but produce an efficient query.
            Here are a few examples of the strings used to generate the embeddings:
             Example 1: *Artist*: Bartolomé Estéban Murillo; *Title*: Saint John the Baptist Pointing to Christ; *Date*: c. 1655; *Subjects*: Jesus, Saint John the Baptist, religion, religious, religious figures, Christian subjects, Christianity, eagles, trees, paths, landscape, sky, clouds, water, river, staffs, purple (color), red (color), cows; *Classifications*: oil on canvas, paint, oil paintings (visual works), Italian, painting, european painting; *Terms*: oil on canvas, 17th Century, oil painting, oil paint (paint), Jesus, painting techniques, painting (image making), painting, painting, paint, canvas, paint, oil paintings (visual works), Italian, Saint John the Baptist, religion, religious, religious figures, Christian subjects, Christianity, eagles, trees, paths, landscape, sky, clouds, water, river, staffs, purple (color), red (color), cows, painting, european painting; *Medium*: Oil on canvas; *Artist Genes*: 17th Century Art, Baroque, Christian Art and Architecture, Cultural Commentary, Drawing, Figurative Painting, Highly Detailed, Human Figure, Individual Portrait, Oil Painting, Painting, Portrait, Related to Religion, Royal/Court Commission, Spanish Art, ; *Movement*: Baroque; *Genre*: religious painting
             Example 2: *Artist*: Vilhelm Hammershøi; *Title*: Interior. The Music Room, Strandgade 30; *Date*: 1907; *Subjects*: interior, light, window, chair, instruments, pianos, gray (color), musical instruments, still life, music; *Classifications*: painting, european painting, oil, oil on canvas, paint, oil paintings (visual works); *Terms*: oil paint (paint), painting, interior, 20th Century, painting, light, window, chair, instruments, pianos, european painting, oil, oil on canvas, paint, canvas, paint, painting, painting (image making), painting techniques, oil paintings (visual works), gray (color), musical instruments, still life, music, oil painting, oil; *Medium*: Oil on canvas; *Artist Genes*: Modern, Blurred, Dark Colors, En plein air, Figurative Art, Figurative Painting, Figure from the Back (Rückenfigur), Human Figure, Individual Portrait, Interiors, Landscapes, Large Brushstrokes/Loose Brushwork, Late 19th Century Art, Light as Subject, Mediated View, Oil Painting, Painting, Pastel Colors, Personal Histories, Photorealistic, Repetition, Scandinavian Art, Scenes of Everyday Life; *Genre*: portrait painting
             Example 3: *Artist*: Jim Nutt; *Title*: Miss E. Knows; *Date*: 1967; *Subjects*: figures (representations), women, anatomy, planes, nudes, cartoons, flashlights, bullets, abstract figures, men; *Classifications*: painting, modern and contemporary art; *Terms*: painting, Plexiglas (TM), painting (image making), figures (representations), contemporary, 20th Century, rubber (material), aluminum (metal), acrylic paint, modern and contemporary art, women, anatomy, planes, nudes, cartoons, flashlights, bullets, abstract figures, men; *Medium*: Acrylic on Plexiglas with aluminum and rubber; in artist's painted frame; *Artist Genes*: Modern, Art of the 1960s, Contemporary, Chicago Imagists, Comic/Cartoon, Drawing, Erotic, Figurative Painting, Flatness, Grotesque, Human Figure, Individual Portrait, Nude, Painting, Pop Art, Popular Culture, Portrait, American Art, 
             Example 4: *Artist*: Claude Monet; *Title*: Branch of the Seine near Giverny (Mist); *Date*: 1897; *Subjects*: landscapes, white (color), river, reflections, purple (color), blue (color), weather/seasons, water; *Classifications*: painting, oil on canvas, oil paintings (visual works), paint, french, european painting; *Terms*: painting, oil painting, Impressionism, landscapes, oil paint (paint), white (color), river, reflections, purple (color), blue (color), nineteenth century, 19th century, painting techniques, painting (image making), painting, painting, paint, canvas, oil on canvas, oil paintings (visual works), paint, french, european painting, weather/seasons, water; *Medium*: Oil on canvas; *Movement*: Impressionism; *Genre*: landscape painting
             Example 5: *Artist*: Henry Ward Ranger; *Title*: Brooklyn Bridge; *Date*: 1899; *Subjects*: cityscapes, Century of Progress, world's fairs, Chicago World's Fairs, architecture, landscapes; *Classifications*: painting, american arts; *Terms*: painting, oil paint (paint), Impressionism, cityscapes, organic material, american arts, Century of Progress, world's fairs, Chicago World's Fairs, architecture, landscapes; *Medium*: Oil on canvas; *Artist Genes*: Modern, American Tonalism, Figurative Painting, Landscapes, Large Brushstrokes/Loose Brushwork, Late 19th Century Art, Light as Subject, Nature, Painting, American Art; *Genre*: landscape painting
              //
             Only respond with the query. Even if you know the artist and/or title, omit them but take them into consideration when forming the descriptions for the query.`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageURL,
            },
          },
        ],
      },
    ],
    max_tokens: 1000,
    temperature: 0.8,
  });
  console.log(response.content);
  return response.content;
}