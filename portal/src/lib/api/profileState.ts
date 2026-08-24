import { ApiError } from "@/lib/api/client";
import { serverFetch } from "@/lib/api/server";

export type ProfileState<T> =
  | { status: "ready"; data: T }
  | { status: "pending" }
  | { status: "failed" };

export const loadProfileState = async <T>(
  path: string,
): Promise<ProfileState<T>> => {
  try {
    return {
      status: "ready",
      data: await serverFetch<T>(path, { authenticated: true }),
    };
  } catch (error) {
    return error instanceof ApiError && error.problem.status === 404
      ? { status: "pending" }
      : { status: "failed" };
  }
};
