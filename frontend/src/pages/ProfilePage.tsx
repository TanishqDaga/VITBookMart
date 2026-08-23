import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LayoutList, LogOut } from "lucide-react";
import { errorMessage } from "@/api/errors";
import { initialsOf } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Button, ButtonLink } from "@/components/common/Button";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { PageSpinner } from "@/components/common/PageSpinner";
import { ProfileCompletion } from "@/components/profile/ProfileCompletion";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { signOut, user: cachedUser } = useAuth();
  const { data, isPending, isError, error, refetch } = useProfile();
  const updateProfile = useUpdateProfile();

  // Falls back to the cached user so a slow network doesn't blank the page.
  const user = data ?? cachedUser;

  if (isPending && !user) return <PageSpinner label="Loading your profile" />;

  if (isError && !user) {
    return (
      <div className="page-shell py-16">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-shell max-w-4xl py-8 sm:py-10">
      <PageHeader title="Profile" description="Your account and hostel details." />

      <div className="mt-7 grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="space-y-5 lg:sticky lg:top-24">
            <section className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5 shadow-card">
              <span
                aria-hidden
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white"
              >
                {initialsOf(user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold text-ink">
                  {user.name ?? "Your account"}
                </p>
                <p className="truncate text-[13px] text-ink-muted">{user.email}</p>
              </div>
            </section>

            <ProfileCompletion user={user} />

            <div className="space-y-2">
              <ButtonLink to="/my-listings" variant="outline" fullWidth>
                <LayoutList className="h-4 w-4" aria-hidden />
                My listings
              </ButtonLink>

              {/* Logout stays available but visually secondary. */}
              <Button
                variant="ghost"
                fullWidth
                className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Log out
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <ProfileForm
            user={user}
            isSubmitting={updateProfile.isPending}
            onSubmit={(payload) =>
              updateProfile.mutate(payload, {
                onError: (mutationError) => toast.error(errorMessage(mutationError)),
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
