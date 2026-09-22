<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, SettingsForm } from '@automa/ui'
import { Activity, Cpu, Globe, Server } from 'lucide-vue-next'
</script>

<template>
  <div class="h-full w-full flex flex-col p-6 overflow-y-auto bg-[var(--automa-bg-subtle)] text-[var(--automa-text-primary)]">
    <!-- Reusable Full Settings Form -->
    <div class="max-w-3xl space-y-6">
      <SettingsForm />

      <!-- Topology & Live Connectivity Footer -->
      <Card class="mt-8 border-border bg-card">
        <CardHeader class="pb-2">
          <div class="flex items-center gap-2 text-foreground">
            <Server class="size-4 text-primary" :stroke-width="2" />
            <CardTitle class="text-sm font-semibold tracking-tight">Network</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="space-y-2 text-sm">
          <div class="flex items-center justify-between py-1.5 border-b border-border">
            <div class="flex items-center gap-2 text-muted-foreground">
              <Activity class="size-3.5" :stroke-width="1.8" />
              <span>REST API</span>
            </div>
            <span class="font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded text-xs">http://127.0.0.1:8765</span>
          </div>

          <div class="flex items-center justify-between py-1.5 border-b border-border">
            <div class="flex items-center gap-2 text-muted-foreground">
              <Globe class="size-3.5" :stroke-width="1.8" />
              <span>Studio URL</span>
            </div>
            <span class="font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded text-xs">http://127.0.0.1:8765/studio/</span>
          </div>

          <div class="flex items-center justify-between py-1.5">
            <div class="flex items-center gap-2 text-muted-foreground">
              <Cpu class="size-3.5" :stroke-width="1.8" />
              <span>WebSocket</span>
            </div>
            <span class="font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded text-xs">ws://127.0.0.1:8765/api/v1/ws</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
