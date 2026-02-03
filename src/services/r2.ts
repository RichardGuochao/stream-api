import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PRESIGNED_EXPIRY_SECONDS = 3600; // 1 hour

export interface R2PresignedOptions {
  accountId: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  videoKey: string;
  contentType?: string;
}

export async function createPresignedUploadUrl(options: R2PresignedOptions): Promise<string> {
  const { accountId, bucketName, accessKeyId, secretAccessKey, videoKey, contentType } = options;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: videoKey,
    ContentType: contentType ?? 'video/mp4',
  });

  return getSignedUrl(client, command, { expiresIn: PRESIGNED_EXPIRY_SECONDS });
}

export function getR2PublicUrl(publicBaseUrl: string | undefined, videoKey: string): string | null {
  if (!publicBaseUrl) return null;
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/${videoKey}`;
}
