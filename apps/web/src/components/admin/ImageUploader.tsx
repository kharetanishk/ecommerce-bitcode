"use client";

import { useState, useRef } from "react";
import { uploadImageToR2 } from "@/hooks/useProducts";
import type { ProductImage } from "@ecommerce/types";

interface Props {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

export function ImageUploader({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          const { url, key } = await uploadImageToR2(file);
          return {
            url,
            key,
            alt: file.name.replace(/\.[^.]+$/, ""),
            isPrimary: false,
          } as ProductImage & { key: string };
        }),
      );

      // First image becomes primary if none set yet
      const existing = images;
      const newImages = [...existing, ...uploaded];
      if (!newImages.some((img) => img.isPrimary) && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }

      onChange(newImages);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function setPrimary(index: number) {
    onChange(images.map((img, i) => ({ ...img, isPrimary: i === index })));
  }

  function remove(index: number) {
    const next = images.filter((_, i) => i !== index);
    // Reassign primary if we removed the primary image
    if (next.length > 0 && !next.some((img) => img.isPrimary)) {
      next[0].isPrimary = true;
    }
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
      >
        {uploading ? (
          <p className="text-sm text-gray-500">Uploading...</p>
        ) : (
          <>
            <svg
              className="w-8 h-8 text-gray-300 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-500">
              Drop images here or{" "}
              <span className="text-black font-medium">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPEG, PNG, WEBP up to 5MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div
              key={img.url}
              className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
                img.isPrimary ? "border-black" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt}
                className="w-full h-28 object-cover"
              />

              {/* Primary badge */}
              {img.isPrimary && (
                <span className="absolute top-1.5 left-1.5 bg-black text-white text-xs px-2 py-0.5 rounded-full">
                  Primary
                </span>
              )}

              {/* Actions */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex justify-between items-end">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(i)}
                    className="text-white text-xs hover:underline"
                  >
                    Set primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-white/80 hover:text-white ml-auto"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
