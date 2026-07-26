---
name: automa-cli-studio
description: "Strict development guidelines and rules for building the Vue/Shadcn frontend UI (Studio) of the Automa CLI."
---

# 🎨 Automa CLI Studio (Frontend) - Senior Development Protocol

This document enforces strict rules for developing the `studio` (Frontend) interface of the `automa-cli`. The UI is built with **Vue 3, TailwindCSS, and Shadcn-Vue**. 

As an AI Assistant, you must act as a **Senior UI/UX Developer**. Violating these rules is considered a failure of the design system.

## 🚨 1. Strict Component Usage (NO MOCKING)
You are strictly forbidden from writing "raw" Tailwind classes on standard HTML elements to mock complex UI components.
- **Rule:** If Shadcn has a component for it (e.g., `Card`, `Button`, `Input`, `Label`, `Select`, `Table`, `Dialog`), **YOU MUST USE IT**.
- **Action:** If the component does not exist in `@/components/ui`, you must install it via the CLI:
  ```bash
  npx shadcn-vue@latest add <component_name> -y
  ```
- **Prohibited:** `<div class="bg-slate-900 border rounded-xl p-5">...</div>` (Fake Card).
- **Required:** `<Card><CardHeader>...</CardHeader><CardContent>...</CardContent></Card>` (Real Card).

## 🚨 2. Strict Theming & CSS Variables
Never hardcode raw Tailwind color utilities like `slate-900` or `blue-500` for structural elements. 
- **Rule:** The project relies on CSS Variables for Light/Dark mode switching.
- **Backgrounds:** Use `bg-background`, `bg-card`, `bg-accent`, `bg-secondary`, `bg-muted`.
- **Text:** Use `text-foreground`, `text-muted-foreground`, `text-primary`.
- **Borders:** Use `border-border`, `border-input`.
- **Primary Actions:** Use `bg-primary`, `text-primary-foreground`.
- **Destructive Actions:** Use `bg-destructive`, `text-destructive-foreground`.

## 🚨 3. Navigation & Interactive Elements
- **Rule:** All interactive triggers (links, buttons) should use the `<Button>` component to leverage `cva` (class-variance-authority) for unified states (hover, focus, disabled).
- **Action for Vue Router Links:**
  ```vue
  <Button as-child variant="ghost" class="w-full justify-start">
    <RouterLink to="/path">
      <Icon class="w-4 h-4 mr-2" /> Link Text
    </RouterLink>
  </Button>
  ```

## 🚨 4. Iconography
- **Rule:** Strictly use `lucide-vue-next` for all icons. Do not introduce FontAwesome, HeroIcons, or custom SVG strings unless explicitly requested.
- **Standard Sizing:** Generally, use `w-4 h-4` for button icons, and `w-8 h-8` for page headers.

## 🚨 5. Data Fetching
- **Rule:** All API calls to the CLI Daemon backend must be wrapped using `@tanstack/vue-query` (`useQuery`, `useMutation`).
- **Action:** Ensure proper handling of `isLoading` and `isError` states, providing skeleton loaders or empty states when appropriate.

> [!IMPORTANT]
> **Checklist before delivering UI changes:**
> 1. Did I use Shadcn components instead of raw HTML?
> 2. Did I use CSS variables (`bg-card`) instead of static colors (`bg-slate-900`)?
> 3. Does the UI look premium, responsive, and properly padded?
