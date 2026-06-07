import js from "@eslint/js";
import eslintConfigNext from "eslint-config-next";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";

export default [
  js.configs.recommended,
  eslintConfigNext,
  eslintPluginPrettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];
