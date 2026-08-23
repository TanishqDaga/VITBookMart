import { UserCog } from "lucide-react";
import { ButtonLink } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";

/**
 * Shown instead of the sell form when the profile is incomplete.
 *
 * This mirrors UserService.validateProfileComplete, which the backend runs first
 * thing in createListing — so the user is stopped before filling in a whole form,
 * not after.
 */
export function ProfileGate() {
  return (
    <EmptyState
      icon={<UserCog className="h-6 w-6" aria-hidden />}
      title="Complete your profile before selling"
      description="Add your name, WhatsApp number and hostel information so buyers can contact you and complete transactions on campus."
      action={<ButtonLink to="/profile">Complete profile</ButtonLink>}
    />
  );
}
