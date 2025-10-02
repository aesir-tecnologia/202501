<script setup lang="ts">
const route = useRoute()

interface BreadcrumbItem {
  label: string
  to?: string
}

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const paths = route.path.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = [
    { label: 'Home', to: '/dashboard' },
  ]

  let currentPath = ''
  paths.forEach((path, index) => {
    currentPath += `/${path}`

    // Convert path to readable label
    const label = path
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    items.push({
      label,
      to: index === paths.length - 1 ? undefined : currentPath,
    })
  })

  return items
})
</script>

<template>
  <nav
    v-if="breadcrumbs.length > 1"
    class="flex items-center gap-2 text-sm"
  >
    <template
      v-for="(item, index) in breadcrumbs"
      :key="item.label"
    >
      <UIcon
        v-if="index > 0"
        name="i-lucide-chevron-right"
        class="w-4 h-4 text-gray-400"
      />

      <NuxtLink
        v-if="item.to"
        :to="item.to"
        class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
      >
        {{ item.label }}
      </NuxtLink>

      <span
        v-else
        class="font-medium text-gray-900 dark:text-gray-100"
      >
        {{ item.label }}
      </span>
    </template>
  </nav>
</template>
