export interface Env {
  AI: any;
  IMAGES: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(generateUI(), { headers: { "Content-Type": "text/html" } });
    } else if (request.method === "POST" && url.pathname === "/generate") {
      return await handleGeneration(request, env);
    } else if (request.method === "GET" && url.pathname === "/download") {
      return await handleDownload(env);
    }

    return new Response("Invalid request", { status: 400 });
  },
};

// Serve UI for user interaction
function generateUI(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Image Generator</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 20px; }
            input, button { margin: 10px; padding: 10px; }
            #image-preview { max-width: 500px; display: block; margin: 20px auto; }
        </style>
    </head>
    <body>
        <h1>AI Image Generator</h1>

        <input type="text" id="prompt" placeholder="Enter main prompt"><br>
        <input type="file" id="imageUpload" accept="image/png"><br>
        <input type="text" id="deltaPrompt" placeholder="Enter delta prompt (optional)"><br>

        <button onclick="generateImage()">Generate</button>
        <button onclick="modifyImage()">Modify Image</button>
        <button onclick="downloadImage()">Download</button>

        <h2>Generated Image</h2>
        <img id="image-preview" src="" alt="Generated Image">

        <script>
            async function generateImage() {
                const prompt = document.getElementById("prompt").value;
                const response = await fetch("/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt })
                });
                updateImage(response);
            }

            async function modifyImage() {
                const deltaPrompt = document.getElementById("deltaPrompt").value;
                const fileInput = document.getElementById("imageUpload").files[0];
                let base64Image = null;

                if (fileInput) {
                    const reader = new FileReader();
                    reader.readAsDataURL(fileInput);
                    base64Image = await new Promise(resolve => {
                        reader.onload = () => resolve(reader.result.split(",")[1]);
                    });
                }

                const response = await fetch("/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ deltaPrompt, base64Image })
                });
                updateImage(response);
            }

            async function updateImage(response) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                document.getElementById("image-preview").src = url;
            }

            function downloadImage() {
                window.location.href = "/download";
            }
        </script>
    </body>
    </html>
  `;
}

// Handle image generation (text-to-image and img2img)
async function handleGeneration(request: Request, env: Env): Promise<Response> {
  try {
    const { prompt, deltaPrompt, base64Image } = await request.json();
    const isImg2Img = !!base64Image; 

    const model = "@cf/stabilityai/stable-diffusion-xl-base-1.0";
    const inputs: Record<string, unknown> = isImg2Img
      ? {
          prompt: deltaPrompt,
          image: new Uint8Array(Buffer.from(base64Image, "base64")),
          strength: 0.7, 
        }
      : {
          prompt,
        };

    const response = await env.AI.run(model, inputs);
    await env.IMAGES.put("latestImage", response);

    return new Response(response, {
      headers: { "content-type": "image/png" },
    });

  } catch (error: unknown) {
    return new Response(`Error generating image: ${(error as Error).message}`, { status: 500 });
  }
}

// Handle image download
async function handleDownload(env: Env): Promise<Response> {
  const image = await env.IMAGES.get("latestImage", "arrayBuffer");

  if (!image) {
    return new Response("No image found", { status: 404 });
  }

  return new Response(image, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'attachment; filename="generated.png"',
    },
  });
}
