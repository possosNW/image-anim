import { ActionFunctionArgs } from "@remix-run/cloudflare";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

export const action = async ({ context }: ActionFunctionArgs) => {
  try {
    const result = await context.env.AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
      prompt: "A fantasy castle on a hill at sunset",
    });

    // Save the generated buffer as a PNG
    const outputPath = path.join(process.cwd(), "public", "generated.png");
    await sharp(result).png().toFile(outputPath);

    console.log("Image saved to:", outputPath);

    return new Response("Image generated and saved", { status: 200 });
  } catch (err: any) {
    console.error("Generation failed:", err);
    return new Response(`Error generating image: ${err.message || "Unknown error"}`, {
      status: 500,
    });
  }
};

export default function Generate() {
  return null;
}

/*
// app/routes/generate.tsx
import type { ActionFunctionArgs } from "@remix-run/cloudflare";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const prompt = formData.get("prompt");

  if (typeof prompt !== "string") {
    return new Response("Invalid prompt", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*", // ✅ Allow any origin
        "Access-Control-Allow-Methods": "POST, OPTIONS", // Optional, for completeness
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const image = await context.env.AI.run(
      "@cf/stabilityai/stable-diffusion-xl-base-1.0",
      { prompt }
    );

    return new Response(image, {
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*", // ✅ CORS fix here
      },
    });
  } catch (err) {
    return new Response("Error generating image", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
*/
