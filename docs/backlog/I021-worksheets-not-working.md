# I021 – Worksheets not working (parked)

**Status:** Parked — tracked here and on GitHub; not in active sprint.  
**Area:** Education tab / worksheets / Supabase  
**Priority:** TBD (set when picked up)

## Summary

Several worksheet-related flows are **fragile or broken** in real use (device, env, or data). This issue is a **bucket** to reproduce, narrow, and fix with focused PRs.

## Known angles to investigate (checklist)

- [ ] **Progress / save** — `worksheet_progress` upsert, RLS, `family_id`, catalog `worksheet_id` vs DB UUIDs  
- [ ] **Education vs Features** — different entry points; confirm both call `saveProgress` with valid child/family  
- [ ] **Interactive worksheets** — Letter tracing, color mixing, animal habitats, community helpers: complete flow to score screen  
- [ ] **Math / reading** — “Coming soon” vs broken navigation vs crash  
- [ ] **Geometry / worksheet.tsx** — large screen; regressions after changes (shapes, sounds, layout)  
- [ ] **Offline / retries** — mock fallback masking real errors; surface actionable errors in dev  

## Acceptance criteria (when un-parked)

- Document **repro steps** per bug found  
- Each fix ships with a **short test plan** (manual is fine initially)  
- No schema changes unless coordinated with production merge policy  

## References

- `services/supabase/education.ts` — `saveProgress`, `getChildProgress`  
- `fix_worksheet_progress.sql` — unique constraint on `(worksheet_id, child_id)`  
- `utils/worksheetCatalog.ts` — catalog id alignment  

## GitHub

- **Issue:** https://github.com/nero-01/Motus-Repo/issues/22
