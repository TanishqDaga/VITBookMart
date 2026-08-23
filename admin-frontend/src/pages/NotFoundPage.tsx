import { FileQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export default function NotFoundPage() {
  return (
    <div className="py-16">
      <EmptyState
        icon={<FileQuestion className="h-5 w-5" aria-hidden />}
        title="Page not found"
        description="That route doesn't exist in the admin console."
        action={<ButtonLink to="/">Back to overview</ButtonLink>}
      />
    </div>
  );
}
