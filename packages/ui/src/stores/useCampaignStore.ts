import type { CampaignStoreState } from '@automa/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useCampaignStore = defineStore('campaign', () => {
  const campaignId = ref<string | null>(null)
  const campaignName = ref<string>('')
  const activeSlots = ref<CampaignStoreState['activeSlots']>([])
  const status = ref<CampaignStoreState['status']>('idle')
  const totalSlots = ref<number>(0)

  const isRunning = computed(() => status.value === 'running')
  const completedSlots = computed(
    () => activeSlots.value.filter((s) => s.status === 'completed').length,
  )
  const failedSlots = computed(() => activeSlots.value.filter((s) => s.status === 'failed').length)

  function setCampaign(id: string, name: string) {
    campaignId.value = id
    campaignName.value = name
  }

  function updateSlot(slotIndex: number, data: Partial<CampaignStoreState['activeSlots'][0]>) {
    const slot = activeSlots.value.find((s) => s.slotIndex === slotIndex)
    if (slot) {
      Object.assign(slot, data)
    } else {
      activeSlots.value.push({
        slotIndex,
        browserId: data.browserId || 'default',
        workflowId: data.workflowId || '',
        status: data.status || 'idle',
        progressPercent: data.progressPercent || 0,
      })
    }
  }

  function setCampaignStatus(newStatus: CampaignStoreState['status']) {
    status.value = newStatus
  }

  function resetMatrix() {
    activeSlots.value = []
    status.value = 'idle'
  }

  return {
    campaignId,
    campaignName,
    activeSlots,
    status,
    totalSlots,
    isRunning,
    completedSlots,
    failedSlots,
    setCampaign,
    updateSlot,
    setCampaignStatus,
    resetMatrix,
  }
})
