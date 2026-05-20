import { generateId } from "./utils";
import type { ImageAttachment } from "@/types";

export async function readImageFiles(files: File[]): Promise<ImageAttachment[]> {
  const results: ImageAttachment[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = (reader.result as string).split(",")[1] ?? "";
        resolve(result);
      };
      reader.readAsDataURL(file);
    });

    results.push({
      id: generateId(),
      filename: file.name,
      mimeType: file.type,
      localPath: "",
      data: base64,
    });
  }

  return results;
}
