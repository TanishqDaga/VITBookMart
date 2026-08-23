import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { errorMessage } from "@/api/errors";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/States";

/** AdminLoginRequest: both fields are @NotBlank. Nothing else is validated server-side. */
const schema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { isAuthenticated, isInitialising, signIn } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  if (isInitialising) return <PageSpinner label="Checking your session" />;
  if (isAuthenticated) return <Navigate to={from ?? "/"} replace />;

  const submit = handleSubmit(async (values) => {
    setFailure(null);
    try {
      await signIn(values);
      navigate(from ?? "/", { replace: true });
    } catch (error) {
      setFailure(error instanceof Error && !("isAxiosError" in error) ? error.message : errorMessage(error));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-shell-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-xl bg-key-500 text-shell-900">
            <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <h1 className="mt-4 text-lg font-bold text-white">VITBookMart Admin</h1>
          <p className="mt-1 text-sm text-stone-400">Staff sign-in.</p>
        </div>

        <form onSubmit={submit} noValidate className="space-y-4 rounded-xl bg-white p-6 shadow-pop">
          {failure && (
            <div role="alert" className="rounded-lg bg-bad-50 px-3.5 py-3 text-[13px] font-medium text-bad-700">
              {failure}
            </div>
          )}

          <Field label="Username" required error={errors.username?.message}>
            {(props) => (
              <Input {...props} {...register("username")} autoComplete="username" autoFocus spellCheck={false} />
            )}
          </Field>

          <Field label="Password" required error={errors.password?.message}>
            {(props) => (
              <div className="relative">
                <Input
                  {...props}
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-soft transition-colors hover:bg-canvas-sunken hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            )}
          </Field>

          <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-5 text-center text-xs leading-relaxed text-stone-500">
          This console manages live student accounts and listings.
        </p>
      </div>
    </div>
  );
}
