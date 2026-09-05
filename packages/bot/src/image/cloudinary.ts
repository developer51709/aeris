import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const FOLDER = process.env.CLOUDINARY_ASSET_FOLDER ?? "aeris-cards";

export async function uploadToCloudinary(
  buffer: Buffer,
  publicId: string,
): Promise<string> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    // No Cloudinary configured — fall back to a data URI so cards still render.
    return `data:image/png;base64,${buffer.toString("base64")}`;
  }

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER,
        public_id: publicId.replace(/\.[^.]+$/, ""),
        resource_type: "image",
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed"));
        resolve(result.secure_url as string);
      },
    );
    upload.end(buffer);
  });
}
