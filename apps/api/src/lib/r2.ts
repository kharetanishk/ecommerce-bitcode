import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
// const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export async function generateUploadUrl(
  contentType: string,
  folder = "products",
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WEBP, AVIF allowed.");
  }

  const ext = contentType.split("/")[1];
  const key = `${folder}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
    // ContentLength: MAX_SIZE_BYTES, // max allowed upload size
  });

  // URL expires in 5 minutes — enough time for frontend upload
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, key, publicUrl };
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }),
  );
}
