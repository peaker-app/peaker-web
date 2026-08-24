export const forwardedForHeader = "X-Forwarded-For";

export const clientForwardedFor = (headers: Headers): string | undefined =>
  headers.get("x-forwarded-for") ?? headers.get("x-real-ip") ?? undefined;

export const withForwardedFor = (
  target: Record<string, string>,
  headers: Headers,
): Record<string, string> => {
  const forwarded = clientForwardedFor(headers);

  return forwarded ? { ...target, [forwardedForHeader]: forwarded } : target;
};
