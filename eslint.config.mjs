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
    ".agents/**",
    // Playwright-generated test artifacts (minified reporter/trace assets).
    "playwright-report/**",
    "test-results/**",
    "blob-report/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "destructuredArrayIgnorePattern": "^_" },
      ],
      "no-empty": ["error", { "allowEmptyCatch": true }],
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      // The codebase universally loads data in useEffect on mount (fetch-on-mount
      // convention across every page). This new React-19 compiler-era rule flags
      // that established pattern, so it is disabled project-wide.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Plain-Node scripts (CJS) legitimately use `require()` and console output
  // for CLI tooling — the app-level TS rules don't apply to them. Placed last
  // so it wins over the shared rules block above (flat config precedence).
  {
    files: ["scripts/**/*.js", "scripts/**/*.cjs", "scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
    },
  },
]);

export default eslintConfig;
