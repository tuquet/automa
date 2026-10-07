<script setup lang="ts">
import { AlertTriangle, Trash2 } from 'lucide-vue-next'

defineOptions({
  name: 'ConfirmationModal',
})

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
    title: 'Confirm',
    message: 'Are you sure?',
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
      class="automa-modal-backdrop"
      data-testid="confirmation-modal-backdrop"
      @click.self="handleCancel"
    >
      <div
        class="automa-modal-card"
        data-testid="confirmation-modal"
      >
        <!-- Header -->
        <div class="automa-modal-header">
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
            <h3 class="automa-modal-title" data-testid="modal-title">
              {{ title }}
            </h3>
          </div>
        </div>

        <!-- Body Message -->
        <p class="automa-modal-body" data-testid="modal-message">
          {{ message }}
        </p>

        <!-- Actions -->
        <div class="automa-modal-footer">
          <button
            type="button"
            class="automa-btn automa-btn-sm automa-btn-outline"
            data-testid="btn-modal-cancel"
            @click="handleCancel"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            class="automa-btn automa-btn-sm"
            :class="[
              variant === 'destructive'
                ? 'automa-btn-destructive'
                : 'automa-btn-primary'
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
