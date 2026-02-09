<script setup lang="ts">
const route = useRoute()

// 判断是否显示导航栏（首页隐藏，登录页等特殊页面可以添加）
const showNavBar = computed(() => {
  return route.path !== '/'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 统一导航栏 -->
    <NavBar v-if="showNavBar" />

    <!-- 主内容区域 - 添加顶部padding以避开固定导航栏 -->
    <main :class="{ 'pt-0': !showNavBar, 'pt-16': showNavBar }">
      <NuxtPage />
    </main>

    <!-- 统一底部 -->
    <footer class="bg-white border-t py-6 mt-auto">
      <div class="container mx-auto px-4 text-center text-gray-500 text-sm">
        <p>© 2024 NutriMind. AI-powered nutrition assistant.</p>
        <div class="mt-3 flex justify-center gap-4">
          <NuxtLink to="/privacy" class="hover:text-emerald-600">Privacy</NuxtLink>
          <NuxtLink to="/terms" class="hover:text-emerald-600">Terms</NuxtLink>
          <a href="https://github.com/anthropics/NutriMind" target="_blank" class="hover:text-emerald-600">GitHub</a>
        </div>
      </div>
    </footer>
  </div>
</template>
