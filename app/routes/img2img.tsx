import type { ActionFunctionArgs } from "@remix-run/cloudflare";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();

  const delta = formData.get("delta");
  const strength = parseFloat(formData.get("strength")?.toString() || "0.3");
  const numSteps = parseInt(formData.get("num_steps")?.toString() || "20");
  const guidanceScale = parseFloat(formData.get("guidance_scale")?.toString() || "7.5");

  if (typeof delta !== "string") {
    return new Response("Missing delta prompt", {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const base64 = await context.env.IMAGES.get("latest");
  const basePrompt = await context.env.IMAGES.get("latest_prompt");

  if (!base64 || !basePrompt) {
    return new Response("Missing base image or prompt", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  // Combine prompts to preserve original identity + apply the delta
  const fullPrompt = `${basePrompt.trim()}. ${delta.trim()}`;

  try {
    const result = await context.env.AI.run("@cf/runwayml/stable-diffusion-v1-5-img2img", {
      prompt: fullPrompt,
      image: base64,
      strength,
      num_steps: numSteps,
      guidance_scale: guidanceScale,
    });

    const arrayBuffer = await new Response(result).arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("img2img generation failed:", err);
    return new Response("Error generating delta image", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
};
