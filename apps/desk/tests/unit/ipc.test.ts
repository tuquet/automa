import { invoke } from '@tauri-apps/api/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { formatError, invokeCommand, isAppError } from '../../src/shared/ipc'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('invokeCommand', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset()
  })

  it('forwards to tauri invoke with correct args', async () => {
    vi.mocked(invoke).mockResolvedValue('result')
    const result = await invokeCommand('greet', { key: 'value' })
    expect(invoke).toHaveBeenCalledWith('greet', { key: 'value' })
    expect(result).toBe('result')
  })

  it('propagates errors from invoke', async () => {
    vi.mocked(invoke).mockRejectedValue({ code: 'VALIDATION', message: 'bad input' })
    await expect(invokeCommand('greet')).rejects.toEqual({
      code: 'VALIDATION',
      message: 'bad input',
    })
  })
})

describe('AppError type', () => {
  it('has the expected shape', () => {
    const error: AppError = { code: 'VALIDATION', message: 'not found' }
    expect(error.code).toBe('VALIDATION')
    expect(error.message).toBe('not found')
  })
})

describe('isAppError', () => {
  it('accepts a structured AppError object', () => {
    expect(isAppError({ code: 'VALIDATION', message: 'bad input' })).toBe(true)
  })

  it('rejects non-object values', () => {
    expect(isAppError('string error')).toBe(false)
    expect(isAppError(42)).toBe(false)
  })

  it('rejects null', () => {
    expect(isAppError(null)).toBe(false)
  })

  it('rejects objects without a code field', () => {
    expect(isAppError({ message: 'no code' })).toBe(false)
  })

  it('rejects objects without a message field', () => {
    expect(isAppError({ code: 'VALIDATION' })).toBe(false)
  })

  it('rejects objects with a non-string message', () => {
    expect(isAppError({ code: 'VALIDATION', message: 42 })).toBe(false)
  })
})

describe('formatError', () => {
  it('extracts the message from a structured AppError', () => {
    expect(formatError({ code: 'VALIDATION', message: 'Name cannot be empty' })).toBe(
      'Name cannot be empty',
    )
  })

  it('extracts the message from an Error instance', () => {
    expect(formatError(new Error('boom'))).toBe('boom')
  })

  it('stringifies anything else', () => {
    expect(formatError('plain string')).toBe('plain string')
    expect(formatError(42)).toBe('42')
  })
})
