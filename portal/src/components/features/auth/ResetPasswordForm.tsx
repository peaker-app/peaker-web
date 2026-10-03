"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/forms/FormField";
import { useFieldMessage } from "@/hooks/useFieldMessage";
import { useProblemMessage } from "@/hooks/useProblemToast";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError, apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { hasCode } from "@/lib/api/problem";
import { forgetTokenInUrl } from "@/lib/auth/tokenUrl";
import { passwordMinLength } from "@/lib/auth/validation";
import { PasswordField } from "./PasswordField";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

const rateLimitStatus = 429;

const schema = z.object({
  newPassword: z
    .string()
    .min(1, { error: "field.required" })
    .min(passwordMinLength, { error: "field.passwordTooShort" }),
});

type ResetPasswordValues = z.infer<typeof schema>;

export const ResetPasswordForm = ({ token }: { token?: string }) => {
  const t = useTranslations("auth.resetPassword");
  const fields = useTranslations("auth.fields");
  const errors = useTranslations("errors");
  const toMessage = useProblemMessage();
  const fieldError = useFieldMessage();
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>(undefined);

  useEffect(() => forgetTokenInUrl(), []);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { newPassword: "" },
  });

  const applyProblem = (error: unknown) => {
    if (!(error instanceof ApiError)) {
      setFormError(errors("unknown"));
      return;
    }

    const { problem } = error;

    if (problem.status === rateLimitStatus) {
      setFormError(t("rateLimited"));
      return;
    }

    if (hasCode(problem, "PasswordReset.InvalidOrExpired")) {
      setFormError(t("invalidToken"));
      return;
    }

    if (hasCode(problem, "User.PasswordBreached")) {
      form.setError("newPassword", { message: toMessage(error) });
      form.setFocus("newPassword");
      return;
    }

    setFormError(toMessage(error));
  };

  const submit = form.handleSubmit(async (values) => {
    setFormError(undefined);

    try {
      await apiFetch(endpoints.auth.resetPassword, {
        method: "POST",
        body: JSON.stringify({ token, newPassword: values.newPassword }),
      });

      router.replace("/login?reset=1");
    } catch (error) {
      applyProblem(error);
    }
  });

  const newPassword = useWatch({ control: form.control, name: "newPassword" });

  if (!token) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 text-center">
        <TriangleAlertIcon aria-hidden className="size-10 text-destructive" />
        <h2 className="text-xl leading-relaxed font-semibold">
          {t("missingTokenTitle")}
        </h2>
        <p className="max-w-prose leading-relaxed text-muted-foreground">
          {t("missingToken")}
        </p>
        <Button asChild>
          <Link href="/forgot-password">{t("requestNew")}</Link>
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
        id="newPassword"
        label={t("newPassword")}
        help={fields("passwordHelp", { min: passwordMinLength })}
        error={fieldError(form.formState.errors.newPassword?.message)}
      >
        {({ describedBy, invalid }) => (
          <PasswordField
            id="newPassword"
            autoComplete="new-password"
            aria-invalid={invalid}
            aria-describedby={describedBy}
            {...form.register("newPassword")}
          />
        )}
      </FormField>

      <PasswordStrengthMeter value={newPassword} />

      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        aria-busy={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
};
