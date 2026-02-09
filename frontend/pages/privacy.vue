<script setup lang="ts">
useSeoMeta({
  title: '隐私政策 - NutriMind',
  description: 'NutriMind 智能营养师助手隐私政策',
})

const lastUpdated = '2026年2月6日'
</script>

<template>
  <div class="container mx-auto px-4 py-12 max-w-4xl">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">隐私政策</h1>

    <div class="space-y-8">
      <p class="text-gray-600">最后更新：{{ lastUpdated }}</p>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">1. 我们收集的信息</h2>
        <p class="text-gray-700 leading-relaxed mb-4">
          NutriMind 致力于保护您的隐私。我们收集的信息包括：
        </p>
        <ul class="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>账户信息</strong>：姓名、邮箱、年龄、性别等注册信息</li>
          <li><strong>健康数据</strong>：身高、体重、健康状况、饮食偏好等</li>
          <li><strong>使用数据</strong>：与助手的对话记录、功能使用情况</li>
          <li><strong>技术数据</strong>：IP 地址、浏览器类型、设备信息</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">2. 我们如何使用您的信息</h2>
        <ul class="list-disc list-inside space-y-2 text-gray-700">
          <li>提供个性化的营养建议和健康指导</li>
          <li>改进我们的服务和 AI 模型</li>
          <li>处理您的请求和反馈</li>
          <li>发送与服务相关的通知</li>
          <li>分析和优化用户体验</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">3. 数据存储与安全</h2>
        <p class="text-gray-700 leading-relaxed mb-4">
          您的数据安全是我们的首要任务。我们采取以下措施保护您的数据：
        </p>
        <ul class="list-disc list-inside space-y-2 text-gray-700">
          <li>数据加密存储和传输</li>
          <li>定期安全审计和更新</li>
          <li>严格的访问控制机制</li>
          <li>数据备份和灾难恢复</li>
          <li>会话超时自动注销</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">4. 数据保留</h2>
        <p class="text-gray-700 leading-relaxed">
          我们仅在必要时保留您的数据。账户信息保留至您删除账户；
          对话记录保留 30 天后自动删除；分析数据匿名化处理后可永久保留。
          您可以随时请求删除您的数据。
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">5. 您的权利</h2>
        <p class="text-gray-700 mb-4">您对您的个人数据享有以下权利：</p>
        <ul class="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>访问权</strong>：获取我们持有的关于您的数据副本</li>
          <li><strong>更正权</strong>：更正不准确或不完整的数据</li>
          <li><strong>删除权</strong>：请求删除您的个人数据</li>
          <li><strong>导出权</strong>：导出您的数据为通用格式</li>
          <li><strong>撤回同意</strong>：随时撤回数据处理的同意</li>
        </ul>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">6. 第三方服务</h2>
        <p class="text-gray-700 leading-relaxed">
          我们可能使用第三方服务（如云托管、分析工具）来支持我们的服务。
          这些第三方只能按照我们的指示处理数据，并须遵守严格的保密和安全义务。
          我们不会出售您的个人数据给任何第三方。
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">7. 儿童隐私</h2>
        <p class="text-gray-700 leading-relaxed">
          NutriMind 不针对 13 岁以下儿童。我们不会故意收集未成年人的个人信息。
          如果您是家长或监护人，发现孩子向我们提供了个人信息，请联系我们删除相关数据。
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">8. 本政策变更</h2>
        <p class="text-gray-700 leading-relaxed">
          我们保留随时更新本隐私政策的权利。重大变更将通过网站公告或直接通知方式告知。
          继续使用我们的服务即表示您接受更新后的政策。
        </p>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">9. 联系我们</h2>
        <p class="text-gray-700 mb-4">
          如有任何关于隐私的问题或疑虑，请联系我们：
        </p>
        <ul class="list-disc list-inside space-y-2 text-gray-700">
          <li>网站：www.nutrimind.example.com</li>
          <li>邮箱：privacy@nutrimind.example.com</li>
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
