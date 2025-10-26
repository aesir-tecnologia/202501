<script setup lang="ts">
import { useArchivedProjectsQuery } from '~/composables/useProjects'

const isOpen = defineModel<boolean>('open')

const { data: archivedProjects, isLoading } = useArchivedProjectsQuery()

function closeModal() {
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Archived Projects"
    description="View and manage your archived projects"
    :ui="{ width: 'sm:max-w-3xl' }"
  >
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              Archived Projects
            </h3>
            <UButton
              icon="lucide:x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="closeModal"
            />
          </div>
        </template>

        <div
          v-if="isLoading"
          class="text-center py-8"
        >
          <Icon
            name="lucide:loader-2"
            class="h-8 w-8 mx-auto animate-spin text-gray-400"
          />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Loading archived projects...
          </p>
        </div>

        <ArchivedProjectsList
          v-else
          :projects="archivedProjects || []"
        />
      </UCard>
    </template>
  </UModal>
</template>

