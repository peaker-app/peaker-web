import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";
import type { AscentPhotoResponse } from "@/types/api";

const apiFetch = vi.fn();
const refresh = vi.fn();

vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ refresh }) }));

vi.mock("@/lib/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/client")>(
    "@/lib/api/client",
  );

  return {
    ...actual,
    apiFetch: (path: string, init?: RequestInit) => apiFetch(path, init),
    apiUpload: vi.fn(),
  };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const { PhotoManager } = await import("./PhotoManager");

const Wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  </NextIntlClientProvider>
);

const photo = (id: string, position: number): AscentPhotoResponse => ({
  id,
  secureUrl: `https://img/${id}.jpg`,
  width: 1200,
  height: 900,
  position,
  uploadedAtUtc: "2026-07-20T10:00:00Z",
});

const renderManager = (photos: AscentPhotoResponse[]) =>
  render(
    <PhotoManager ascentId="ascent-1" photos={photos} peakName="Aneto" />,
    { wrapper: Wrapper },
  );

afterEach(() => {
  vi.clearAllMocks();
});

describe("PhotoManager", () => {
  it("photoManager_noPhotos_invitesToAddThem", () => {
    renderManager([]);

    expect(
      screen.getByText("No photos yet. Add the ones you took on the summit."),
    ).toBeInTheDocument();
    expect(screen.getByText("Add photo")).toBeInTheDocument();
  });

  it("photoManager_belowTheLimit_showsTheUploadZone", () => {
    renderManager([photo("a", 0), photo("b", 1)]);

    expect(screen.getByText("Add photo")).toBeInTheDocument();
    expect(screen.queryByText("Maximum 3 photos.")).toBeNull();
  });

  it("photoManager_atTheLimit_hidesTheUploadZoneInsteadOfDisablingIt", () => {
    renderManager([photo("a", 0), photo("b", 1), photo("c", 2)]);

    expect(screen.queryByText("Add photo")).toBeNull();
    expect(screen.getByText("Maximum 3 photos.")).toBeInTheDocument();
  });

  it("photoManager_deleteButtons_nameThePhotoTheyRemove", () => {
    renderManager([photo("a", 0), photo("b", 1)]);

    expect(
      screen.getByRole("button", { name: "Delete photo 2 of 2" }),
    ).toBeInTheDocument();
  });

  it("photoManager_delete_asksForConfirmationFirst", async () => {
    renderManager([photo("a", 0)]);

    await userEvent.click(
      screen.getByRole("button", { name: "Delete photo 1 of 1" }),
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("photoManager_deleteConfirmed_waitsForTheServerInsteadOfActingOptimistically", async () => {
    apiFetch.mockResolvedValue(undefined);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderManager([photo("a", 0), photo("b", 1)]);

    await user.click(
      screen.getByRole("button", { name: "Delete photo 1 of 2" }),
    );
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Delete photo",
      }),
    );

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith("ascents/ascent-1/photos/a", {
        method: "DELETE",
      }),
    );
    expect(screen.getAllByRole("img")).toHaveLength(2);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("photoManager_photos_haveGeneratedAlternativeText", () => {
    renderManager([photo("a", 0)]);

    expect(
      screen.getByAltText("Photo 1 of the ascent of Aneto"),
    ).toBeInTheDocument();
  });
});
