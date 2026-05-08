import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import CustomJwtModule from "../custom-jwt/custom-jwt.module";
import MeetingsModule from "../meetings/meetings.module";
import UsersModule from "../users/users.module";
import GoogleOAuth2 from "./google-oauth2.entity";
import { Oauth2Controller } from "./oauth2.controller";
import OAuth2Service from "./oauth2.service";
import GoogleCalendarEvents from "./google-calendar-events.entity";
import GoogleCalendarCreatedEvent from "./google-calendar-created-event.entity";
import MicrosoftOAuth2 from "./microsoft-oauth2.entity";
import GenericOAuth2 from "./generic-oauth2.entity";
import MicrosoftCalendarEvents from "./microsoft-calendar-events.entity";
import MicrosoftCalendarCreatedEvent from "./microsoft-calendar-created-event.entity";
import CacherModule from "../cacher/cacher.module";
import OidcDiscoveryService from "./oidc-discovery.service";
import OidcTokenVerifier from "./oidc-token-verifier";

@Module({
  imports: [
    UsersModule,
    MeetingsModule,
    CustomJwtModule,
    CacherModule,
    TypeOrmModule.forFeature([
      GoogleOAuth2,
      GoogleCalendarEvents,
      GoogleCalendarCreatedEvent,
      MicrosoftOAuth2,
      MicrosoftCalendarEvents,
      MicrosoftCalendarCreatedEvent,
      GenericOAuth2,
    ]),
  ],
  providers: [OAuth2Service, OidcDiscoveryService, OidcTokenVerifier],
  exports: [OAuth2Service],
  controllers: [Oauth2Controller],
})
export default class OAuth2Module {}
