// app/routes/_index.tsx
import { useState } from "react";
import { Form, useFetcher } from "@remix-run/react";

export default function Index() {
  const fetcher = useFetcher();
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [latestImage, setLatestImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const handleGenerate = async (formData: FormData) => {
    setIsLoading(true);
    setLoadingMessage("Generating main image...");
    const response = await fetch("/generate", {
      method: "POST",
      body: formData,
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    setBaseImage(url);
    setLatestImage(url);
    setIsLoading(false);
    setLoadingMessage(null);
  };

  const handleDelta = async (formData: FormData) => {
    if (!baseImage) return;
    setIsLoading(true);
    setLoadingMessage("Generating delta image...");
    const baseBlob = await fetch(baseImage).then((res) => res.blob());
    const imgFile = new File([baseBlob], "base.png", { type: "image/png" });
    formData.set("image", imgFile);

    const response = await fetch("/img2img", {
      method: "POST",
      body: formData,
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    setLatestImage(url);
    setIsLoading(false);
    setLoadingMessage(null);
  };

  return (
    <div className="flex">
      <div className="w-1/3 p-4 space-y-4">
        <fetcher.Form method="post" encType="multipart/form-data" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleGenerate(formData);
        }}>
          <label>Main Prompt</label>
          <input name="prompt" className="w-full border p-2" required />
          <button type="submit" className="mt-2 w-full bg-blue-500 text-white p-2 rounded">
            Generate Image
          </button>
        </fetcher.Form>

        <fetcher.Form method="post" encType="multipart/form-data" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleDelta(formData);
        }}>
          <label>Delta Prompt</label>
          <input name="delta" className="w-full border p-2" required />
          <button type="submit" className="mt-2 w-full bg-green-500 text-white p-2 rounded">
            Apply Delta
          </button>
        </fetcher.Form>

        {latestImage && (
          <a href={latestImage} download="generated.png" className="text-blue-600 underline">
            Download Latest Image
          </a>
        )}

        {isLoading && loadingMessage && <p className="text-gray-500">{loadingMessage}</p>}
      </div>
      <div className="w-2/3 p-4">
        <div className="flex gap-4">
          {baseImage && (
            <img
              src={baseImage}
              alt="Base"
              className="w-1/2 border cursor-pointer"
              onClick={() => setBaseImage(latestImage)}
            />
          )}
          {latestImage && <img src={latestImage} alt="Latest" className="w-1/2 border" />}
        </div>
      </div>
    </div>
  );
}
