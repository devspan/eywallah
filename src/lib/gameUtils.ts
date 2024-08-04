import crypto from 'crypto';

const SECRET_KEY = process.env.GAME_SECRET_KEY || 'your-secret-key-here';

export function signData(data: string): string {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('hex');
}

export function verifySignature(data: string, signature: string): boolean {
  const computedSignature = signData(data);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
}

export function signCoins(userId: string, coins: number): string {
  return signData(`${userId}:${coins}`);
}

export function verifyCoins(userId: string, coins: number, signature: string): boolean {
  return verifySignature(`${userId}:${coins}`, signature);
}