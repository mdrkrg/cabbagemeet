import { Injectable, Logger } from "@nestjs/common";
import { request } from "undici";

export interface OIDCDiscovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
  revocation_endpoint?: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
}

@Injectable()
export default class OidcDiscoveryService {
  private readonly logger = new Logger(OidcDiscoveryService.name);
  private cache: Map<string, OIDCDiscovery> = new Map();

  async discover(discoveryUrl: string): Promise<OIDCDiscovery> {
    const cached = this.cache.get(discoveryUrl);
    if (cached) {
      return cached;
    }
    this.logger.log(`Fetching OIDC discovery from ${discoveryUrl}`);
    const response = await request(discoveryUrl);
    const { statusCode, body } = response;
    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(`Failed to fetch OIDC discovery: HTTP ${statusCode}`);
    }
    const config = (await body.json()) as OIDCDiscovery;
    if (!config.issuer || !config.authorization_endpoint || !config.token_endpoint) {
      throw new Error(
        "OIDC discovery response missing required fields (issuer, authorization_endpoint, token_endpoint)",
      );
    }
    this.cache.set(discoveryUrl, config);
    return config;
  }
}
