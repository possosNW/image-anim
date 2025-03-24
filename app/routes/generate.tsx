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
