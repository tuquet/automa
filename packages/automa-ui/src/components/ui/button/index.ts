import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-2xs hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-2xs',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-2xs',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700',
        warning: 'bg-amber-600 text-white shadow-2xs hover:bg-amber-700',
        primary: 'bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90',
      },
      size: {
        default: 'h-9 px-3.5 py-1.5 text-sm font-medium [&_svg]:size-4',
        sm: 'h-8 rounded-md px-3 text-xs gap-1.5 [&_svg]:size-3.5',
        lg: 'h-10 rounded-md px-6 text-sm [&_svg]:size-4',
        icon: 'size-9 [&_svg]:size-4',
        'icon-sm': 'size-8 [&_svg]:size-3.5',
        'icon-xs': 'size-6 p-0 [&_svg]:size-3',
        'icon-lg': 'size-10 [&_svg]:size-5',
        xs: 'h-6 px-2 text-xs rounded gap-1 [&_svg]:size-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
