import { randomBytes } from "crypto";
import { Logger } from "@nestjs/common";
import ConfigService from "../config/config.service";
import CacherService from "../cacher/cacher.service";
import { SECONDS_PER_MINUTE } from "../dates.utils";
import { generatePkceCodeChallenge, generatePkceCodeVerifier } from "./pkce.utils";
import OidcDiscoveryService, { OIDCDiscovery } from "./oidc-discovery.service";
import type {
  IOAuth2Provider,
  OAuth2Config,
  PartialAuthzQueryParams,
  PartialRefreshParams,
  PartialTokenFormParams,
} from "./oauth2.service";
import { OAuth2ProviderType, oidcScopes } from "./oauth2-common";
import type AbstractOAuth2 from "./abstract-oauth2.entity";
import type AbstractOAuth2CalendarCreatedEvent from "./abstract-oauth2-calendar-created-event.entity";
import type Meeting from "../meetings/meeting.entity";
import type User from "../users/user.entity";
import type { OAuth2CalendarEvent } from "./oauth2-common";

const codeChallengeLifetimeSeconds = 5 * SECONDS_PER_MINUTE;

export default class GenericOidcProvider implements IOAuth2Provider {
  public readonly type = OAuth2ProviderType.GENERIC_OIDC;
  private readonly logger = new Logger(GenericOidcProvider.name);
  private readonly envConfig:
    | {
        client_id: string;
        client_secret: string;
        redirect_uri: string;
        discovery_url: string;
      }
    | undefined;
  private discovery: OIDCDiscovery | null = null;
  private discoveryPromise: Promise<void> | null = null;
  private readonly codeVerifierCache: CacherService;

  constructor(
    configService: ConfigService,
    private readonly oidcDiscoveryService: OidcDiscoveryService,
    cacherService: CacherService,
  ) {
    this.codeVerifierCache = cacherService;
    const client_id = configService.get("OIDC_CLIENT_ID");
    const client_secret = configService.get("OIDC_CLIENT_SECRET");
    const redirect_uri = configService.get("OIDC_REDIRECT_URI");
    const discovery_url = configService.get("OIDC_DISCOVERY_URL");
    if (client_id && client_secret && redirect_uri && discovery_url) {
      this.envConfig = {
        client_id,
        client_secret,
        redirect_uri,
        discovery_url,
      };
    }
  }

  isConfigured(): boolean {
    return !!this.envConfig;
  }

  private async ensureDiscovery(): Promise<void> {
    if (this.discovery) return;
    if (!this.discoveryPromise) {
      this.discoveryPromise = this.oidcDiscoveryService
        .discover(this.envConfig!.discovery_url)
        .then((config) => {
          this.discovery = config;
        });
    }
    await this.discoveryPromise;
  }

  getDiscoveryConfig(): {
    issuer: string;
    jwks_uri: string;
    client_id: string;
  } | null {
    if (!this.discovery || !this.discovery.jwks_uri) return null;
    return {
      issuer: this.discovery.issuer,
      jwks_uri: this.discovery.jwks_uri,
      client_id: this.envConfig!.client_id,
    };
  }

  async getStaticOAuth2Config(): Promise<OAuth2Config> {
    await this.ensureDiscovery();
    return {
      authzEndpoint: this.discovery.authorization_endpoint,
      tokenEndpoint: this.discovery.token_endpoint,
      scopes: [...oidcScopes, "offline_access"],
    };
  }

  getScopesToExpectInResponse(): string[] {
    return [...oidcScopes];
  }

  async getPartialAuthzQueryParams(): Promise<PartialAuthzQueryParams> {
    await this.ensureDiscovery();
    const nonce = randomBytes(16).toString("base64url");
    const codeVerifier = await generatePkceCodeVerifier();
    const codeChallenge = generatePkceCodeChallenge(codeVerifier);
    await this.codeVerifierCache.add(nonce, codeVerifier, codeChallengeLifetimeSeconds);
    return {
      client_id: this.envConfig!.client_id,
      redirect_uri: this.envConfig!.redirect_uri,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      serverNonce: nonce,
    };
  }

  async getPartialTokenFormParams(nonce?: string): Promise<PartialTokenFormParams> {
    await this.ensureDiscovery();
    if (!nonce) throw new Error("Missing server nonce for PKCE");
    const codeVerifier = await this.codeVerifierCache.getAndPop(nonce);
    if (!codeVerifier) throw new Error("Invalid or expired PKCE nonce");
    return {
      client_id: this.envConfig!.client_id,
      redirect_uri: this.envConfig!.redirect_uri,
      client_secret: this.envConfig!.client_secret,
      code_verifier: codeVerifier,
    };
  }

  async getPartialRefreshParams(): Promise<PartialRefreshParams> {
    return {
      client_id: this.envConfig!.client_id,
      client_secret: this.envConfig!.client_secret,
    };
  }

  setLinkedCalendarToTrue(_user: User): void {}

  async getEventsForMeeting(
    _creds: AbstractOAuth2,
    _meeting: Meeting,
  ): Promise<OAuth2CalendarEvent[]> {
    throw new Error("Calendar integration is not supported for the generic OIDC provider");
  }

  async apiCreateOrUpdateEvent(
    _creds: AbstractOAuth2,
    _existingEvent: AbstractOAuth2CalendarCreatedEvent | null,
    _meeting: Meeting,
  ): Promise<string> {
    throw new Error("Calendar integration is not supported for the generic OIDC provider");
  }

  async apiDeleteEvent(_creds: AbstractOAuth2, _eventID: string): Promise<void> {
    throw new Error("Calendar integration is not supported for the generic OIDC provider");
  }
}
