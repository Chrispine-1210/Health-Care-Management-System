import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const configuredKey = process.env.PATIENT_DATA_ENCRYPTION_KEY;
  if (!configuredKey) {
    throw new Error('PATIENT_DATA_ENCRYPTION_KEY is required for sensitive patient data');
  }
  return createHash('sha256').update(configuredKey).digest();
}

export interface EncryptedPayload {
  encrypted: true;
  algorithm: typeof ALGORITHM;
  iv: string;
  authTag: string;
  ciphertext: string;
}

export function encryptSensitiveData(payload: unknown): EncryptedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted: true,
    algorithm: ALGORITHM,
    iv: iv.toString('base64url'),
    authTag: authTag.toString('base64url'),
    ciphertext: ciphertext.toString('base64url'),
  };
}

export function decryptSensitiveData<T>(payload: EncryptedPayload): T {
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(payload.iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');

  return JSON.parse(plaintext) as T;
}
