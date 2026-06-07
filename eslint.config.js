import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier";
import tseslint from "typescript-eslint";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [".next/**", "dist/**"],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": eslintPluginReactHooks,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      "prettier/prettier": "warn",
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);

