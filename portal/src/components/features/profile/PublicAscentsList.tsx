import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AscentCard } from "@/components/features/ascents/AscentCard";
import { endpoints } from "@/lib/api/endpoints";
import { serverFetch } from "@/lib/api/server";
import type { AscentSummaryResponse, PagedResponse } from "@/types/api";

const pageSize = 20;
const ascentsRevalidateSeconds = 300;

export interface PublicAscentsListProps {
  userId: string;
}

const loadAscents = async (
  userId: string,
): Promise<PagedResponse<AscentSummaryResponse> | undefined> => {
  try {
    return await serverFetch<PagedResponse<AscentSummaryResponse>>(
      `${endpoints.ascents.byUser(userId)}?page=1&size=${pageSize}`,
      { revalidate: ascentsRevalidateSeconds },
    );
  } catch {
    return undefined;
  }
};

export const PublicAscentsList = async ({ userId }: PublicAscentsListProps) => {
  const t = await getTranslations("profile.public");
  const ascents = await loadAscents(userId);

  if (!ascents) {
    return <ErrorState message={t("ascentsUnavailable")} />;
  }

  if (ascents.items.length === 0) {
    return <EmptyState title={t("empty")} />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {ascents.items.map((ascent) => (
        <AscentCard
          key={ascent.id}
          ascent={ascent}
          href={`/ascents/${ascent.id}`}
        />
      ))}
    </ul>
  );
};
