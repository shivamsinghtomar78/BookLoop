import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated QA output (reports, traces, screenshots).
    "artifacts/**",
    "playwright-report/**",
    "test-results/**",
    // Local agent tooling and skill scaffolding.
    ".qoder/**",
    // Vendored Stageshow kit: third-party primitives kept as shipped.
    "src/components/marketing/stageshow/kit/**",
  ]),
]);

export default eslintConfig;
