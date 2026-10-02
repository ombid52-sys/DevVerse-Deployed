import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Read .env
const envPath = path.resolve(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  console.error("No .env file found at", envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    const k = trimmed.slice(0, eqIdx).trim();
    let v = trimmed.slice(eqIdx + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    envVars[k] = v;
  }
}

const endpoint = envVars.B2_ENDPOINT || process.env.B2_ENDPOINT;
const keyId = envVars.B2_KEY_ID || process.env.B2_KEY_ID;
const appKey = envVars.B2_APPLICATION_KEY || process.env.B2_APPLICATION_KEY;
const bucket = envVars.B2_BUCKET_NAME || process.env.B2_BUCKET_NAME;

if (!endpoint || !keyId || !appKey || !bucket) {
  console.error("Missing required B2 variables in .env:");
  console.log({ endpoint: Boolean(endpoint), keyId: Boolean(keyId), appKey: Boolean(appKey), bucket: Boolean(bucket) });
  process.exit(1);
}

const normalizedEndpoint = endpoint.startsWith("http") ? endpoint : `https://${endpoint}`;
const regionMatch = endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
const region = regionMatch ? regionMatch[1] : "us-east-005";

console.log(`Connecting to B2 Storage endpoint: ${normalizedEndpoint} (region: ${region})...`);
const client = new S3Client({
  endpoint: normalizedEndpoint,
  region,
  credentials: {
    accessKeyId: keyId,
    secretAccessKey: appKey,
  },
});

try {
  const res = await client.send(new ListObjectsV2Command({
    Bucket: bucket,
    MaxKeys: 5,
  }));
  console.log(`SUCCESS! Connected to B2 Storage bucket "${bucket}". Objects count: ${res.KeyCount || 0}`);
} catch (err) {
  console.error("B2 Storage check failed:", err.message);
  process.exit(1);
}
