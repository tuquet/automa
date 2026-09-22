<script setup lang="ts">
import { Dialog, DialogContent } from '@automa/ui'
import {
  Clock,
  Database,
  Download,
  Globe,
  LayoutGrid,
  Search,
  Settings,
  SunMoon,
  Upload,
} from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDarkMode } from '../../../composables/useDarkMode'
import { useLayoutModals } from '../../../shared/composables/useLayoutModals'

defineOptions({
  name: 'CommandPaletteDialog',
})

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<(e: 'update:isOpen', val: boolean) => void>()

const router = useRouter()
const { toggleDark } = useDarkMode()
const { openBrowsersModal, openStorageModal, openHistoryModal, openSettingsModal } =
  useLayoutModals()
const searchQuery = ref('')

interface CommandItem {
  id: string
  title: string
  category: string
  shortcut?: string
  icon: typeof LayoutGrid
  action: () => void
}

const commands: CommandItem[] = [
  {
    id: 'nav-studio',
    title: 'Studio',
    category: 'Workspace',
    shortcut: 'G S',
    icon: LayoutGrid,
    action: () => {
      router.push('/studio')
      close()
    },
  },
  {
    id: 'workflow-import',
    title: 'Import Workflow',
    category: 'Workflow',
    shortcut: 'Ctrl+O',
    icon: Upload,
    action: () => {
      close()
      window.dispatchEvent(new CustomEvent('automa:command-import-workflow'))
    },
  },
  {
    id: 'workflow-export',
    title: 'Export Workflow',
    category: 'Workflow',
    icon: Download,
    action: () => {
      close()
      window.dispatchEvent(new CustomEvent('automa:command-export-workflow'))
    },
  },
  {
    id: 'nav-browsers',
    title: 'Browsers',
    category: 'Navigation',
    shortcut: 'G B',
    icon: Globe,
    action: () => {
      close()
      openBrowsersModal()
    },
  },
  {
    id: 'nav-storage',
    title: 'Storage',
    category: 'Navigation',
    shortcut: 'G T',
    icon: Database,
    action: () => {
      close()
      openStorageModal()
    },
  },
  {
    id: 'nav-history',
    title: 'History',
    category: 'Navigation',
    shortcut: 'G H',
    icon: Clock,
    action: () => {
      close()
      openHistoryModal()
    },
  },
  {
    id: 'nav-settings',
    title: 'Settings',
    category: 'Preferences',
    shortcut: 'G ,',
    icon: Settings,
    action: () => {
      close()
      openSettingsModal()
    },
  },
  {
    id: 'toggle-theme',
    title: 'Toggle Theme',
    category: 'Preferences',
    icon: SunMoon,
    action: () => {
      toggleDark()
      close()
    },
  },
]

const filteredCommands = computed(() => {
  if (!searchQuery.value.trim()) return commands
  const q = searchQuery.value.toLowerCase()
  return commands.filter(
    (c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q),
  )
})

function close() {
  emit('update:isOpen', false)
  searchQuery.value = ''
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    emit('update:isOpen', !props.isOpen)
  }
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <Dialog
    :open="isOpen"
    @update:open="emit('update:isOpen', $event)"
  >
    <DialogContent class="!top-[30%] p-0 overflow-hidden max-w-lg border border-border bg-card shadow-2xl rounded-xl">
      <div data-testid="command-palette-modal">
        <!-- Search Input Header -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/40">
          <Search class="size-4 text-muted-foreground shrink-0" :stroke-width="2" />
          <input
            v-model="searchQuery"
            type="text"
            data-testid="input-command-palette-search"
            placeholder="Type a command or search..."
            class="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-medium tracking-tight"
            autofocus
          />
          <kbd class="px-1.5 py-0.5 rounded bg-muted text-xs text-muted-foreground font-mono border border-border">ESC</kbd>
        </div>

        <!-- Command List -->
        <div class="max-h-72 overflow-y-auto p-2 space-y-1">
          <button
            v-for="cmd in filteredCommands"
            :key="cmd.id"
            type="button"
            :data-testid="`btn-cmd-${cmd.id}`"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors group cursor-pointer active:scale-[0.99] select-none"
            @click="cmd.action"
          >
            <div class="flex items-center gap-2.5">
              <component :is="cmd.icon" class="size-4 text-muted-foreground group-hover:text-primary-foreground transition-colors" :stroke-width="1.8" />
              <span class="font-medium tracking-tight">{{ cmd.title }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground group-hover:text-primary-foreground/80 transition-colors">{{ cmd.category }}</span>
              <kbd v-if="cmd.shortcut" class="text-xs font-mono px-1.5 py-0.5 rounded bg-muted group-hover:bg-primary-foreground/20 text-muted-foreground group-hover:text-primary-foreground border border-border group-hover:border-transparent">
                {{ cmd.shortcut }}
              </kbd>
            </div>
          </button>

          <div v-if="filteredCommands.length === 0" class="py-8 text-center text-xs text-muted-foreground">
            No commands
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
