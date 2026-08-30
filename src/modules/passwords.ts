/** Utilitários de senha: somente hashes com salt são persistidos. */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 64 * 1024 * 1024;

type ScryptOptions = {
  N: number;
  r: number;
  p: number;
  maxmem: number;
};

function deriveKey(password: string, salt: string, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derived) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derived as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await deriveKey(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: MAX_MEM,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string | null): Promise<boolean> {
  if (!storedHash) return false;
  const [algorithm, nValue, rValue, pValue, salt, expectedHex] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !nValue || !rValue || !pValue || !salt || !expectedHex) return false;

  const n = Number(nValue);
  const r = Number(rValue);
  const p = Number(pValue);
  const expected = Buffer.from(expectedHex, 'hex');
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p) || expected.length !== KEY_LENGTH) return false;

  const derived = await deriveKey(password, salt, expected.length, {
    N: n,
    r,
    p,
    maxmem: MAX_MEM,
  });
  return timingSafeEqual(derived, expected);
}
