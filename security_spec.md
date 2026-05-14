# Security Specification for The Elects Empire Archives

## Core Security Pillars
1. **Identity Integrity**: All actions must be scoped to `auth.uid()`.
2. **Access Control**: Every table with sensitive/user-specific data MUST have RLS enabled.
3. **Data Invariants**: Immutable fields (e.g., `createdAt`, `userId`) must be protected.
4. **Least Privilege**: Admins manage content (Articles, Prayers, etc.), Users manage personal data (Notebooks, Bookmarks).

## Key Collection Security Audit
### 1. Profiles
- **View**: Public
- **Update**: User owns profile or Admin

### 2. Prayers
- **View**: Public
- **Create/Update/Delete**: Owner

### 3. Notebook_Notes / Notebook_Folders
- **View/Create/Update/Delete**: User

### 4. Articles / Sermons / Devotionals
- **View**: Public
- **Create/Update/Delete**: Admin Only

## Implementation Checklist
- [x] Ensure ALL tables have RLS enabled (check `supabase_schema.sql`).
- [ ] Add explicit validation constraints for key types and lengths to Supabase where appropriate.
- [ ] Protect immutable fields in `supabase_schema.sql` using check constraints or triggers if possible.
