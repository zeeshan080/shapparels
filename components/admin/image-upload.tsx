"use client";

import { useState, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1600;
const QUALITY = 0.85;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB (under Vercel's 4.5MB limit)

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // Skip if already small enough
    if (file.size <= MAX_FILE_SIZE) {
      resolve(file);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if needed
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          resolve(new File([blob], file.name, { type: "image/webp" }));
        },
        "image/webp",
        QUALITY
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUpload({ images, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (files: FileList) => {
      setUploading(true);

      try {
        for (const file of Array.from(files)) {
          const compressed = await compressImage(file);

          const formData = new FormData();
          formData.append("file", compressed);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            toast.error(data.error || "Upload failed");
            continue;
          }

          const { url } = await res.json();
          onChange([...images, url]);
        }
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [images, onChange]
  );

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {images.map((url, index) => (
          <div
            key={index}
            className="group relative h-24 w-24 overflow-hidden rounded-md border border-border/50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Product image ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border/50 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
          <Upload className="h-5 w-5" />
          <span className="mt-1 text-[10px]">
            {uploading ? "Uploading..." : "Upload"}
          </span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
