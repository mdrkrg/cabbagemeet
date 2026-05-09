import { useLoginWithMicrosoftMutation, useSignupWithMicrosoftMutation } from "slices/api";
import ContinueWithButton from "./ContinueWithButton";

// TODO: get feature flags from server so that we don't display this button
// if Microsoft OAuth2 isn't enabled

export default function ContinueWithMicrosoftButton({
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
      provider="microsoft"
      displayName={displayName}
      useLoginMutation={useLoginWithMicrosoftMutation}
      useSignupMutation={useSignupWithMicrosoftMutation}
      className={className}
    />
  );
}
