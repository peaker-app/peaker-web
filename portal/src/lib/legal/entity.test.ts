import { describe, expect, it } from "vitest";
import {
  legalEntity,
  termsVersion,
  unresolvedLegalFields,
  type LegalEntity,
} from "./entity";

describe("legalEntity", () => {
  it("legalEntity_everyRequiredField_isPresent", () => {
    expect(Object.keys(legalEntity)).toEqual(
      expect.arrayContaining(["holder", "taxId", "address", "email"]),
    );
  });

  it("termsVersion_matchesTheBackendFormat", () => {
    expect(termsVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("unresolvedLegalFields_aFilledInEntity_reportsNothingPending", () => {
    const filled: LegalEntity = {
      holder: "Rubén",
      taxId: "00000000A",
      address: "Calle de la Montaña 1",
      email: "hola@peaker.io",
    };

    expect(unresolvedLegalFields(filled)).toEqual([]);
  });

  it("unresolvedLegalFields_aPlaceholder_isReportedByName", () => {
    const partial: LegalEntity = {
      holder: "Rubén",
      taxId: "[PENDIENTE: NIF]",
      address: "Calle de la Montaña 1",
      email: "hola@peaker.io",
    };

    expect(unresolvedLegalFields(partial)).toEqual(["taxId"]);
  });

  it("unresolvedLegalFields_reportsEveryPlaceholderAtOnce", () => {
    const empty: LegalEntity = {
      holder: "[PENDIENTE: a]",
      taxId: "[PENDIENTE: b]",
      address: "[PENDIENTE: c]",
      email: "[PENDIENTE: d]",
    };

    expect(unresolvedLegalFields(empty)).toEqual([
      "holder",
      "taxId",
      "address",
      "email",
    ]);
  });
});
