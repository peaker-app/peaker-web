"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/forms/FormField";
import { useProblemMessage } from "@/hooks/useProblemToast";
import { Link } from "@/i18n/navigation";
import { ApiError, apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";

const rateLimitStatus = 429;

const schema = z.object({ email: z.string().refine(isValidEmail) });

type ForgotPasswordValues = z.infer<typeof schema>;

export const ForgotPasswordForm = () => {
  const t = useTranslations("auth.forgotPassword");
  const fields = useTranslations("auth.fields");
  const errors = useTranslations("errors");
  const toMessage = useProblemMessage();
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { email: "" },
  });

  const applyProblem = (error: unknown) => {
    if (!(error instanceof ApiError)) {
      setFormError(errors("unknown"));
      return;
    }

    setFormError(
      error.problem.status === rateLimitStatus
        ? t("rateLimited")
        : toMessage(error),
    );
  };

  const submit = form.handleSubmit(async (values) => {
    setFormError(undefined);

    try {
      await apiFetch(endpoints.auth.forgotPassword, {
        method: "POST",
        body: JSON.stringify({ email: normalizeEmail(values.email) }),
      });

      setSent(true);
    } catch (error) {
      applyProblem(error);
    }
  });

  if (sent) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-4 text-center"
      >
        <CircleCheckIcon aria-hidden className="size-10 text-primary" />
        <h2 className="text-xl leading-relaxed font-semibold">{t("sentTitle")}</h2>
        <p className="max-w-prose leading-relaxed text-muted-foreground">
          {t("sentBody")}
        </p>
        <Button asChild>
          <Link href="/login">{t("backToLogin")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {formError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <FormField
        id="email"
        label={fields("email")}
        error={form.formState.errors.email?.message}
      >
        {({ describedBy, invalid }) => (
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            aria-invalid={invalid}
            aria-describedby={describedBy}
            {...form.register("email")}
          />
        )}
      </FormField>

      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        aria-busy={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? t("submitting") : t("submit")}
      </Button>

      <p className="text-sm leading-relaxed text-muted-foreground text-start">
        <Link href="/login" className="font-medium text-foreground underline">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
};
