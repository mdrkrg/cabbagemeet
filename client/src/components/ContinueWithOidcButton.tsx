import { useLoginWithOidcMutation, useSignupWithOidcMutation } from "slices/api";
import ContinueWithButton from "./ContinueWithButton";

export default function ContinueWithOidcButton({
  reason,
  className,
}: {
  reason: "signup" | "login";
  className?: string;
}) {
  return (
    <ContinueWithButton
      reason={reason}
      provider="oidc"
      useLoginMutation={useLoginWithOidcMutation}
      useSignupMutation={useSignupWithOidcMutation}
      className={className}
    />
  );
}
