/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string
  readonly VITE_MOCK_API_BASE_URL?: string
  readonly VITE_SERVER_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
