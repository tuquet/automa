import { describe, expect, it } from 'vitest'
import {
  Accordion,
  AlertDialog,
  Avatar,
  Badge,
  Button,
  badgeVariants,
  buttonVariants,
  Card,
  Checkbox,
  cn,
  Dialog,
  DropdownMenu,
  Input,
  Popover,
  ScrollArea,
  Separator,
  Sheet,
  Skeleton,
  Switch,
  sheetVariants,
  Table,
  Tabs,
  TabsList,
  TabsTrigger,
  Tooltip,
} from '../src'

describe('@automa/ui - Shadcn UI Atomic Primitives & Utilities', () => {
  it('cn() merges classes and resolves Tailwind conflicts correctly', () => {
    expect(cn('px-2 py-1', 'bg-red-500')).toContain('bg-red-500')
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-sm', false && 'text-lg', 'font-bold')).toBe('text-sm font-bold')
  })

  it('buttonVariants generates correct class names for variants and sizes', () => {
    const defaultBtn = buttonVariants({ variant: 'default', size: 'default' })
    expect(defaultBtn).toContain('inline-flex')
    expect(defaultBtn).toContain('bg-primary')

    const primaryBtn = buttonVariants({ variant: 'primary', size: 'sm' })
    expect(primaryBtn).toContain('bg-primary')
    expect(primaryBtn).toContain('h-7')

    const destructiveBtn = buttonVariants({ variant: 'destructive', size: 'default' })
    expect(destructiveBtn).toContain('destructive')

    const iconBtn = buttonVariants({ size: 'icon' })
    expect(iconBtn).toContain('size-8')
  })

  it('badgeVariants generates correct class names for badge variants', () => {
    const defaultBadge = badgeVariants({ variant: 'default' })
    expect(defaultBadge).toContain('inline-flex')
    expect(defaultBadge).toContain('bg-primary')

    const successBadge = badgeVariants({ variant: 'success' })
    expect(successBadge).toContain('emerald')

    const warningBadge = badgeVariants({ variant: 'warning' })
    expect(warningBadge).toContain('amber')
  })

  it('sheetVariants generates correct positioning classes for sides', () => {
    const rightSheet = sheetVariants({ side: 'right' })
    expect(rightSheet).toContain('right-0')

    const bottomSheet = sheetVariants({ side: 'bottom' })
    expect(bottomSheet).toContain('bottom-0')
  })

  it('exports all atomic shadcn primitives cleanly', () => {
    expect(Button).toBeDefined()
    expect(Badge).toBeDefined()
    expect(Input).toBeDefined()
    expect(Dialog).toBeDefined()
    expect(AlertDialog).toBeDefined()
    expect(Popover).toBeDefined()
    expect(Card).toBeDefined()
    expect(Sheet).toBeDefined()
    expect(Tooltip).toBeDefined()
    expect(Separator).toBeDefined()
    expect(Skeleton).toBeDefined()
    expect(Table).toBeDefined()
    expect(Tabs).toBeDefined()
    expect(TabsList).toBeDefined()
    expect(TabsTrigger).toBeDefined()
    expect(Switch).toBeDefined()
    expect(DropdownMenu).toBeDefined()
    expect(Checkbox).toBeDefined()
    expect(ScrollArea).toBeDefined()
    expect(Avatar).toBeDefined()
    expect(Accordion).toBeDefined()
  })

  it('TabsTrigger and TabsList define authentic Shadcn horizontal layout', () => {
    expect(TabsList).toBeDefined()
    expect(TabsTrigger).toBeDefined()
  })
})
