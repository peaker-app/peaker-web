import { afterEach, describe, expect, it } from "vitest";
import { correlationHeader, gatewayUrl } from "./gateway";

const original = process.env.GATEWAY_URL;

afterEach(() => {
  process.env.GATEWAY_URL = original;
});

describe("gatewayUrl", () => {
  it("gatewayUrl_configuredValue_isReturned", () => {
    process.env.GATEWAY_URL = "http://gateway:8080";

    expect(gatewayUrl()).toBe("http://gateway:8080");
  });

  it("gatewayUrl_trailingSlash_isStripped", () => {
    process.env.GATEWAY_URL = "http://gateway:8080/";

    expect(gatewayUrl()).toBe("http://gateway:8080");
  });

  it("gatewayUrl_missingVariable_throws", () => {
    delete process.env.GATEWAY_URL;

    expect(() => gatewayUrl()).toThrow("GATEWAY_URL is not configured.");
  });
});

describe("correlationHeader", () => {
  it("correlationHeader_matchesTheBackendSerilogHeader", () => {
    expect(correlationHeader).toBe("X-Correlation-Id");
  });
});
