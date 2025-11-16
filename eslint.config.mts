import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";
import jestPlugin from "eslint-plugin-jest"; 
import { defineConfig } from 'eslint/config';
import securityPlugin from "eslint-plugin-security"

export default defineConfig([
  {
    ignores: [
      "node_modules/", 
      "dist/", 
      "coverage/", 
      ".next/", 
      ".github/",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    ...securityPlugin.configs.recommended,
    files: ["src/server/**/*.ts"],
  },

  {
    files: [
      "src/server/**/*.ts", 
      "jest.config.js", 
      "eslint.config.mts"
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  
  {
    files: ["src/**/*.test.ts", "src/server/services/__tests__/**/*.ts"],
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },

  eslintConfigPrettier,
]);