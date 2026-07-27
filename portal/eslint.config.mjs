import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const punctuationOnlyStrings = [
  "·",
  "—",
  "–",
  "/",
  ":",
  ",",
  ".",
  "…",
  "(",
  ")",
  "«",
  "»",
];

const humanFacingAttributes = [
  "alt",
  "aria-description",
  "aria-label",
  "aria-placeholder",
  "aria-roledescription",
  "aria-valuetext",
  "placeholder",
  "title",
].join("|");

const physicalDirectionUtilities =
  "(^|[\\s\"'`:])(m[lr]|p[lr])-|(^|[\\s\"'`:])(left|right)-|text-(left|right)|border-[lr](-|$|[\\s\"'`])|rounded-[lr](-|$|[\\s\"'`])";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}", "src/test/**"],
    rules: {
      "react/jsx-no-literals": [
        "error",
        {
          noStrings: true,
          ignoreProps: true,
          allowedStrings: punctuationOnlyStrings,
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: `JSXAttribute[name.name=/^(${humanFacingAttributes})$/] > Literal`,
          message:
            "Texto literal en atributo visible: usa useTranslations o getTranslations (FRONTEND.md §4.1.2).",
        },
        {
          selector: `Literal[value=/${physicalDirectionUtilities}/]`,
          message:
            "Utilidad direccional física de Tailwind: usa su equivalente lógico ms-/me-/ps-/pe-/start-/end-/text-start/text-end/border-s/border-e (FRONTEND.md §1.2.6).",
        },
        {
          selector: `TemplateElement[value.raw=/${physicalDirectionUtilities}/]`,
          message:
            "Utilidad direccional física de Tailwind: usa su equivalente lógico ms-/me-/ps-/pe-/start-/end-/text-start/text-end/border-s/border-e (FRONTEND.md §1.2.6).",
        },
        {
          selector:
            "MemberExpression[property.name='detail'][object.name=/[Pp]roblem/]",
          message:
            "ProblemDetails.detail nunca se renderiza: es español fijo. Traduce por title con translateProblem (FRONTEND.md §1.4.5).",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["src/app/global-error.tsx"],
    rules: {
      "react/jsx-no-literals": "off",
      "no-restricted-syntax": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
