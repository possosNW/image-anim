
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

  const resizeImageToBase64 = (imageBlob: Blob, maxWidth = 512, maxHeight = 512): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Failed to get canvas context");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(imageBlob);
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error generating image: ${errorText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setBaseImage(url);
      setLatestImage(url);
    } catch (error: any) {
      console.error("Generation error:", error);
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
      formData.set("image_b64", resizedBase64);

      const response = await fetch("/img2img", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error generating delta image: ${errorText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setLatestImage(url);
    } catch (error: any) {
      console.error("Delta application error:", error);
      setErrorMessage(`Failed to apply delta: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row">
      <div className="w-full md:w-1/3 p-4 space-y-4">
        <fetcher.Form method="post" encType="multipart/form-data" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleGenerate(formData);
        }}>
          <label className="block mb-2">Main Prompt</label>
          <input name="prompt" className="w-full border p-2 mb-2" required />
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
            Generate Image
          </button>
        </fetcher.Form>

        <fetcher.Form method="post" encType="multipart/form-data" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleDelta(formData);
        }}>
          <label className="block mb-2">Delta Prompt</label>
          <input name="delta" className="w-full border p-2 mb-2" required />
          <button 
            type="submit" 
            className="w-full bg-green-500 text-white p-2 rounded"
            disabled={!baseImage || isLoading}
          >
            Apply Delta
          </button>
        </fetcher.Form>

        {latestImage && (
          <a href={latestImage} download="generated.png" className="block text-blue-600 underline">
            Download Latest Image
          </a>
        )}

        {isLoading && loadingMessage && (
          <div className="text-gray-500 flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {loadingMessage}
          </div>
        )}

        {errorMessage && (
          <div className="text-red-500 p-2 border border-red-300 bg-red-50 rounded">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="w-full md:w-2/3 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {baseImage && (
            <div className="w-full md:w-1/2">
              <h3 className="text-center mb-2">Base Image</h3>
              <img
                src={baseImage}
                alt="Base"
                className="w-full border cursor-pointer"
                onClick={() => setLatestImage(baseImage)}
              />
            </div>
          )}

          {latestImage && latestImage !== baseImage && (
            <div className="w-full md:w-1/2">
              <h3 className="text-center mb-2">Latest Generated Image</h3>
              <img src={latestImage} alt="Latest" className="w-full border" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
