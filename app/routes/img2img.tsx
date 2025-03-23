export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const delta = formData.get("delta");
  const image = formData.get("image");

  console.log("Delta prompt:", delta);
  console.log("Image:", image);

  if (typeof delta !== "string" || !(image instanceof File)) {
    console.error("Missing delta prompt or image");
    return new Response("Missing delta prompt or image", { status: 400 });
  }

  try {
    const imageBuffer = await image.arrayBuffer();

    const generated = await context.env.AI.run(
      "@cf/stabilityai/stable-diffusion-v1-5-img2img",
      {
        prompt: delta,
        image: new Uint8Array(imageBuffer),
        strength: 0.75, // You can tune this if needed
      }
    );

    return new Response(generated, {
      headers: { "Content-Type": "image/png" },
    });
  } catch (err) {
    console.error("img2img generation failed", err);
    return new Response("Error generating delta image", { status: 500 });
  }
};
