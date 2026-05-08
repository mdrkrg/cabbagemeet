import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class OIDCProviderInfo {
  @ApiProperty({ description: "Provider type slug", example: "google" })
  type: string;

  @ApiProperty({ description: "Display name", example: "Google" })
  name: string;

  @ApiProperty({ description: "Whether this provider is enabled" })
  enabled: boolean;
}

// Make sure to keep this in sync with oauth2-common.ts
export default class ServerInfoResponse {
  @ApiProperty()
  googleOAuth2IsSupported: boolean;

  @ApiProperty()
  microsoftOAuth2IsSupported: boolean;

  @ApiProperty({ type: [OIDCProviderInfo], description: "Enabled OIDC providers" })
  oidcProviders: OIDCProviderInfo[];
}
