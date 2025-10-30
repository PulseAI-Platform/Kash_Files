// server/utils/s3.ts
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  ListObjectsV2Command, 
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Agent } from "http";

// Global client cache
let s3Client: S3Client | null = null;
let bucketName: string | null = null;
let bucketChecked = false;

function initS3Client() {
  if (s3Client && bucketName) {
    return { client: s3Client, bucket: bucketName };
  }

  console.log('🔧 Initializing S3 client...');

  let config: any;
  
  try {
    config = useRuntimeConfig();
    console.log('✅ Got runtime config from useRuntimeConfig()');
  } catch (error) {
    console.log('⚠️ useRuntimeConfig() failed, using process.env fallback');
    config = {
      s3: {
        endpoint: process.env.NUXT_S3_ENDPOINT || 'http://minio:9000',
        region: process.env.NUXT_S3_REGION || 'us-east-1',
        accessKeyId: process.env.NUXT_S3_ACCESS_KEY_ID || 'minioadmin',
        secretAccessKey: process.env.NUXT_S3_SECRET_ACCESS_KEY || 'minioadmin',
        bucket: process.env.NUXT_S3_BUCKET || 'kashfiles'
      }
    };
  }

  console.log('🔧 S3 Config:', {
    endpoint: config.s3.endpoint,
    region: config.s3.region,
    bucket: config.s3.bucket
  });

  // THE ACTUAL FIX: Use HTTP agent for MinIO
  const endpoint = config.s3.endpoint;
  const isHTTP = endpoint.startsWith('http://');
  
  s3Client = new S3Client({
    endpoint: endpoint,
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
    forcePathStyle: true,
    // Use HTTP agent for HTTP endpoints
    requestHandler: isHTTP ? new NodeHttpHandler({
      httpAgent: new Agent({ keepAlive: true }),
      requestTimeout: 30000,
    }) : undefined
  });

  bucketName = config.s3.bucket;
  
  console.log('✅ S3 client initialized with HTTP agent:', isHTTP);
  return { client: s3Client, bucket: bucketName };
}

async function ensureBucket() {
  if (bucketChecked) return;
  
  const { client, bucket } = initS3Client();
  console.log(`🪣 Checking bucket: ${bucket}`);
  
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log('✅ Bucket exists');
    bucketChecked = true;
  } catch (error) {
    console.log('⚠️ Bucket check failed:', error.name, error.code);
    
    if (error.name === 'NoSuchBucket' || error.$metadata?.httpStatusCode === 404) {
      try {
        console.log(`🪣 Creating bucket: ${bucket}`);
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
        console.log(`✅ Bucket created: ${bucket}`);
        bucketChecked = true;
      } catch (createError) {
        console.error('❌ Failed to create bucket:', createError);
        throw createError;
      }
    } else {
      throw error;
    }
  }
}

export async function uploadFile(Key: string, Body: Buffer|string, ContentType?: string) {
  console.log(`📤 Uploading: ${Key}`);
  await ensureBucket();
  const { client, bucket } = initS3Client();
  
  try {
    const result = await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key,
      Body,
      ContentType,
    }));
    console.log(`✅ Uploaded: ${Key}`);
    return result;
  } catch (error) {
    console.error(`❌ Upload failed: ${Key}`, error);
    throw error;
  }
}

export async function getFile(Key: string) {
  console.log(`📥 Getting: ${Key}`);
  await ensureBucket();
  const { client, bucket } = initS3Client();
  
  try {
    const data = await client.send(new GetObjectCommand({
      Bucket: bucket,
      Key,
    }));
    
    const streamToBuffer = (stream: any) => new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
    
    const bodyBuffer = await streamToBuffer(data.Body);
    console.log(`✅ Got file: ${Key} (${bodyBuffer.length} bytes)`);
    
    return {
      ...data,
      Body: bodyBuffer
    };
  } catch (error) {
    console.error(`❌ Get failed: ${Key}`, error);
    throw error;
  }
}

export async function listFiles(Prefix: string = "") {
  await ensureBucket();
  const { client, bucket } = initS3Client();
  
  const data = await client.send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix,
  }));
  
  return data.Contents || [];
}

export async function deleteFile(Key: string) {
  await ensureBucket();
  const { client, bucket } = initS3Client();
  
  return client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key,
  }));
}