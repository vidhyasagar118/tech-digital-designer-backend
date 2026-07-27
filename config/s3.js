import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import crypto from "crypto";
import path from "path";

const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_BUCKET_NAME;

if (!region) {
  throw new Error("AWS_REGION is missing in .env");
}

if (!bucketName) {
  throw new Error("AWS_BUCKET_NAME is missing in .env");
}

if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error(
    "AWS_ACCESS_KEY_ID is missing in .env"
  );
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error(
    "AWS_SECRET_ACCESS_KEY is missing in .env"
  );
}

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId:
      process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function cleanFileName(fileName = "image") {
  const extension =
    path.extname(fileName).toLowerCase() ||
    ".jpg";

  const baseName = path
    .basename(fileName, extension)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 60);

  return {
    baseName: baseName || "image",
    extension,
  };
}

export async function uploadImage(
  file,
  folder = "uploads"
) {
  if (!file) {
    throw new Error("Image file not received");
  }

  const { baseName, extension } =
    cleanFileName(file.originalname);

  const uniqueId = crypto
    .randomBytes(8)
    .toString("hex");

  const imageKey =
    `Tech Digital Designers/${folder}/` +
    `${Date.now()}-${uniqueId}-${baseName}${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: imageKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: "public, max-age=31536000",
  });

  await s3.send(command);

  const imageUrl =
    `https://${bucketName}.s3.${region}.amazonaws.com/` +
    encodeURI(imageKey);

  console.log("S3 image uploaded:", {
    imageKey,
    imageUrl,
  });

  return {
    imageKey,
    imageUrl,
  };
}

export async function deleteImage(imageKey) {
  if (!imageKey) {
    return;
  }

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
      })
    );

    console.log("S3 image deleted:", imageKey);
  } catch (error) {
    console.error(
      "S3 image delete error:",
      error
    );
  }
}

export default s3;