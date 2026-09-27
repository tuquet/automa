<template>
  <div class="input-ui inline-block w-full">
    <label
      v-if="label"
      class="mb-1.5 ml-0.5 inline-flex items-center text-xs font-medium text-foreground"
    >
      <span>{{ label }}</span>
      <v-remixicon
        v-tooltip="tooltipContent"
        name="riInformationLine"
        class="ml-1 text-muted-foreground"
        size="14"
      />
    </label>
    <div class="w-full">
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        :accept="accept"
        @change="handleFileChange"
      />
      <ui-button
        :loading="uploading"
        :disabled="uploading"
        variant="default"
        class="w-full"
        @click="fileInput.click()"
      >
        <v-remixicon name="riUploadLine" class="mr-2 -ml-1" />
        Choose File
      </ui-button>
      <p
        class="mt-1 text-xs text-center text-muted-foreground"
        :class="{ 'text-destructive': hasError }"
      >
        {{ statusText }}
      </p>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, ref, shallowRef } from 'vue';
import { useToast } from 'vue-toastification';
import UiButton from './UiButton.vue';

defineOptions({ name: 'UiFileInput' });

const props = defineProps({
  modelValue: {
    type: [String, Object],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  accept: {
    type: String,
    default: '*',
  },
  maxSize: {
    type: Number,
    default: 30, // in MB
  },
  onUpload: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'change']);
const toast = useToast();

const uploading = ref(false);
const fileInput = ref(null);
const fileName = shallowRef('');
const hasError = ref(false);

const tooltipContent = computed(() => ({
  allowHTML: true,
  content: `Max size: ${
    props.maxSize
  }MB<br>Accepted types: ${props.accept.replace(/,/g, ', ')}`,
  maxWidth: 250,
}));

const statusText = computed(() => {
  if (uploading.value) return 'Uploading...';
  if (hasError.value) return 'Upload failed. Please try again.';
  return fileName.value || 'No file selected.';
});

const isFileTypeValid = (file) => {
  if (props.accept === '*') return true;

  const acceptedTypes = props.accept.split(',').map((type) => type.trim());
  const { name: fName, type: fileType } = file;

  return acceptedTypes.some((acceptedType) => {
    if (acceptedType.startsWith('.')) {
      return fName.endsWith(acceptedType);
    }
    if (acceptedType.endsWith('/*')) {
      return fileType.startsWith(acceptedType.slice(0, -1));
    }
    return fileType === acceptedType;
  });
};

const resetState = () => {
  fileInput.value.value = '';
  fileName.value = '';
};

const handleError = (message) => {
  toast.error(message);
  hasError.value = true;
  resetState();
};

const handleFileChange = async (event) => {
  hasError.value = false;
  const file = event.target.files[0];

  if (!file) {
    resetState();
    return;
  }

  fileName.value = file.name;

  if (!isFileTypeValid(file)) {
    handleError('Invalid file type.');
    return;
  }

  if (file.size > props.maxSize * 1024 * 1024) {
    handleError(`File size should not exceed ${props.maxSize}MB`);
    return;
  }

  if (!props.onUpload) {
    handleError('onUpload function is not provided');
    return;
  }

  uploading.value = true;

  try {
    const value = await props.onUpload(file);

    emit('update:modelValue', value);
    emit('change', value);
    fileName.value = file.name; // Keep filename on success
  } catch (error) {
    console.error('Upload error:', error);
    toast.error(error.message || 'An error occurred during file upload.');
    handleError(error.message || 'An error occurred during file upload.');
  } finally {
    uploading.value = false;
  }
};

onMounted(() => {
  if (typeof props.modelValue === 'object' && props.modelValue?.filename) {
    fileName.value = props.modelValue.filename;
  }
});
</script>
