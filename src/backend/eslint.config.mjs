import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import sonarjs from "eslint-plugin-sonarjs";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      sonarjs,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      "sonarjs/cognitive-complexity": ["error", 15],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
