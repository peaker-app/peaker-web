import "server-only";

export const gatewayUrl = (): string => {
  const url = process.env.GATEWAY_URL;

  if (!url) {
    throw new Error("GATEWAY_URL is not configured.");
  }

  return url.replace(/\/$/, "");
};

export const correlationHeader = "X-Correlation-Id";
