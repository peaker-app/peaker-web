import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IntlWrapper } from "@/test/IntlWrapper";
import { LocationPicker } from "./LocationPicker";

const stubGeolocation = (
  implementation: Partial<Geolocation> | undefined,
): void => {
  Object.defineProperty(navigator, "geolocation", {
    value: implementation,
    configurable: true,
    writable: true,
  });
};

afterEach(() => {
  vi.clearAllMocks();
  stubGeolocation(undefined);
});

describe("LocationPicker", () => {
  it("locationPicker_onMount_neverAsksForPermission", () => {
    const getCurrentPosition = vi.fn();
    stubGeolocation({ getCurrentPosition } as unknown as Geolocation);

    render(<LocationPicker onChange={() => undefined} />, {
      wrapper: IntlWrapper,
    });

    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("locationPicker_buttonPressed_asksForPermissionAndReportsThePosition", async () => {
    const onChange = vi.fn();
    stubGeolocation({
      getCurrentPosition: (success: PositionCallback) =>
        success({
          coords: { latitude: 42.64, longitude: 0.65 },
        } as GeolocationPosition),
    } as unknown as Geolocation);

    render(<LocationPicker onChange={onChange} />, { wrapper: IntlWrapper });
    await userEvent.click(
      screen.getByRole("button", { name: "Use my location" }),
    );

    expect(onChange).toHaveBeenCalledWith({ latitude: 42.64, longitude: 0.65 });
  });

  it("locationPicker_permissionDenied_offersManualEntryWithoutBlocking", async () => {
    stubGeolocation({
      getCurrentPosition: (
        _success: PositionCallback,
        error?: PositionErrorCallback | null,
      ) => error?.({} as GeolocationPositionError),
    } as unknown as Geolocation);

    render(<LocationPicker onChange={() => undefined} />, {
      wrapper: IntlWrapper,
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Use my location" }),
    );

    expect(
      screen.getByText(
        "We couldn't get your location. Enter the coordinates by hand.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Latitude")).toBeEnabled();
  });

  it("locationPicker_withoutGeolocationSupport_explainsAndFallsBack", async () => {
    stubGeolocation(undefined);

    render(<LocationPicker onChange={() => undefined} />, {
      wrapper: IntlWrapper,
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Use my location" }),
    );

    expect(
      screen.getByText(
        "This browser can't share your location. Enter the coordinates by hand.",
      ),
    ).toBeInTheDocument();
  });

  it("locationPicker_manualCoordinates_areSubmitted", async () => {
    const onChange = vi.fn();
    render(<LocationPicker onChange={onChange} />, { wrapper: IntlWrapper });

    await userEvent.type(screen.getByLabelText("Latitude"), "42.64");
    await userEvent.type(screen.getByLabelText("Longitude"), "0.65");
    await userEvent.click(screen.getByRole("button", { name: "Search here" }));

    expect(onChange).toHaveBeenCalledWith({ latitude: 42.64, longitude: 0.65 });
  });

  it("locationPicker_latitudeOutOfRange_isRejectedBeforeCallingTheApi", async () => {
    const onChange = vi.fn();
    render(<LocationPicker onChange={onChange} />, { wrapper: IntlWrapper });

    await userEvent.type(screen.getByLabelText("Latitude"), "120");
    await userEvent.type(screen.getByLabelText("Longitude"), "0.65");

    expect(screen.getByLabelText("Latitude")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("button", { name: "Search here" })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("locationPicker_longitudeOutOfRange_isRejectedBeforeCallingTheApi", async () => {
    render(<LocationPicker onChange={() => undefined} />, {
      wrapper: IntlWrapper,
    });

    await userEvent.type(screen.getByLabelText("Longitude"), "200");

    expect(screen.getByLabelText("Longitude")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("locationPicker_coordinateFields_areLeftToRightEvenInRtl", () => {
    render(<LocationPicker onChange={() => undefined} />, {
      wrapper: ({ children }) => (
        <IntlWrapper locale="ar">{children}</IntlWrapper>
      ),
    });

    expect(screen.getByLabelText("خط العرض")).toHaveAttribute("dir", "ltr");
  });
});
