import { B2Storage } from "./b2-storage";

export interface IStorageService {
  uploadArchive(appId: string, buffer: Buffer, filename?: string): Promise<string>;
  getArchive(fileIdOrAppId: string, filename?: string): Promise<Buffer>;
  deleteAppFolder(appId: string): Promise<void>;
}

let storageServiceInstance: IStorageService | null = null;

export function getStorageService(): IStorageService {
  if (storageServiceInstance) {
    return storageServiceInstance;
  }

  const endpoint = process.env.B2_ENDPOINT?.trim();
  const keyId = (process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID)?.trim();
  const appKey = process.env.B2_APPLICATION_KEY?.trim();
  const bucket = process.env.B2_BUCKET_NAME?.trim();

  const hasB2Creds = Boolean(endpoint && keyId && appKey && bucket);

  if (!hasB2Creds) {
    throw new Error(
      "[DevVerse Storage Fatal] B2 Storage credentials are strictly required. " +
      "Please configure B2_ENDPOINT, B2_KEY_ID, B2_APPLICATION_KEY, and B2_BUCKET_NAME in environment."
    );
  }

  console.log("[DevVerse Storage] Initializing B2 Storage adapter");
  storageServiceInstance = new B2Storage();
  return storageServiceInstance;
}
