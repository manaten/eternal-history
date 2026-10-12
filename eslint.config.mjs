// @ts-check
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import functionalPlugin from "eslint-plugin-functional";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import storybook from "eslint-plugin-storybook";
import globals from "globals";
import tsEslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.next/**", "**/out/**"],
  },
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  tsEslint.configs.recommended,
  tsEslint.configs.eslintRecommended,
  // @ts-expect-error 型定義がおかしいため
  functionalPlugin.configs.noMutations,
  eslintConfigPrettier,
  storybook.configs["flat/recommended"],

  // 非Reactプロジェクトの場合は以下のブロックと関連するimportを削除してください
  storybook.configs["flat/recommended"],
  reactHooks.configs.flat.recommended,

  {
    plugins: {
      "react-refresh": reactRefresh,
      "better-tailwindcss": eslintPluginBetterTailwindcss,
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs["recommended-error"]?.rules,
    },
  },

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        projectService: true,
      },
    },

    settings: {
      "better-tailwindcss": {
        entryPoint: "src/client/index.css",
        callees: ["classNames"],
      },
    },
  },

  {
    rules: {
      "import/order": [
        "error",
        {
          groups: [
            ["builtin", "external"],
            "internal",
            ["parent", "index", "sibling", "object"],
          ],

          pathGroups: [
            {
              pattern: "*.scss",

              patternOptions: {
                matchBase: true,
              },

              group: "unknown",
              position: "after",
            },
          ],

          "newlines-between": "always",

          alphabetize: {
            order: "asc",
          },
        },
      ],

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      "import/named": 0,
      "import/no-unresolved": 0,
      "no-undef": 0,
      "no-unused-vars": 0,
      "no-var": 2,
      "object-shorthand": 2,
      "compat/compat": 0,
      "functional/prefer-immutable-types": 0,
      "functional/type-declaration-immutability": 0,

      // Chrome API への直接アクセスは common/chrome/* の薄ラッパ経由に限定する。
      // ドメイン層が特定のブラウザ実装に染まらないようにするための層分離。
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='chrome'][property.name='bookmarks']",
          message:
            "chrome.bookmarks.* を直接使わず src/common/chrome/bookmark.ts のラッパを使うこと。",
        },
        {
          selector:
            "MemberExpression[object.name='chrome'][property.name='history']",
          message:
            "chrome.history.* を直接使わず src/common/chrome/chrome-history.ts のラッパを使うこと。",
        },
      ],
    },
  },

  // Chrome API ラッパとそのテスト・モックでは直接アクセスを許可する。
  {
    files: [
      "src/common/chrome/bookmark.ts",
      "src/common/chrome/bookmark.spec.ts",
      "src/common/chrome/chrome-history.ts",
      "src/common/chrome/__mocks__/**",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },

  // 実行コンテキスト境界: パスがランタイムを表す (worker = background SW,
  // client = NewTab/Options UI, common = 両方から import されるコード)。
  // 境界を越えるやりとりは common/messages.ts の RPC 契約を介して行う。
  // 依存方向は worker→common, client→common のみ。common への昇格は
  // 「2 つ目のコンテキストが実際に使うようになったとき」に限る。
  {
    files: ["src/client/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/worker/**"],
              message:
                "client から worker のコードは import できません。共有するなら common へ、実行時のやりとりは messages.ts の RPC で。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/worker/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/client/**"],
              message:
                "worker から client のコードは import できません。共有するなら common へ。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/common/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/worker/**", "**/client/**"],
              message:
                "common は worker/client に依存できません。依存方向は worker/client → common の一方向のみ。",
            },
          ],
        },
      ],
    },
  },
);
