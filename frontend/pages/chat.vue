<script setup lang="ts">
// Redirect to knowledge page
definePageMeta({
  redirect: '/knowledge',
})

useSeoMeta({
  title: '重定向 - NutriMind',
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-600">正在跳转到智能问答...</p>
    </div>
  </div>
</template>
