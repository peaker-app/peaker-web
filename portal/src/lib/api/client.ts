import type { ProblemDetails } from "./problem";

export class ApiError extends Error {
  constructor(readonly problem: ProblemDetails) {
    super(problem.title ?? `HTTP ${problem.status}`);
    this.name = "ApiError";
  }
}

export const readProblem = async (
  response: Response,
): Promise<ProblemDetails> => {
  try {
    return { status: response.status, ...(await response.json()) };
  } catch {
    return { status: response.status };
  }
};

const jsonHeaders = (init?: RequestInit): HeadersInit => ({
  "Content-Type": "application/json",
  ...init?.headers,
});

export const apiFetch = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`/api/bff/${path}`, {
    ...init,
    headers: jsonHeaders(init),
  });

  if (!response.ok) {
    throw new ApiError(await readProblem(response));
  }

  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
};

export const apiUpload = async <T>(
  path: string,
  body: FormData,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`/api/bff/${path}`, {
    ...init,
    method: init?.method ?? "POST",
    body,
  });

  if (!response.ok) {
    throw new ApiError(await readProblem(response));
  }

  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
};

export const buildQuery = (
  params: Record<string, string | number | undefined | null>,
): string => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }

  const query = search.toString();

  return query ? `?${query}` : "";
};
