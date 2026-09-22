<template>
  <div class="space-y-4 py-1 text-xs text-foreground h-full flex flex-col">
    <!-- Header & Action Bar -->
    <div class="flex items-center justify-between">
      <Button
        variant="default"
        size="sm"
        data-testid="btn-add-credential"
        @click="showAddForm = !showAddForm"
      >
        <Plus class="size-3.5 mr-1" />
        <span>New</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        data-testid="btn-refresh-credentials"
        @click="loadCredentials"
      >
        <RefreshCw
          class="size-3.5 mr-1"
          :class="{ 'animate-spin': isLoading }"
        />
        <span>Refresh</span>
      </Button>
    </div>

    <!-- Add Credential Form (Collapsible) -->
    <div
      v-if="showAddForm"
      class="p-3 rounded-lg bg-muted border border-border space-y-2.5"
    >
      <h4
        class="font-semibold text-xs text-foreground flex items-center gap-1.5"
      >
        <KeyRound class="size-3.5 text-primary" />
        <span>New Secret</span>
      </h4>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1">
            Key *
          </label>
          <Input
            v-model="newCred.name"
            type="text"
            data-testid="input-secret-key"
            placeholder="API_KEY..."
            class="h-8 text-xs font-mono"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1">
            Value *
          </label>
          <Input
            v-model="newCred.value"
            type="password"
            data-testid="input-secret-value"
            placeholder="Value..."
            class="h-8 text-xs"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-1">
        <Button
          variant="outline"
          size="xs"
          data-testid="btn-cancel-add-credential"
          @click="showAddForm = false"
        >
          Cancel
        </Button>
        <Button
          variant="default"
          size="xs"
          data-testid="btn-save-credential"
          :disabled="!newCred.name || !newCred.value || isSubmitting"
          @click="onAddCredential"
        >
          Save
        </Button>
      </div>
    </div>

    <!-- Credentials List -->
    <div class="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
      <div v-if="isLoading" class="py-8 text-center text-muted-foreground">
        <Loader2 class="size-5 animate-spin inline-block mb-1 text-primary" />
        <p>Loading secrets...</p>
      </div>

      <div
        v-else-if="credentials.length === 0"
        class="py-8 text-center text-muted-foreground"
      >
        <Lock class="size-7 inline-block mb-1 text-muted-foreground/50" />
        <p class="font-medium">No secrets</p>
        <p class="text-xs text-muted-foreground mt-0.5">
          Reference via
          <span class="font-mono text-primary"
            >&#123;&#123;secrets.key&#125;&#125;</span
          >
        </p>
      </div>

      <div
        v-for="c in credentials"
        :key="c.name || c.id"
        class="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between"
      >
        <div class="flex items-center gap-2.5 min-w-0 pr-2">
          <div
            class="size-7 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0"
          >
            <KeyRound class="size-4" />
          </div>
          <div class="flex flex-col min-w-0">
            <span
              class="font-mono font-medium text-xs text-foreground truncate"
            >
              &#123;&#123;secrets.{{ c.name || c.key }}&#125;&#125;
            </span>
            <span class="text-xs text-muted-foreground truncate">
              ••••••••••••
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          data-testid="btn-delete-credential"
          class="text-muted-foreground hover:text-destructive"
          title="Delete credential"
          @click="onDeleteCredential(c.name || c.key)"
        >
          <Trash2 class="size-3.5" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Button, Input } from '@automa/ui';
import {
  KeyRound,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-vue-next';
import { useToast } from 'vue-toastification';
import {
  fetchStorageCredentials,
  createStorageCredential,
  deleteStorageCredential,
} from '../services/storage.service';

defineOptions({
  name: 'StorageSecretsTab',
});

const toast = useToast();

const credentials = ref([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const showAddForm = ref(false);

const newCred = reactive({
  name: '',
  value: '',
});

async function loadCredentials() {
  isLoading.value = true;
  try {
    credentials.value = await fetchStorageCredentials();
  } catch (err) {
    toast.error(`Failed to load credentials: ${err.message}`);
  } finally {
    isLoading.value = false;
  }
}

async function onAddCredential() {
  if (!newCred.name || !newCred.value) return;
  isSubmitting.value = true;
  try {
    await createStorageCredential({
      name: newCred.name,
      value: newCred.value,
    });
    toast.success('Secret saved and encrypted in SQLite Vault!');
    newCred.name = '';
    newCred.value = '';
    showAddForm.value = false;
    await loadCredentials();
  } catch (err) {
    toast.error(`Save secret failed: ${err.message}`);
  } finally {
    isSubmitting.value = false;
  }
}

async function onDeleteCredential(name) {
  try {
    await deleteStorageCredential(name);
    toast.success('Secret deleted.');
    await loadCredentials();
  } catch (err) {
    toast.error(`Delete failed: ${err.message}`);
  }
}

onMounted(() => {
  loadCredentials();
});
</script>
