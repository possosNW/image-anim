export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const delta = formData.get("delta");
  const image_b64 = formData.get("image_b64")?.toString();
  const numSteps = parseInt(formData.get("num_steps") as string);
  const strength = parseFloat(formData.get("strength") as string);
  const guidance = parseFloat(formData.get("guidance_scale") as string);
  const seedRaw = formData.get("seed");
  const seed = seedRaw ? parseInt(seedRaw as string) : undefined;

  if (!image_b64 || typeof delta !== "string") {
    return new Response("Missing required parameters", {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const payload: Record<string, any> = {
      prompt: delta,
      image_b64,
      strength: isNaN(strength) ? 0.75 : strength,
    };

    if (!isNaN(numSteps)) payload.num_steps = numSteps;
    if (!isNaN(guidance)) payload.guidance = guidance;
    if (!isNaN(seed)) payload.seed = seed;

    console.log("Payload:", JSON.stringify(payload, null, 2));

    const result = await context.env.AI.run(
      "@cf/runwayml/stable-diffusion-v1-5-img2img",
      payload
    );

    const arrayBuffer = await new Response(result).arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("img2img error:", err);
    return new Response("Error generating variation: " + err.message, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
};
