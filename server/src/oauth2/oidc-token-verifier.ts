import { Injectable, Logger } from "@nestjs/common";
import * as jose from "jose";
import type { DecodedIDToken } from "./oauth2-response-types";

export interface OidcVerificationConfig {
  issuer: string;
  jwksUri: string;
  clientId: string;
}

@Injectable()
export default class OidcTokenVerifier {
  private readonly logger = new Logger(OidcTokenVerifier.name);

  async verify(
    config: OidcVerificationConfig,
    idToken: string,
    nonce?: string,
  ): Promise<DecodedIDToken> {
    const JWKS = jose.createRemoteJWKSet(new URL(config.jwksUri));
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: config.issuer,
      audience: config.clientId,
    });
    if (nonce && payload.nonce !== nonce) {
      throw new Error("ID token nonce does not match");
    }
    if (!payload.sub) {
      throw new Error("ID token missing sub claim");
    }
    return {
      sub: payload.sub,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
      exp: payload.exp!,
      iat: payload.iat!,
      nonce: payload.nonce as string | undefined,
    };
  }
}
