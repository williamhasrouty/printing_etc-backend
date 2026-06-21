# ⚠️ CRITICAL WARNING - DO NOT RUN SEED SCRIPTS ⚠️

## THESE SCRIPTS WILL ERASE ALL YOUR MANUAL DATA

### What These Scripts Do:

- **DELETE all products from the database**
- **OVERWRITE all prices you set manually in the admin dashboard**
- **ERASE all customizations and changes**

### Why These Files Exist:

These are legacy development files kept ONLY for emergency reference.
They should **NEVER** be run in a live environment.

### All Seed Files Are Disabled:

- Files are renamed with `.DISABLED` extension
- Files are prefixed with `DANGEROUS-` to prevent accidents
- Running them requires manually removing safety checks

### If You Need to Reset Database:

1. **DON'T USE SEEDS!**
2. Use the admin dashboard to:
   - Add/edit products one at a time
   - Update prices manually
   - Your changes will persist

### Manual Data Entry Through Admin Dashboard:

✅ **SAFE** - Changes persist in MongoDB  
✅ **RECOMMENDED** - Full control over your data  
✅ **NO RISK** - Won't be overwritten

### Running Seed Scripts:

❌ **DANGEROUS** - Erases everything  
❌ **NOT RECOMMENDED** - Loss of manual work  
❌ **PERMANENT** - No undo button

---

## If You Accidentally Run a Seed:

1. Stop the script immediately (Ctrl+C)
2. Restore from backup: `npm run restore`
3. Re-enter any data added since last backup

## Prevention:

- Keep files with `.DISABLED` extension
- Never create npm scripts that run seeds
- Always use admin dashboard for data entry
