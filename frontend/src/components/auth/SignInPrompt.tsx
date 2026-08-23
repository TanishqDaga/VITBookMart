import { useLocation } from "react-router-dom";
import { buildGoogleAuthUrl } from "@/api/authApi";
import { isGoogleConfigured } from "@/config/env";
import { GoogleButton } from "@/components/common/GoogleButton";
import { Modal } from "@/components/common/Modal";

interface SignInPromptProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

/**
 * Shown when a signed-out visitor triggers an action that needs an account —
 * the wishlist heart, for example. Sends them straight to Google and brings them
 * back to the page they were on.
 */
export function SignInPrompt({
  open,
  onClose,
  title = "Sign in to save listings",
  description = "Save books and notes to your wishlist and pick up where you left off.",
}: SignInPromptProps) {
  const location = useLocation();

  const signIn = () => {
    window.location.assign(
      buildGoogleAuthUrl(`${location.pathname}${location.search}`),
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="space-y-3 pb-6">
        {isGoogleConfigured ? (
          <>
            <GoogleButton fullWidth onClick={signIn} />
            <p className="text-center text-xs text-ink-soft">
              Sign in using your VIT student Google account.
            </p>
          </>
        ) : (
          <p className="rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
            Google sign-in isn't configured. Set VITE_GOOGLE_CLIENT_ID in your .env file.
          </p>
        )}
      </div>
    </Modal>
  );
}
