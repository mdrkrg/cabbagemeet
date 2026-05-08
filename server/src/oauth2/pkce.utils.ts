import { createHash, randomInt as randomIntCb } from "crypto";
import { promisify } from "util";

const randomInt: (max: number) => Promise<number> = promisify(randomIntCb);

const pkceCodeVerifierValidChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
const pkceCodeVerifierLength = 43;

export async function generatePkceCodeVerifier(): Promise<string> {
  const arr = Array<string>(pkceCodeVerifierLength);
  for (let i = 0; i < pkceCodeVerifierLength; i++) {
    const randomIdx = await randomInt(pkceCodeVerifierValidChars.length);
    arr[i] = pkceCodeVerifierValidChars[randomIdx];
  }
  return arr.join("");
}

export function generatePkceCodeChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}
