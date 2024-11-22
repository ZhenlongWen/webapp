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

  ctx.response.body = {
    analysis: analysis,
  };
});

const query = `
  query getObject($id: ID!) {
    object(identifier: $id) {
      id
      title
      description
      multimedia
    }
  }
`;

const variables = {
  id: "2018-10-2" // 替换为实际的对象ID
};

const requestBody = {
  query,
  variables
};

async function callCooperHewittApi() {
  try {
    // 设置请求头
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    // 发送POST请求
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",  // Make sure the content type is correct
        ...headers
      },
      body: JSON.stringify(requestBody)  // Correctly stringifying the request body
    });

    // 输出响应的状态码和状态文本
    console.log(`Response status: ${response.status} ${response.statusText}`);

    // 检查响应是否成功
    if (!response.ok) {
      const errorData = await response.text(); // 获取响应体
      console.error("Error data:", errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 解析JSON响应
    const data = await response.json();

    // 打印返回的数据
    console.log("multimedia: ", data.data.object[0].multimedia);

  } catch (error) {
    // 处理错误
    console.error("Error fetching data:", error);
  }
}

// 调用函数
callCooperHewittApi();



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