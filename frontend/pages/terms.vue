<script setup lang="ts">
useSeoMeta({
  title: '服务条款 - NutriMind',
  description: 'NutriMind 智能营养师助手服务条款',
})

const lastUpdated = '2026年2月6日'
</script>

<template>
  <div class="container mx-auto px-4 py-12 max-w-4xl">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">服务条款</h1>

    <div class="space-y-8">
      <p class="text-gray-600">最后更新：{{ lastUpdated }}</p>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">1. 服务说明</h2>
        <p class="text-gray-700 leading-relaxed">
          NutriMind 是一个基于人工智能的营养健康咨询助手，旨在为用户提供营养建议和健康饮食指导。
          本服务仅供信息和教育目的，不能替代专业的医疗诊断和治疗。
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">2. 使用限制</h2>
        <ul class="list-disc list-inside space-y-2 text-gray-700">
          <li>您必须年满 18 岁或在监护人陪同下使用本服务</li>
          <li>不得将本服务用于任何非法或未经授权的目的</li>
          <li>不得复制、修改或分发本服务的任何内容</li>
          <li>不得使用自动化系统大量访问本服务</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">3. 免责声明</h2>
        <p class="text-gray-700 leading-relaxed">
          NutriMind 提供的营养建议仅供参考，不构成医学诊断或治疗建议。
          对于任何健康问题，请咨询专业医疗人员。本服务不保证建议的准确性或完整性。
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">4. 隐私政策</h2>
        <p class="text-gray-700 leading-relaxed">
          我们重视您的隐私。您的健康数据和对话内容将按照我们的隐私政策进行处理和保护。
          我们不会将您的个人数据出售给第三方。
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">5. 知识产权</h2>
        <p class="text-gray-700 leading-relaxed">
          NutriMind 的所有内容、技术和设计均受知识产权法保护。
          未经书面许可，不得复制或使用本服务的任何部分。
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">6. 服务变更</h2>
        <p class="text-gray-700 leading-relaxed">
          我们保留随时修改、暂停或终止服务的权利。
          对于服务的重大变更，我们将通过合理方式通知用户。
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">7. 联系方式</h2>
        <p class="text-gray-700 mb-4">
          如有任何问题或建议，请通过以下方式联系我们：
        </p>
        <ul class="list-disc list-inside space-y-2 text-gray-700">
          <li>网站：www.nutrimind.example.com</li>
          <li>邮箱：support@nutrimind.example.com</li>
        </ul>
      </section>
    </div>

    <div class="mt-12 pt-8 border-t border-gray-200">
      <NuxtLink to="/" class="text-emerald-600 hover:text-emerald-700 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        返回首页
      </NuxtLink>
    </div>
  </div>
</template>
