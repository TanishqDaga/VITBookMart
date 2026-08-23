import { useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { buildGoogleAuthUrl } from "@/api/authApi";
import { isGoogleConfigured } from "@/config/env";
import { useAuth } from "@/context/AuthContext";
import { GoogleButton } from "@/components/common/GoogleButton";
import { PageSpinner } from "@/components/common/PageSpinner";
import { BrandMark } from "@/components/navbar/BrandMark";

interface LocationState {
  from?: string;
}

/**
 * Google is the only sign-in the backend implements — AuthController exposes
 * /google and /refresh and nothing else. No password form belongs here.
 */
export default function LoginPage() {
  const { isAuthenticated, isInitialising } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const from = (location.state as LocationState | null)?.from;

  // Clean up a stale ?error= left behind by a cancelled consent screen.
  useEffect(() => {
    if (location.search) navigate(location.pathname, { replace: true, state: location.state });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isInitialising) return <PageSpinner label="Checking your session" />;
  if (isAuthenticated) return <Navigate to={from ?? "/"} replace />;

  const signIn = () => {
    window.location.assign(buildGoogleAuthUrl(from));
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-line bg-white px-6 py-10 text-center shadow-card sm:px-10">
          <div className="flex justify-center">
            <BrandMark className="h-12 w-12" />
          </div>

          <h1 className="mt-5 text-display-sm font-extrabold">Welcome to VITBookMart</h1>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
            Buy, sell and rent books and notes within VIT.
          </p>

          <div className="mt-8">
            {isGoogleConfigured ? (
              <GoogleButton fullWidth onClick={signIn} />
            ) : (
              <div className="rounded-xl bg-danger-50 px-4 py-3.5 text-left text-sm text-danger-700">
                <p className="font-semibold">Google sign-in isn't configured</p>
                <p className="mt-1 leading-relaxed">
                  Set <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> and{" "}
                  <code className="font-mono">VITE_GOOGLE_REDIRECT_URI</code> in your{" "}
                  <code className="font-mono">.env</code> file.
                </p>
              </div>
            )}
          </div>

          <p className="mt-4 text-[13px] text-ink-soft">
            Sign in using your VIT student account.
          </p>

          <div className="mt-8 flex items-start gap-2.5 rounded-xl bg-surface-muted px-4 py-3.5 text-left">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
            <p className="text-xs leading-relaxed text-ink-muted">
              Please use your VIT student Google account. Your account is verified by
              VITBookMart when you sign in.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Just looking around?{" "}
          <Link to="/browse" className="font-semibold text-brand-600 hover:underline">
            Browse listings
          </Link>
        </p>
      </div>
    </div>
  );
}
