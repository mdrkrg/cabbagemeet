import { Controller, Get } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import ConfigService from "../config/config.service";
import { OAuth2ProviderType, oauth2ProviderNamesMap } from "../oauth2/oauth2-common";
import OAuth2Service from "../oauth2/oauth2.service";
import ServerInfoResponse, { OIDCProviderInfo } from "./server-info-response";

@Controller("server-info")
export default class ServerInfoController {
  private readonly oauth2ProviderSupport: ServerInfoResponse;

  constructor(oauth2Service: OAuth2Service, configService: ConfigService) {
    const oidcProviders: OIDCProviderInfo[] = [];
    const googleEnabled = oauth2Service.providerIsSupported(OAuth2ProviderType.GOOGLE);
    const microsoftEnabled = oauth2Service.providerIsSupported(OAuth2ProviderType.MICROSOFT);
    const oidcEnabled = oauth2Service.providerIsSupported(OAuth2ProviderType.GENERIC_OIDC);

    oidcProviders.push({
      type: "google",
      name: oauth2ProviderNamesMap[OAuth2ProviderType.GOOGLE],
      enabled: googleEnabled,
    });
    oidcProviders.push({
      type: "microsoft",
      name: oauth2ProviderNamesMap[OAuth2ProviderType.MICROSOFT],
      enabled: microsoftEnabled,
    });

    const oidcName = configService.get("OIDC_NAME") || "Generic OIDC";
    oidcProviders.push({
      type: "oidc",
      name: oidcName,
      enabled: oidcEnabled,
    });

    this.oauth2ProviderSupport = {
      googleOAuth2IsSupported: googleEnabled,
      microsoftOAuth2IsSupported: microsoftEnabled,
      oidcProviders,
    };
  }

  @ApiOperation({
    summary: "Get server info",
    description: "Get the server information, including which features are supported.",
    operationId: "getServerInfo",
  })
  @Get()
  getServerInfo(): ServerInfoResponse {
    return this.oauth2ProviderSupport;
  }
}
