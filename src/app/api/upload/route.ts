import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 8 * 1024 * 1024;

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

function getCloudinaryEnv() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER || 'masjid';

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret, folder };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ ok: false, message: 'Unauthorized. Please sign in again.' }, { status: 401 });
    }

    const formData = await request.formData();
    const mediaType = String(formData.get('mediaType') ?? 'image');
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: 'File is required' }, { status: 400 });
    }

    if (mediaType !== 'image') {
      return NextResponse.json({ ok: false, message: 'Video upload support is coming soon' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ ok: false, message: 'Only image uploads are supported right now' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ ok: false, message: 'Image size must be 8MB or less' }, { status: 400 });
    }

    const env = getCloudinaryEnv();
    if (!env) {
      return NextResponse.json({ ok: false, message: 'Cloudinary is not configured' }, { status: 500 });
    }

    const { v2: cloudinary } = await import('cloudinary');

    cloudinary.config({
      cloud_name: env.cloudName,
      api_key: env.apiKey,
      api_secret: env.apiSecret,
      secure: true
    });

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: env.folder,
          resource_type: 'image',
          overwrite: false,
          unique_filename: true
        },
        (error, uploadResult) => {
          if (error) {
            reject(error);
            return;
          }

          if (!uploadResult?.secure_url || !uploadResult.public_id) {
            reject(new Error('Cloudinary did not return a valid upload response'));
            return;
          }

          resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id });
        }
      );

      upload.end(fileBuffer);
    });

    return NextResponse.json({
      ok: true,
      url: result.secure_url,
      publicId: result.public_id,
      mediaType: 'image'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
