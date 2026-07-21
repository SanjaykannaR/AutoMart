import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "**/generated/**",
      "**/prisma/**",
      "apps/web/**",
      "e2e/**",
    ],
  },

  // Base recommended rules for all JS/TS files
  js.configs.recommended,

  // TypeScript strict rules for all services
  ...tseslint.configs.recommended,

  // Service-specific config
  {
    files: ["services/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Practical rules for backend services
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off", // Services are servers, console is expected
      "prefer-const": "error",
      "no-var": "error",
    },
  },
);
