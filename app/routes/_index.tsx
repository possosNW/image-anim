// app/routes/_index.tsx
import { useState } from "react";
import { Form, useFetcher } from "@remix-run/react";

export default function Index() {
  const fetcher = useFetcher();
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [latestImage, setLatestImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resizeImageToBase64 = (
    imageBlob: Blob,
    maxWidth = 256,
    maxHeight = 256
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Failed to get canvas context");

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/png");
        resolve(base64);
      };

      img.onerror = (e) => reject("Failed to load image");

      const url = URL.createObjectURL(imageBlob);
      img.src = url;
      img.onloadend = () => URL.revokeObjectURL(url);
    });
  };

  const handleGenerate = async (formData: FormData) => {
    try {
      setIsLoading(true);
      setLoadingMessage("Generating main image...");
      setErrorMessage(null);

      const response = await fetch("/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(await response.text());

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setBaseImage(url);
      setLatestImage(url);
    } catch (error: any) {
      setErrorMessage(`Failed to generate image: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  };

  const handleDelta = async (formData: FormData) => {
    if (!baseImage) {
      setErrorMessage("Please generate a base image first");
      return;
    }

    try {
      setIsLoading(true);
      setLoadingMessage("Generating delta image...");
      setErrorMessage(null);

      const baseBlob = await fetch(baseImage).then((res) => res.blob());
      const resizedBase64 = await resizeImageToBase64(baseBlob);
      const cleanBase64 = resizedBase64.replace(/^data:image\/(png|jpeg);base64,/, "");
      formData.set("image_b64", cleanBase64);

      const response = await fetch("/img2img", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(await response.text());

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setLatestImage(url);
    } catch (error: any) {
      setErrorMessage(`Failed to apply delta: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 text-gray-800">
      <div className="w-full md:w-1/3 p-6 space-y-6 bg-white shadow-md overflow-y-auto">
        <fetcher.Form method="post" encType="multipart/form-data" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleGenerate(formData);
        }} className="space-y-4">
          <h2 className="text-xl font-semibold">Generate Base Image</h2>
          <label className="block text-sm font-medium">Main Prompt</label>
          <textarea name="prompt" rows={4} className="w-full border rounded px-3 py-2 resize-y overflow-auto" required />

          <label className="block text-sm font-medium">Negative Prompt (optional)</label>
          <textarea name="negative_prompt" rows={3} className="w-full border rounded px-3 py-2 resize-y overflow-auto" />

          <label className="block text-sm font-medium">Steps (max 20)</label>
          <input name="num_steps" type="number" min="1" max="20" defaultValue="20" className="w-full border rounded px-3 py-2" />

          <label className="block text-sm font-medium">Strength (max 1)</label>
          <input name="strength" type="number" step="0.05" min="0.1" max="1" defaultValue="1" className="w-full border rounded px-3 py-2" />

          <label className="block text-sm font-medium">Guidance Scale</label>
          <input name="guidance_scale" type="number" step="0.1" defaultValue="7.5" className="w-full border rounded px-3 py-2" />

          <label className="block text-sm font-medium">Seed (optional)</label>
          <input name="seed" type="number" className="w-full border rounded px-3 py-2" />

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Generate Image
          </button>
        </fetcher.Form>

        <fetcher.Form method="post" encType="multipart/form-data" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleDelta(formData);
        }} className="space-y-4">
          <h2 className="text-xl font-semibold">Apply Delta</h2>
          <label className="block text-sm font-medium">Delta Prompt</label>
          <textarea name="delta" rows={4} className="w-full border rounded px-3 py-2 resize-y overflow-auto" required />

          <label className="block text-sm font-medium">Steps (max 20)</label>
          <input name="num_steps" type="number" min="1" max="20" defaultValue="20" className="w-full border rounded px-3 py-2" />
          
          <label className="block text-sm font-medium">Strength (max 1)</label>
          <input name="strength" type="number" step="0.05" min="0.1" max="1" defaultValue="0.75" className="w-full border rounded px-3 py-2" />
          
          <label className="block text-sm font-medium">Guidance Scale</label>
          <input name="guidance_scale" type="number" step="0.1" defaultValue="7.5" className="w-full border rounded px-3 py-2" />
          
          <label className="block text-sm font-medium">Seed (optional)</label>
          <input name="seed" type="number" className="w-full border rounded px-3 py-2" />

          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700" disabled={!baseImage || isLoading}>
            Apply Delta
          </button>
        </fetcher.Form>

        {latestImage && (
          <a href={latestImage} download="generated.png" className="block text-blue-600 underline">
            Download Latest Image
          </a>
        )}

        {isLoading && loadingMessage && (
          <div className="text-gray-600 flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{loadingMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="text-red-500 p-3 border border-red-300 bg-red-100 rounded">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="w-full md:w-2/3 p-6 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4">
          {baseImage && (
            <div className="w-full md:w-1/2">
              <h3 className="text-lg font-medium text-center mb-2">Base Image</h3>
              <img
                src={baseImage}
                alt="Base"
                className="w-full border rounded cursor-pointer shadow"
                onClick={() => setLatestImage(baseImage)}
              />
            </div>
          )}

          {latestImage && latestImage !== baseImage && (
            <div className="w-full md:w-1/2">
              <h3 className="text-lg font-medium text-center mb-2">Latest Generated Image</h3>
              <img src={latestImage} alt="Latest" className="w-full border rounded shadow" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
