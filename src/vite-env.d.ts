/// <reference types="vite/client" />

/**
 * `npm run build:dev` で true にビルド注入される。OptionsPage で DebugTools の
 * 表示判定に使う。本番では false に静的解決され、DebugTools ごと tree-shake される。
 */
declare const __DEV_BUILD__: boolean;

declare module "*.svg?react" {
  import { FunctionComponent, SVGAttributes } from "react";
  const content: FunctionComponent<SVGAttributes<SVGElement>>;
  export default content;
}
