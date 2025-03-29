import { ActionFunctionArgs } from "@remix-run/cloudflare";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();
    const delta = formData.get("delta");

    if (typeof delta !== "string") {
      return new Response("Missing delta prompt", { status: 400 });
    }

    const base64 = await context.env.IMAGES.get("latest");
    if (!base64) {
      return new Response("No image found in KV", { status: 404 });
    }

    // Call the img2img model
    const resultStream: ReadableStream = await context.env.AI.run(
      "@cf/runwayml/stable-diffusion-v1-5-img2img",
      {
        prompt: delta,
        image_b64: base64,
        strength: 0.8,
        num_steps: 20,
      }
    );

    // Convert the result stream to an ArrayBuffer
    const resultBuffer = await new Response(resultStream).arrayBuffer();

    return new Response(resultBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    console.error("img2img failed:", err);
    return new Response(`Error generating variation: ${err.message || "Unknown error"}`, {
      status: 500,
    });
  }
};

export default function Img2Img() {
  return null;
}
