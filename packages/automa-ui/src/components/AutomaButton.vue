<script setup lang="ts">
import type { ButtonBusinessLogicSchema, ButtonExecutionState } from '@automa/types'
import { BUTTON_PROTOTYPE_REGISTRY } from '@automa/types'
import {
  AlertCircle,
  Check,
  Code2,
  Download,
  FileSpreadsheet,
  Globe,
  Loader2,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  Upload,
  ZapOff,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import ConfirmationModal from './ConfirmationModal.vue'

const props = withDefaults(
  defineProps<{
    id: string
    label?: string
    variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'ghost' | 'secondary'
    size?: 'xs' | 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
    fsmState?: ButtonExecutionState
    iconOnly?: boolean
    tooltip?: string
    contextPayload?: unknown
  }>(),
  {
    variant: 'default',
    size: 'sm',
    disabled: false,
    loading: false,
    iconOnly: false,
  },
)

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
  (e: 'confirmed', payload: unknown): void
  (e: 'stateChange', state: ButtonExecutionState): void
}>()

// Lookup Button Schema from Registry
const schema = computed<ButtonBusinessLogicSchema | undefined>(() => {
  return BUTTON_PROTOTYPE_REGISTRY[props.id]
})

const internalFsmState = ref<ButtonExecutionState>(props.fsmState || 'IDLE')
const showConfirmation = ref(false)

const isBusy = computed(() => {
  return (
    props.loading ||
    internalFsmState.value === 'VALIDATING' ||
    internalFsmState.value === 'DISPATCHING' ||
    internalFsmState.value === 'EXECUTING' ||
    internalFsmState.value === 'TERMINATING'
  )
})

const effectiveLabel = computed(() => {
  if (props.label) return props.label
  return schema.value?.presentation.label || ''
})

const effectiveTooltip = computed(() => {
  if (props.tooltip) return props.tooltip
  return schema.value?.presentation.tooltip || effectiveLabel.value
})

const confirmationConfig = computed(() => {
  return schema.value?.preConditions.confirmationModal
})

// Icon mapping based on Button ID pattern or schema
const iconComponent = computed(() => {
  const id = props.id
  if (id.includes('.run') || id.includes('.launch') || id.includes('.resume')) return Play
  if (id.includes('.pause')) return Pause
  if (id.includes('.stop') || id.includes('.abort')) return Square
  if (id.includes('.kill_all')) return ZapOff
  if (id.includes('.save')) return Save
  if (id.includes('.lint')) return Sparkles
  if (id.includes('.delete') || id.includes('.clear')) return Trash2
  if (id.includes('.refresh')) return RefreshCw
  if (id.includes('.create')) return Plus
  if (id.includes('.preview')) return SlidersHorizontal
  if (id.includes('.source')) return Code2
  if (id.includes('.export') || id.includes('.download')) return Download
  if (id.includes('.import')) return Upload
  if (id.includes('.test_connection')) return Radio
  if (id.includes('.settings')) return Settings
  if (id.includes('.table')) return FileSpreadsheet
  if (id.includes('.browser')) return Globe
  return null
})

function handleClick(event: MouseEvent) {
  if (props.disabled || isBusy.value) return

  if (confirmationConfig.value) {
    showConfirmation.value = true
    return
  }

  emit('click', event)
}

function handleConfirmAction() {
  showConfirmation.value = false
  emit('confirmed', props.contextPayload)
}
</script>

<template>
  <button
    type="button"
    :disabled="disabled || isBusy"
    :title="effectiveTooltip"
    :data-testid="schema?.presentation.dataTestId || props.id.replace(/\./g, '-')"
    class="inline-flex items-center justify-center font-medium rounded-md transition-all select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      // Size variants
      size === 'xs' ? 'h-6 px-1.5 text-xs gap-1' : '',
      size === 'sm' ? 'h-7 px-2.5 text-xs gap-1.5' : '',
      size === 'md' ? 'h-8 px-3 text-sm gap-2' : '',
      size === 'lg' ? 'h-9 px-4 text-sm gap-2' : '',
      iconOnly && size === 'xs' ? '!w-6 !p-0' : '',
      iconOnly && size === 'sm' ? '!w-7 !p-0' : '',
      iconOnly && size === 'md' ? '!w-8 !p-0' : '',
      iconOnly && size === 'lg' ? '!w-9 !p-0' : '',

      // Style variants
      variant === 'default' || variant === 'secondary'
        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80'
        : '',
      variant === 'primary'
        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
        : '',
      variant === 'destructive'
        ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs'
        : '',
      variant === 'outline'
        ? 'bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        : '',
      variant === 'ghost'
        ? 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
        : '',

      // FSM state highlights
      internalFsmState === 'COMPLETED' ? '!bg-emerald-600 !text-white' : '',
      internalFsmState === 'FAILED' ? '!bg-rose-600 !text-white' : '',
    ]"
    @click="handleClick"
  >
    <!-- Spinner while loading/dispatching/executing -->
    <Loader2
      v-if="isBusy"
      class="animate-spin shrink-0"
      :class="size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'"
      data-testid="button-spinner"
    />

    <!-- Completed Icon -->
    <Check
      v-else-if="internalFsmState === 'COMPLETED'"
      class="shrink-0 text-white"
      :class="size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'"
    />

    <!-- Failed Icon -->
    <AlertCircle
      v-else-if="internalFsmState === 'FAILED'"
      class="shrink-0 text-white"
      :class="size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'"
    />

    <!-- Standard Icon -->
    <component
      :is="iconComponent"
      v-else-if="iconComponent"
      class="shrink-0 transition-transform active:scale-95"
      :class="[
        size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5',
        props.id.includes('.run') || props.id.includes('.launch')
          ? 'text-emerald-600 dark:text-emerald-400'
          : '',
        props.id.includes('.delete') || props.id.includes('.clear')
          ? 'text-rose-500 dark:text-rose-400'
          : '',
      ]"
    />

    <!-- Slot or Label -->
    <slot>
      <span v-if="!iconOnly && effectiveLabel" class="truncate">
        {{ effectiveLabel }}
      </span>
    </slot>
  </button>

  <!-- Auto Confirmation Modal for Destructive/Warning Buttons -->
  <ConfirmationModal
    v-if="confirmationConfig"
    :is-open="showConfirmation"
    :title="confirmationConfig.title"
    :message="confirmationConfig.message"
    :confirm-text="confirmationConfig.confirmText"
    :cancel-text="confirmationConfig.cancelText"
    :variant="confirmationConfig.variant"
    @confirm="handleConfirmAction"
    @cancel="showConfirmation = false"
  />
</template>
