<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent
      class="max-w-4xl max-h-[85vh] flex flex-col p-5 gap-3 text-foreground"
    >
      <DialogHeader class="pb-1 border-b border-border">
        <div class="flex items-center justify-between">
          <DialogTitle class="text-sm font-semibold flex items-center gap-2">
            <Globe class="size-4 text-primary" />
            <span>Browsers</span>
          </DialogTitle>

          <!-- Header Aux Action: Kill All -->
          <div class="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              class="border-destructive/40 text-destructive hover:bg-destructive/10"
              data-testid="btn-kill-all-browsers"
              title="Terminate all running browser processes"
              @click="onKillAllBrowsers"
            >
              <Square class="size-3 mr-1 fill-current" />
              <span>Kill All</span>
            </Button>
          </div>
        </div>
      </DialogHeader>

      <!-- Reusable BrowserDataTable from @automa/ui -->
      <div class="flex-1 overflow-hidden min-h-[440px]">
        <BrowserDataTable
          :enable-virtualization="true"
          :page-size="15"
          @select-browser="$emit('select-browser', $event)"
        />
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import {
  BrowserDataTable,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@automa/ui';
import { Globe, Square } from 'lucide-vue-next';
import { useToast } from 'vue-toastification';
import { killAllBrowserProcesses } from '../services/storage.service';

defineOptions({
  name: 'BrowsersQuickModal',
});

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['update:modelValue', 'select-browser']);
const toast = useToast();

async function onKillAllBrowsers() {
  try {
    await killAllBrowserProcesses();
    toast.success('All browser processes terminated cleanly!');
  } catch (err) {
    toast.error(`Kill failed: ${err.message}`);
  }
}
</script>
