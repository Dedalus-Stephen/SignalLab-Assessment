---
name: shadcn-form
description: >
  Create a validated form in Signal Lab frontend using React Hook Form, zod, and shadcn/ui
  components. Use this skill when asked to "add a form", "create an input form",
  "build a submission form", or "add form validation" in the frontend app.
---

# shadcn/ui Form Skill — Signal Lab

## When to Use

- Adding a new form to the frontend
- Adding validation to an existing form
- Someone says "create a form for X" or "add input fields for Y"

## Prerequisites (already installed)

- `react-hook-form` — form state management
- `@hookform/resolvers` — zod integration
- `zod` — schema validation
- shadcn/ui components: `Form`, `Input`, `Select`, `Button`, `Toast`

## Step-by-Step: Create a Validated Form

### Step 1: Define the Zod Schema

```typescript
// In the component file or a shared schemas file
import { z } from 'zod';

const formSchema = z.object({
  type: z.enum(['success', 'validation_error', 'system_error', 'slow_request', 'teapot'], {
    required_error: 'Please select a scenario type',
  }),
  name: z.string().max(100, 'Name must be under 100 characters').optional(),
});

type FormValues = z.infer<typeof formSchema>;
```

### Step 2: Set Up React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    type: 'success',
    name: '',
  },
});
```

### Step 3: Connect to TanStack Query Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: async (values: FormValues) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scenarios/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || `Error ${res.status}`);
    }
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    toast.success('Scenario completed');
    form.reset();
  },
  onError: (error: Error) => {
    toast.error(error.message);
  },
});
```

### Step 4: Build the JSX with shadcn/ui Components

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Run Scenario</CardTitle>
  </CardHeader>
  <CardContent>
    <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
      {/* Select field */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Scenario Type</label>
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="validation_error">Validation Error</SelectItem>
                <SelectItem value="system_error">System Error</SelectItem>
                <SelectItem value="slow_request">Slow Request</SelectItem>
                <SelectItem value="teapot">Teapot ☕</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.type && (
          <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
        )}
      </div>

      {/* Text input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Name (optional)</label>
        <Input {...form.register('name')} placeholder="My test scenario" />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Running...' : 'Run Scenario'}
      </Button>
    </form>
  </CardContent>
</Card>
```

### Step 5: Add "use client" Directive

Since forms use hooks and browser APIs, the component file MUST start with:

```typescript
"use client";
```

## Key Patterns

- Always use `Controller` from react-hook-form for shadcn `Select` (it doesn't expose a native `ref`)
- Use `form.register('fieldName')` for simple inputs like `Input`, `Textarea`
- Show validation errors from `form.formState.errors.<field>.message`
- Disable the submit button with `mutation.isPending`
- Reset the form on success with `form.reset()`
- Show results via `toast.success()` / `toast.error()` from sonner

## Reference

See `apps/frontend/src/app/page.tsx` for the existing scenario runner form as a working example.

## Checklist

- [ ] Zod schema defined with proper error messages
- [ ] `useForm` with `zodResolver`
- [ ] `useMutation` for submission with onSuccess/onError
- [ ] shadcn/ui components (Card, Input, Select, Button)
- [ ] Validation errors displayed inline
- [ ] Loading state on submit button
- [ ] Toast for success/error feedback
- [ ] `"use client"` directive at top of file
- [ ] Query invalidation after successful mutation
