import js from "@eslint/js";
import globals from "globals";

export default [
  { files: ["**/*.{js,mjs,cjs}"], ...js.configs.recommended },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.node } },
];