import { computed, ref } from 'vue'

export type ActiveModalType = 'browsers' | 'storage' | 'history' | 'settings' | null

export const activeModal = ref<ActiveModalType>(null)

function createModalBinding(type: NonNullable<ActiveModalType>) {
  return computed({
    get: () => activeModal.value === type,
    set: (val: boolean) => {
      activeModal.value = val ? type : null
    },
  })
}

export const isBrowsersModalOpen = createModalBinding('browsers')
export const isStorageModalOpen = createModalBinding('storage')
export const isHistoryModalOpen = createModalBinding('history')
export const isSettingsModalOpen = createModalBinding('settings')

export function useLayoutModals() {
  const setModal = (type: ActiveModalType) => {
    activeModal.value = type
  }
  const toggleModal = (type: NonNullable<ActiveModalType>) => {
    activeModal.value = activeModal.value === type ? null : type
  }

  return {
    activeModal,
    isBrowsersModalOpen,
    isStorageModalOpen,
    isHistoryModalOpen,
    isSettingsModalOpen,
    openModal: setModal,
    closeAllModals: () => setModal(null),
    openBrowsersModal: () => setModal('browsers'),
    closeBrowsersModal: () => setModal(null),
    toggleBrowsersModal: () => toggleModal('browsers'),
    openStorageModal: () => setModal('storage'),
    closeStorageModal: () => setModal(null),
    toggleStorageModal: () => toggleModal('storage'),
    openHistoryModal: () => setModal('history'),
    closeHistoryModal: () => setModal(null),
    toggleHistoryModal: () => toggleModal('history'),
    openSettingsModal: () => setModal('settings'),
    closeSettingsModal: () => setModal(null),
    toggleSettingsModal: () => toggleModal('settings'),
  }
}
