import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

export class B2Storage {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    const endpoint = (process.env.B2_ENDPOINT || "").trim();
    const keyId = (process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID || "").trim();
    const appKey = (process.env.B2_APPLICATION_KEY || "").trim();
    const bucket = (process.env.B2_BUCKET_NAME || "").trim();

    if (!endpoint || !keyId || !appKey || !bucket) {
      throw new Error(
        "[DevVerse Storage Fatal] B2 Storage credentials are not fully configured. Please configure B2_ENDPOINT, B2_KEY_ID, B2_APPLICATION_KEY, and B2_BUCKET_NAME in environment."
      );
    }

    // Normalize endpoint (ensure https://)
    const normalizedEndpoint =
      endpoint.startsWith("http://") || endpoint.startsWith("https://")
        ? endpoint
        : `https://${endpoint}`;

    // Auto-extract region from endpoint if not provided (e.g. s3.us-east-005.backblazeb2.com -> us-east-005)
    let region = process.env.B2_REGION?.trim();
    if (!region) {
      const match = endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
      region = match ? match[1] : "us-east-005";
    }

    this.bucketName = bucket;
    this.client = new S3Client({
      endpoint: normalizedEndpoint,
      region,
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: appKey,
      },
    });
  }

  async uploadArchive(appId: string, buffer: Buffer, filename: string = "source.zip"): Promise<string> {
    const key = `applications/${appId}/source/${filename}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: "application/zip",
        Metadata: {
          appId,
          uploadedAt: new Date().toISOString(),
        },
      })
    );

    return key;
  }

  async getArchive(fileKeyOrAppId: string, filename: string = "source.zip"): Promise<Buffer> {
    const key =
      fileKeyOrAppId.startsWith("applications/") || fileKeyOrAppId.includes("/")
        ? fileKeyOrAppId
        : `applications/${fileKeyOrAppId}/source/${filename}`;

    const res = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })
    );

    if (!res.Body) {
      throw new Error(`[DevVerse Storage] Empty body returned for key: ${key}`);
    }

    const bytes = await res.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async deleteAppFolder(appId: string): Promise<void> {
    const prefix = `applications/${appId}/`;

    const listed = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      })
    );

    if (listed.Contents && listed.Contents.length > 0) {
      const objectsToDelete = listed.Contents.map((obj) => ({ Key: obj.Key }));
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: { Objects: objectsToDelete },
        })
      );
    }
  }
}
