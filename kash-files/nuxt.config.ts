// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    s3: {
      endpoint: 'http://minio:9000',
      region: 'use-east-1',
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
      bucket: 'kashfiles'
    },
    // Set this to {} so ONLY accessible server-side
    public: {}
  }
})