import { ActionFunctionArgs } from "@remix-run/cloudflare";

export const action = async ({ context }: ActionFunctionArgs) => {
  try {
    const resultStream: ReadableStream = await context.env.AI.run(
      "@cf/stabilityai/stable-diffusion-xl-base-1.0",
      {
        prompt: "A fantasy castle on a hill at sunset",
      }
    );

    // Convert ReadableStream to ArrayBuffer
    const resultArrayBuffer = await new Response(resultStream).arrayBuffer();

    const base64 = Buffer.from(resultArrayBuffer).toString("base64");
    await context.env.IMAGES.put("latest", base64);

    return new Response("Image generated and stored in KV", { status: 200 });
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
