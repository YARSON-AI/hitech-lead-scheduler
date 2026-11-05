import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

export const newToken = () => randomBytes(32).toString("base64url");
export const hashLinkToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function sealToken(token: string, keyHex: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(keyHex, "hex"), iv);
  const body = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((part) => part.toString("base64url")).join(".");
}

export function openToken(sealed: string, keyHex: string): string {
  const [iv, tag, body] = sealed.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(keyHex, "hex"), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}

export function bookedProof(token: string, bookingId: string, keyHex: string): string {
  return createHmac("sha256", Buffer.from(keyHex, "hex")).update(`${token}|${bookingId}`).digest("base64url");
}
