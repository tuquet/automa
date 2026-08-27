<script setup lang="ts">
import { AlertTriangle, Trash2, X } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    isOpen: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive' | 'warning'
  }>(),
  {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed with this action?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
  },
)

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:isOpen', value: boolean): void
}>()

function handleConfirm() {
  emit('confirm')
  emit('update:isOpen', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:isOpen', false)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans text-sm animate-in fade-in duration-150"
      data-testid="confirmation-modal-backdrop"
      @click.self="handleCancel"
    >
      <div
        class="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden p-6 space-y-4"
        data-testid="confirmation-modal"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div
              v-if="variant === 'destructive'"
              class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0"
            >
              <Trash2 class="w-4 h-4" />
            </div>
            <div
              v-else-if="variant === 'warning'"
              class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0"
            >
              <AlertTriangle class="w-4 h-4" />
            </div>
            <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100" data-testid="modal-title">
              {{ title }}
            </h3>
          </div>
          <button
            type="button"
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md transition-colors"
            data-testid="btn-modal-close"
            @click="handleCancel"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body Message -->
        <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed" data-testid="modal-message">
          {{ message }}
        </p>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition-colors cursor-pointer"
            data-testid="btn-modal-cancel"
            @click="handleCancel"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            class="px-4 py-1.5 rounded-lg font-medium transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            :class="[
              variant === 'destructive'
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : variant === 'warning'
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            ]"
            data-testid="btn-modal-confirm"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
