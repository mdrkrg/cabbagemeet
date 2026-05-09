import { useLoginWithOidcMutation, useSignupWithOidcMutation } from "slices/api";
import ContinueWithButton from "./ContinueWithButton";

export default function ContinueWithOidcButton({
  reason,
  displayName,
  className,
}: {
  reason: "signup" | "login";
  displayName?: string;
  className?: string;
}) {
  return (
    <ContinueWithButton
      reason={reason}
      provider="oidc"
      displayName={displayName}
      useLoginMutation={useLoginWithOidcMutation}
      useSignupMutation={useSignupWithOidcMutation}
      className={className}
    />
  );
}
