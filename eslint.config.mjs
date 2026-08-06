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
]);

export default eslintConfig;
