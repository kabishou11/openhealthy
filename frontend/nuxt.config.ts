// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@vueuse/nuxt',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'NutriMind - 智能营养师助手',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'AI-powered intelligent nutrition assistant' },
        { name: 'theme-color', content: '#10B981' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  runtimeConfig: {
    // Server-side only
    modelScopeApiKey: process.env.MODELSCOPE_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    ocrApiKey: process.env.OCR_API_KEY || '',

    // Public (exposed to client)
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:3001/api/v1',
      wsUrl: process.env.WS_URL || 'ws://localhost:3001/ws',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'NutriMind',
      locale: process.env.NUXT_PUBLIC_DEFAULT_LOCALE || 'zh-CN',

      // Feature flags
      demoMode: process.env.DEMO_MODE === 'true',
      enableAnimations: process.env.ENABLE_ANIMATIONS !== 'false',
      enableFluidCursor: process.env.ENABLE_FLUID_CURSOR !== 'false',

      // MCP URLs
      mcpEnabled: process.env.MCP_ENABLED === 'true',
      howtocookMcpUrl: process.env.HOWTOCOOK_MCP_URL || 'http://localhost:3001/mcp/howtocook',
      nutritionMcpUrl: process.env.NUTRITION_MCP_URL || 'http://localhost:3001/mcp/nutrition',
      foodAnalysisMcpUrl: process.env.FOOD_ANALYSIS_MCP_URL || 'http://localhost:3001/mcp/food-analysis',
    },
  },

  colorMode: {
    preference: 'light',
  },

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
  },

  pinia: {
    storesDirs: ['./stores/**'],
  },

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '',
        },
      },
    },
  },

  compatibilityDate: '2024-01-01',
})
