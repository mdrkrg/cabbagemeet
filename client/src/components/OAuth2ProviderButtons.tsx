import { useGetServerInfoQuery } from "slices/api";
import { OAuth2Provider } from "utils/oauth2-common";
import ContinueWithGoogleButton from "./ContinueWithGoogleButton";
import ContinueWithMicrosoftButton from "./ContinueWithMicrosoftButton";
import ContinueWithOidcButton from "./ContinueWithOidcButton";

const buttonComponents: Record<OAuth2Provider, typeof ContinueWithGoogleButton> = {
  google: ContinueWithGoogleButton,
  microsoft: ContinueWithMicrosoftButton,
  oidc: ContinueWithOidcButton,
};

export default function OAuth2ProviderButtons({ reason }: { reason: "signup" | "login" }) {
  const { data } = useGetServerInfoQuery();
  if (data === undefined) {
    return null;
  }
  const enabledProviders = data.oidcProviders?.filter((p) => p.enabled).map((p) => p.type) ?? [];
  const buttons = enabledProviders
    .filter((type): type is OAuth2Provider => type in buttonComponents)
    .map((type) => buttonComponents[type]);
  if (buttons.length === 0) {
    return null;
  }
  return (
    <>
      {buttons.map((ProviderButton, i) => (
        <ProviderButton key={i} reason={reason} className={i === 0 ? undefined : "mt-4"} />
      ))}
      <ORBar />
    </>
  );
}

function ORBar() {
  return (
    <div className="d-flex align-items-center my-4">
      <div className="border-top flex-grow-1"></div>
      <span className="fw-bold mx-2">OR</span>
      <div className="border-top flex-grow-1"></div>
    </div>
  );
}
