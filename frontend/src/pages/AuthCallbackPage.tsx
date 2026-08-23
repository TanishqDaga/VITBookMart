import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { consumeOAuthState, consumeReturnTo } from "@/api/authApi";
import { errorMessage } from "@/api/errors";
import { isProfileComplete, useAuth } from "@/context/AuthContext";
import { Button, ButtonLink } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { PageSpinner } from "@/components/common/PageSpinner";
import { AlertTriangle } from "lucide-react";

/**
 * Google redirects here with ?code=… (or ?error=…).
 *
 * The code is sent straight to POST /api/auth/google; the backend does the token
 * exchange with its own client secret, so nothing sensitive ever reaches this page.
 */
export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signInWithCode } = useAuth();
  const [failure, setFailure] = useState<string | null>(null);
  // React 18 StrictMode mounts effects twice in dev; an auth code is single-use.
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;

    const code = searchParams.get("code");
    const returnedState = searchParams.get("state");
    const oauthError = searchParams.get("error");

    const expectedState = consumeOAuthState();
    const returnTo = consumeReturnTo();

    if (oauthError) {
      setFailure(
        oauthError === "access_denied"
          ? "Sign-in was cancelled."
          : "Google couldn't complete the sign-in.",
      );
      return;
    }

    if (!code) {
      setFailure("Google didn't send an authorization code.");
      return;
    }

    // Guards against a forged callback being replayed at this URL.
    if (expectedState && returnedState !== expectedState) {
      setFailure("This sign-in link didn't match the one we started. Try again.");
      return;
    }

    signInWithCode(code)
      .then((user) => {
        toast.success(`Welcome${user.name ? `, ${user.name.split(" ")[0]}` : ""}`);

        // Selling needs a complete profile, so send them there first rather than
        // letting the sell form fail on submit.
        if (returnTo?.startsWith("/sell") && !isProfileComplete(user)) {
          toast.message("Complete your profile before selling");
          navigate("/profile", { replace: true });
          return;
        }

        navigate(returnTo ?? "/", { replace: true });
      })
      .catch((error) => setFailure(errorMessage(error)));
  }, [navigate, searchParams, signInWithCode]);

  if (failure) {
    return (
      <div className="page-shell py-20">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" aria-hidden />}
          title="We couldn't sign you in"
          description={failure}
          action={
            <>
              <Button onClick={() => navigate("/login", { replace: true })}>Try again</Button>
              <ButtonLink to="/" variant="outline">
                Back to VITBookMart
              </ButtonLink>
            </>
          }
        />
      </div>
    );
  }

  return <PageSpinner label="Signing you in" />;
}
