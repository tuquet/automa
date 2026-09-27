<template>
  <div
    class="scroll overflow-auto"
    style="max-height: calc(100vh - 15rem); min-height: 200px"
  >
    <!-- Empty State -->
    <div
      v-if="state.parameters.length === 0"
      class="my-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center bg-muted/20"
    >
      <div
        class="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground mb-3"
      >
        <v-remixicon name="Terminal" size="22" />
      </div>
      <h3 class="text-sm font-semibold text-foreground">
        {{ $t('workflow.parameters.emptyTitle', 'No parameters configured') }}
      </h3>
      <p class="mt-1 text-xs text-muted-foreground max-w-sm leading-relaxed">
        {{
          $t(
            'workflow.parameters.emptyDesc',
            'Parameters allow you to supply custom inputs, variables, or dynamic values when executing this workflow.'
          )
        }}
      </p>
      <ui-button
        variant="secondary"
        class="mt-4 shadow-xs"
        @click="addParameter"
      >
        <v-remixicon name="Plus" class="mr-1.5" size="16" />
        <span>{{ $t('workflow.parameters.add', 'Add parameter') }}</span>
      </ui-button>
    </div>

    <!-- Parameter Table List -->
    <section v-else class="w-full">
      <div
        class="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60 pb-2 mb-3 px-1"
      >
        <div class="col-span-3 pl-7">Name</div>
        <div class="col-span-2">Type</div>
        <div class="col-span-3">Placeholder</div>
        <div class="col-span-4">Default Value</div>
      </div>
      <draggable
        v-model="state.parameters"
        tag="div"
        item-key="id"
        handle=".handle"
      >
        <template #item="{ element: param, index }">
          <div
            class="mb-3 rounded-lg border border-border/60 bg-muted/20 p-2.5 transition-colors hover:border-border/90"
          >
            <div class="grid grid-cols-12 gap-2 items-center">
              <div class="col-span-3 flex items-center">
                <v-remixicon
                  name="GripVertical"
                  class="handle mr-1.5 cursor-move text-muted-foreground hover:text-foreground shrink-0"
                  size="18"
                />
                <ui-input
                  :model-value="param.name"
                  placeholder="Parameter name"
                  class="w-full text-xs font-mono"
                  @change="updateParam(index, $event)"
                />
              </div>
              <div class="col-span-2">
                <ui-select
                  :model-value="param.type"
                  class="w-full text-xs"
                  @change="updateParamType(index, $event)"
                >
                  <option
                    v-for="type in paramTypesArr"
                    :key="type.id"
                    :value="type.id"
                  >
                    {{ type.name }}
                  </option>
                </ui-select>
              </div>
              <div class="col-span-3">
                <ui-input
                  v-model="param.placeholder"
                  placeholder="A parameter"
                  class="w-full text-xs"
                />
              </div>
              <div class="col-span-4 flex items-center gap-1.5">
                <component
                  :is="paramTypes[param.type]?.valueComp"
                  v-if="paramTypes[param.type]?.valueComp"
                  v-model="param.defaultValue"
                  :param-data="param"
                  :editor="true"
                  class="flex-1 min-w-0"
                />
                <ui-input
                  v-else
                  v-model="param.defaultValue"
                  :type="param.type === 'number' ? 'number' : 'text'"
                  placeholder="NULL"
                  class="flex-1 min-w-0 text-xs"
                />
                <ui-button
                  icon
                  variant="ghost"
                  class="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-8"
                  title="Delete parameter"
                  @click="state.parameters.splice(index, 1)"
                >
                  <v-remixicon name="Trash2" size="16" />
                </ui-button>
              </div>
            </div>
            <div class="w-full mt-2">
              <ui-expand
                hide-header-icon
                header-class="flex items-center text-xs text-muted-foreground hover:text-foreground focus:ring-0 w-full select-none"
              >
                <template #header="{ show }">
                  <v-remixicon
                    :rotate="show ? 90 : 0"
                    name="ChevronRight"
                    class="mr-1.5 transition-transform"
                    size="14"
                  />
                  <span>Options & Validation</span>
                </template>
                <div class="mt-2.5 pt-2 border-t border-border/40 pl-6">
                  <div class="mb-2 flex items-start gap-4">
                    <ui-textarea
                      v-model="param.description"
                      placeholder="Description or help text for this parameter"
                      title="Description"
                      class="max-w-md text-xs"
                      rows="2"
                    />
                    <ui-checkbox
                      v-if="['string', 'number'].includes(param.type)"
                      :model-value="param.data?.required"
                      class="pt-1 text-xs"
                      @change="param.data.required = $event"
                    >
                      Parameter required
                    </ui-checkbox>
                  </div>
                  <component
                    :is="paramTypes[param.type].options"
                    v-if="paramTypes[param.type].options"
                    v-model="param.data"
                    :default-value="paramTypes[param.type].data"
                  />
                </div>
              </ui-expand>
            </div>
          </div>
        </template>
      </draggable>
    </section>
  </div>
  <div
    class="mt-4 flex items-center justify-between border-t border-border/60 pt-3"
  >
    <ui-button
      v-if="state.parameters.length > 0"
      variant="secondary"
      size="sm"
      @click="addParameter"
    >
      <v-remixicon name="Plus" class="mr-1.5" size="16" />
      <span>{{ $t('workflow.parameters.add', 'Add parameter') }}</span>
    </ui-button>
    <div v-else class="grow" />
    <ui-checkbox
      v-if="!hidePreferTab"
      :model-value="preferTab"
      class="text-xs"
      @change="$emit('update:preferTab', $event)"
    >
      {{
        $t(
          'workflow.parameters.preferInTab',
          'Execute workflow parameters in a new tab'
        )
      }}
    </ui-checkbox>
  </div>
</template>
<script setup>
import workflowParameters from '@business/parameters';
import cloneDeep from 'lodash.clonedeep';
import { nanoid } from 'nanoid/non-secure';
import { reactive, watch } from 'vue';
import Draggable from 'vuedraggable';
import ParameterCheckboxValue from './Parameter/ParameterCheckboxValue.vue';
import ParameterInputOptions from './Parameter/ParameterInputOptions.vue';
import ParameterInputValue from './Parameter/ParameterInputValue.vue';
import ParameterJsonValue from './Parameter/ParameterJsonValue.vue';

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  preferTab: Boolean,
  hidePreferTab: Boolean,
});
const emit = defineEmits(['update', 'update:preferTab']);

const customParameters = workflowParameters();

const paramTypes = {
  string: {
    id: 'string',
    name: 'Input (string)',
    options: ParameterInputOptions,
    valueComp: ParameterInputValue,
    data: {
      masks: [],
      required: false,
      useMask: false,
      unmaskValue: false,
    },
  },
  number: {
    id: 'number',
    name: 'Input (number)',
    data: {
      required: false,
    },
  },
  json: {
    id: 'json',
    name: 'Input (JSON)',
    valueComp: ParameterJsonValue,
    data: {
      required: false,
    },
  },
  checkbox: {
    id: 'checkbox',
    name: 'Checkbox',
    valueComp: ParameterCheckboxValue,
    data: {
      required: false,
    },
  },
  ...customParameters,
};
const paramTypesArr = Object.values(paramTypes)
  .filter((item) => item.id)
  .sort((a, b) => (a.name > b.name ? 1 : -1));

const state = reactive({
  parameters: cloneDeep(props.data || []).map((item) => {
    item.id = nanoid(4);

    return item;
  }),
});

function addParameter() {
  state.parameters.push({
    name: 'param',
    type: 'string',
    description: '',
    defaultValue: '',
    placeholder: 'Text',
    data: paramTypes.string.data,
  });
}
function updateParam(index, value) {
  state.parameters[index].name = value.replace(/\s/g, '_');
}
function updateParamType(index, type) {
  const param = state.parameters[index];

  param.type = type;
  param.data = paramTypes[type].data || {};
}

watch(
  () => state.parameters,
  (parameters) => {
    emit('update', parameters);
  },
  { deep: true }
);
</script>
<style scoped>
table th,
table td {
  @apply p-1 font-normal;
}
</style>
