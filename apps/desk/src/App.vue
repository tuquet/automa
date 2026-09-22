<script setup lang="ts">
import MainAppLayout from './shared/layouts/MainAppLayout.vue'
import { useBindStoreSse } from './stores'

useBindStoreSse()
</script>

<template>
  <MainAppLayout />
</template>
