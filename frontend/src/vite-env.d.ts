/// <reference types="vite/client" />

/* ======================
   Vue 单文件组件
   ====================== */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

/* ======================
   图片与媒体资源
   ====================== */
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.jpeg' {
  const src: string;
  export default src;
}
declare module '*.gif' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}

/* ======================
   样式资源
   ====================== */
declare module '*.css' {
  const classes: Record<string, string>;
  export default classes;
}
declare module '*.scss' {
  const classes: Record<string, string>;
  export default classes;
}
declare module '*.sass' {
  const classes: Record<string, string>;
  export default classes;
}
declare module '*.less' {
  const classes: Record<string, string>;
  export default classes;
}

/* ======================
   3D 模型资源（工坊导入/静态引用）
   ====================== */
declare module '*.glb' {
  const src: string;
  export default src;
}
declare module '*.gltf' {
  const src: string;
  export default src;
}
declare module '*.obj' {
  const src: string;
  export default src;
}
declare module '*.fbx' {
  const src: string;
  export default src;
}
declare module '*.stl' {
  const src: string;
  export default src;
}
declare module '*.ply' {
  const src: string;
  export default src;
}
declare module '*.3ds' {
  const src: string;
  export default src;
}

/* ======================
   字体与 JSON
   ====================== */
declare module '*.woff' {
  const src: string;
  export default src;
}
declare module '*.woff2' {
  const src: string;
  export default src;
}
declare module '*.ttf' {
  const src: string;
  export default src;
}
declare module '*.eot' {
  const src: string;
  export default src;
}
declare module '*.json' {
  const value: any;
  export default value;
}

/* ======================
   Vite 环境变量
   ====================== */
interface ImportMetaEnv {
  /** 应用标题 */
  readonly VITE_APP_TITLE: string;
  /** API 基础路径 */
  readonly VITE_API_BASE_URL: string;
  /** 当前环境 (development / production) */
  readonly VITE_APP_ENV: string;
  /** 后端服务地址（3D 工坊、社区等模块用到） */
  readonly VITE_API_URL?: string;
  /** 静态资源基础路径 */
  readonly VITE_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/* ======================
   Vue 运行时全局属性扩展
   ====================== */
declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    // vue-i18n
    $t: (key: string, ...args: any[]) => string;
    $tc: (key: string, choice?: number, ...args: any[]) => string;
    $te: (key: string, locale?: string) => boolean;
    $d: (value: number | Date | string, key?: string, locale?: string) => string;
    $n: (value: number, key?: string, locale?: string) => string;

    // Vue Router（解决模板中 $router / $route 的 TS2339 报错）
    $router: import('vue-router').Router;
    $route: import('vue-router').RouteLocationNormalizedLoaded;
  }
}

/* ======================
   全局类型与 Window 扩展
   ====================== */
declare global {
  /** 统一后端响应结构 */
  interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    error?: {
      message: string;
      details?: string;
    };
  }

  interface Window {
    echarts: any;
  }
}

export {};