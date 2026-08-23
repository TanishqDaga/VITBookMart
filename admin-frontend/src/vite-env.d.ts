/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_BACKEND_TIME_IS_UTC?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
