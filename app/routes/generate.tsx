import type { ActionFunctionArgs } from "@remix-run/cloudflare";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const prompt = formData.get("prompt");
  const negativePrompt = formData.get("negative_prompt");

  if (typeof prompt !== "string") {
    return new Response("Invalid prompt", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const payload: Record<string, any> = { prompt };

    // Only include negative_prompt if it was filled in
    if (typeof negativePrompt === "string" && negativePrompt.trim() !== "") {
      payload.negative_prompt = negativePrompt;
    }

    const stream = await context.env.AI.run(
      "@cf/stabilityai/stable-diffusion-xl-base-1.0",
      payload
    );

    const arrayBuffer = await new Response(stream).arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    await context.env.IMAGES.put("latest", base64);
    await context.env.IMAGES.put("latest_prompt", prompt);

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Error generating base image:", err);
    return new Response("Error generating image", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
