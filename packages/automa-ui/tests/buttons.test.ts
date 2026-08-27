import { BUTTON_PROTOTYPE_REGISTRY } from '@automa/types'
import { describe, expect, it } from 'vitest'
import { AutomaButton, ConfirmationModal, ItemActionToolbar } from '../src/components'

describe('@automa/ui - Unified Button Engine & Modals', () => {
  it('exports all button components cleanly', () => {
    expect(AutomaButton).toBeDefined()
    expect(ConfirmationModal).toBeDefined()
    expect(ItemActionToolbar).toBeDefined()
  })

  it('validates canonical Button IDs exist in BUTTON_PROTOTYPE_REGISTRY', () => {
    const canonicalIds = [
      'btn.workflow.run',
      'btn.workflow.pause',
      'btn.workflow.resume',
      'btn.workflow.stop',
      'btn.workflow.save',
      'btn.workflow.lint',
      'btn.workflow.open_studio',
      'btn.campaign.run_matrix',
      'btn.campaign.abort',
      'btn.campaign.refresh',
      'btn.campaign.create',
      'btn.campaign.delete',
      'btn.browser.launch',
      'btn.browser.stop',
      'btn.browser.kill_all',
      'btn.browser.create',
      'btn.browser.set_default',
      'btn.browser.auto_detect',
      'btn.browser.download_binary',
      'btn.storage.table.add',
      'btn.storage.table.delete',
      'btn.storage.var.add',
      'btn.storage.var.delete',
      'btn.storage.cred.add',
      'btn.storage.cred.delete',
      'btn.history.clear_all',
      'btn.history.delete_item',
      'btn.history.view_logs',
      'btn.history.export_logs',
      'btn.system.health_check',
      'btn.system.command_palette',
      'btn.system.toggle_theme',
      'btn.window.minimize',
      'btn.window.maximize',
      'btn.window.close',
    ]

    for (const id of canonicalIds) {
      const schema = BUTTON_PROTOTYPE_REGISTRY[id]
      expect(schema, `Missing schema for ${id}`).toBeDefined()
      expect(schema.id).toBe(id)
      expect(schema.presentation.dataTestId).toBeDefined()
    }
  })

  it('identifies destructive buttons with confirmation modal requirements', () => {
    const destructiveIds = [
      'btn.campaign.delete',
      'btn.storage.table.delete',
      'btn.storage.var.delete',
      'btn.storage.cred.delete',
      'btn.history.clear_all',
      'btn.history.delete_item',
    ]

    for (const id of destructiveIds) {
      const schema = BUTTON_PROTOTYPE_REGISTRY[id]
      expect(
        schema.preConditions.confirmationModal,
        `Expected confirmation for ${id}`,
      ).toBeDefined()
      expect(schema.preConditions.confirmationModal?.variant).toBe('destructive')
    }
  })
})
