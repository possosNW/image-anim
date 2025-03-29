import type { ActionFunctionArgs } from "@remix-run/cloudflare";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const delta = formData.get("delta");

  if (typeof delta !== "string") {
    return new Response("Missing delta prompt", {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const base64 = await context.env.IMAGES.get("latest");

  if (!base64) {
    return new Response("No image found in KV", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const result = await context.env.AI.run(
      "@cf/runwayml/stable-diffusion-v1-5-img2img",
      {
        prompt: delta,
        image_b64: base64,
        strength: 0.75,
      }
    );

    const arrayBuffer = await new Response(result).arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response("Error generating variation", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
};
