// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  { ignores: ["mock/**"] },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Regla del curso: prohibido usar any
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-function-type": "error",
      // Las llamadas HTTP pasan por los servicios (axios en core/api.ts)
      "no-restricted-globals": ["error", { name: "fetch", message: "Usa los servicios (axios en core/api.ts)." }],
      "no-restricted-imports": ["error", { paths: [
        { name: "@angular/common/http", message: "El proyecto usa axios (core/api.ts), no HttpClient." }
      ] }],
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    // Solo core/ importa axios
    files: ["src/app/**/*.ts"],
    ignores: ["src/app/core/api.ts", "src/app/core/api-error.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: [
        { name: "axios", message: "Usa el cliente de core/api.ts." },
        { name: "@angular/common/http", message: "El proyecto usa axios (core/api.ts), no HttpClient." }
      ] }],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // Prohibe $any() en las plantillas
      "@angular-eslint/template/no-any": "error",
    },
  }
);
