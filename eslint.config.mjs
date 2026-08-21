import tsParser from "@typescript-eslint/parser";
import minecraftIsvalid from "eslint-plugin-minecraft-isvalid";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "minecraft-isvalid": minecraftIsvalid,
    },
    rules: {
      "minecraft-isvalid/require-is-valid-check": "error",
      "minecraft-isvalid/no-unnecessary-is-valid-check": "error",
      "minecraft-isvalid/require-execution-privilege": "error",
      "minecraft-isvalid/require-chunk-loaded-check": "error"
    },
  },
];
