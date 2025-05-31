// deno-lint-ignore-file ban-types
// from https://github.com/vuejs/core/packages/runtime-core/index.ts
import { DefineComponent } from "vue";

/**
 * Provide types for SFC imports
 */
export const component: DefineComponent<{}, {}, any>;

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
