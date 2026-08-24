import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IntlWrapper } from "@/test/IntlWrapper";
import type { PhotoCandidate } from "@/lib/ascents/photos";
import { PhotoUploader } from "./PhotoUploader";
import { SubmitProgress } from "./SubmitProgress";

const candidate = (name: string): PhotoCandidate => ({
  id: name,
  file: new File(["x"], name, { type: "image/jpeg" }),
  previewUrl: `blob:${name}`,
});

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PhotoUploader", () => {
  it("photoUploader_empty_statesTheLimitsUpFront", () => {
    render(<PhotoUploader photos={[]} onChange={() => undefined} />, {
      wrapper: IntlWrapper,
    });

    expect(
      screen.getByText("Up to 3 photos, 10 MB each. JPEG, PNG or WebP."),
    ).toBeInTheDocument();
  });

  it("photoUploader_counter_isAnnouncedPolitely", () => {
    const { container } = render(
      <PhotoUploader
        photos={[candidate("a"), candidate("b")]}
        onChange={() => undefined}
      />,
      { wrapper: IntlWrapper },
    );

    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
      "2 of 3",
    );
  });

  it("photoUploader_atTheLimit_hidesTheAddButton", () => {
    render(
      <PhotoUploader
        photos={[candidate("a"), candidate("b"), candidate("c")]}
        onChange={() => undefined}
      />,
      { wrapper: IntlWrapper },
    );

    expect(screen.queryByText("Add photos")).toBeNull();
  });

  it("photoUploader_reorderButtons_nameThePhotoTheyMove", () => {
    render(
      <PhotoUploader
        photos={[candidate("a"), candidate("b")]}
        onChange={() => undefined}
      />,
      { wrapper: IntlWrapper },
    );

    expect(
      screen.getByRole("button", { name: "Move photo 2 earlier" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Move photo 1 later" }),
    ).toBeInTheDocument();
  });

  it("photoUploader_firstPhoto_cannotMoveEarlier", () => {
    render(
      <PhotoUploader
        photos={[candidate("a"), candidate("b")]}
        onChange={() => undefined}
      />,
      { wrapper: IntlWrapper },
    );

    expect(
      screen.getByRole("button", { name: "Move photo 1 earlier" }),
    ).toBeDisabled();
  });

  it("photoUploader_reorder_reportsTheNewOrder", async () => {
    const onChange = vi.fn();
    render(
      <PhotoUploader
        photos={[candidate("a"), candidate("b")]}
        onChange={onChange}
      />,
      { wrapper: IntlWrapper },
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Move photo 1 later" }),
    );

    expect(onChange.mock.calls[0]?.[0].map((photo: PhotoCandidate) => photo.id)).toEqual([
      "b",
      "a",
    ]);
  });

  it("photoUploader_remove_dropsThePhotoAndFreesItsPreview", async () => {
    const onChange = vi.fn();
    render(
      <PhotoUploader
        photos={[candidate("a"), candidate("b")]}
        onChange={onChange}
      />,
      { wrapper: IntlWrapper },
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Remove photo 1" }),
    );

    expect(onChange.mock.calls[0]?.[0]).toHaveLength(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:a");
  });

  it("photoUploader_previews_areDecorative", () => {
    render(<PhotoUploader photos={[candidate("a")]} onChange={() => undefined} />, {
      wrapper: IntlWrapper,
    });

    expect(screen.getByRole("presentation", { hidden: true })).toHaveAttribute(
      "alt",
      "",
    );
  });
});

describe("SubmitProgress", () => {
  it("submitProgress_firstPhase_describesSavingTheAscent", () => {
    render(
      <SubmitProgress
        state={{ phase: "ascent", current: 0, total: 2 }}
        maxPhotos={3}
      />,
      { wrapper: IntlWrapper },
    );

    const bar = screen.getByRole("progressbar");

    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar).toHaveAttribute("aria-valuetext", "Saving the ascent…");
  });

  it("submitProgress_photoPhase_countsTheCurrentUpload", () => {
    render(
      <SubmitProgress
        state={{ phase: "photos", current: 2, total: 3 }}
        maxPhotos={3}
      />,
      { wrapper: IntlWrapper },
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "Uploading photo 2 of 3…",
    );
  });

  it("submitProgress_done_reachesTheMaximum", () => {
    render(
      <SubmitProgress
        state={{ phase: "done", current: 2, total: 2 }}
        maxPhotos={3}
      />,
      { wrapper: IntlWrapper },
    );

    const bar = screen.getByRole("progressbar");

    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute("aria-valuemax", "3");
  });

  it("submitProgress_hasATextEquivalentBesideTheBar", () => {
    const { container } = render(
      <SubmitProgress
        state={{ phase: "ascent", current: 0, total: 0 }}
        maxPhotos={3}
      />,
      { wrapper: IntlWrapper },
    );

    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
      "Saving the ascent…",
    );
  });
});
