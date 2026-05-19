import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CLOUD, CLOUDINARY_KEY, CLOUDINARY_SECRET } from '../config.js';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD, api_key: CLOUDINARY_KEY, api_secret: CLOUDINARY_SECRET });
  configured = true;
}

export async function uploadImage(base64: string, mimeType: string, folder = 'nexio/images'): Promise<string> {
  ensureConfigured();
  const dataUri = `data:${mimeType};base64,${base64}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image',
    format: 'webp',
    quality: 'auto:good',
  });
  return result.secure_url;
}

export async function uploadVideoBuffer(buffer: Buffer, folder = 'nexio/videos'): Promise<string> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'video', format: 'mp4', timeout: 120_000, chunk_size: 6_000_000 },
      (err, result) => {
        if (err || !result) reject(err ?? new Error('Cloudinary upload failed'));
        else resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}

export async function uploadImageUrl(url: string, folder = 'nexio/thumbnails'): Promise<string> {
  ensureConfigured();
  const result = await cloudinary.uploader.upload(url, { folder, resource_type: 'image' });
  return result.secure_url;
}
