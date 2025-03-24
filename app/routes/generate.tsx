// app/routes/generate.tsx
import type { ActionFunctionArgs } from "@remix-run/cloudflare";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const prompt = formData.get("prompt");

  if (typeof prompt !== "string") {
    return new Response("Invalid prompt", { status: 400 });
  }

  const image = await context.env.AI.run(
    "@cf/stabilityai/stable-diffusion-xl-base-1.0", 
    { prompt }
  );

  return new Response(image, {
    headers: {
      "Content-Type": "image/png",
    },
  });
};
