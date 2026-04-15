

# Plan: Fix Logo Upload and System Color on Logo

## Problems Identified

1. **Logo not loading**: The `armazenamento` bucket is private. `getPublicUrl()` returns a URL that requires authentication, but `<img>` tags can't send auth headers. The upload works (200), the profile saves (204), but the image fails to render.

2. **System color bleeding into logo**: In `AppSidebar.tsx`, the fallback logo container uses `bg-primary`. When the user changes the system color (which sets `--primary`), the logo's background square also changes color.

## Solution

### 1. Make the bucket public (migration)
Run a migration to set the `armazenamento` bucket to public and add a permissive SELECT policy on `storage.objects` so anyone can view uploaded files.

```sql
UPDATE storage.buckets SET public = true WHERE id = 'armazenamento';

CREATE POLICY "Public read access on armazenamento"
ON storage.objects FOR SELECT
USING (bucket_id = 'armazenamento');
```

### 2. Add cache-busting to logo URL
Append a timestamp query param to the logo URL after upload so the browser doesn't cache the old image:

```typescript
const publicUrl = data.publicUrl + '?t=' + Date.now();
```

### 3. Fix sidebar logo background
In `AppSidebar.tsx`, change the fallback logo container from `bg-primary` to a neutral color (e.g., `bg-muted`) so the system color only affects interactive elements, not the logo background square. When a custom logo exists, render `<img>` without any colored background wrapper.

### Files to Modify
- **Migration SQL** — make bucket public + add read policy
- `src/hooks/useCompanyProfile.ts` — add cache-busting to URL
- `src/components/AppSidebar.tsx` — change logo container from `bg-primary` to neutral

