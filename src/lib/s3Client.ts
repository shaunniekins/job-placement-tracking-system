import { S3Client } from "@aws-sdk/client-s3";

// This file should only be imported in server-side code
if (typeof window !== "undefined") {
  throw new Error("s3Client should only be used server-side");
}

const s3Client = new S3Client({
  region: process.env.SUPABASE_S3_REGION,
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY!,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export default s3Client;
