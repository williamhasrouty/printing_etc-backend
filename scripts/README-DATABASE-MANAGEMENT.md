# Database Management Guide

## ⚠️ IMPORTANT: Protecting Your Data

The old seed script (`seeds/DESTRUCTIVE-products-seed.js.DANGEROUS`) **DELETES ALL DATA** before inserting products. **DO NOT USE IT** unless you want to completely reset your database.

## Safe Database Operations

### 1. Backup Database (DO THIS REGULARLY!)

Create a backup of your entire database:

```bash
node scripts/backupDatabase.js
```

This saves all products, orders, and users to `backups/latest-backup.json` with a timestamped copy.

**Run this before making any major changes!**

### 2. Restore from Backup

If something goes wrong, restore from your backup:

```bash
# Restore from latest backup
CONFIRM_RESTORE=yes node scripts/restoreDatabase.js

# Restore from specific backup file
CONFIRM_RESTORE=yes node scripts/restoreDatabase.js backup-2026-05-09.json
```

### 3. Add New Products Safely

To add new products WITHOUT deleting existing ones:

1. Edit `scripts/addMissingProducts.js`
2. Add your product definitions to the `productsToAdd` array
3. Run the script:

```bash
node scripts/addMissingProducts.js
```

This script:

- ✅ Only adds products that don't exist yet
- ✅ Skips products that are already in the database
- ✅ Never deletes existing data

### 4. Edit Products

**Recommended approach: Use the Admin Panel**

1. Log in to your admin panel at `/admin`
2. Edit products directly through the UI
3. Changes are saved immediately to the database

**Advantages:**

- ✅ Visual interface
- ✅ No risk of data loss
- ✅ Validation built-in
- ✅ No need to restart the server

## Workflow Recommendations

### Daily Operations

1. Edit products through the admin panel
2. Test your changes on the live site
3. Done! (No scripts needed)

### Before Major Changes

1. **Create a backup first:** `node scripts/backupDatabase.js`
2. Make your changes through the admin panel
3. If something breaks: `CONFIRM_RESTORE=yes node scripts/restoreDatabase.js`

### Weekly/Monthly

1. Create regular backups
2. Store backup files somewhere safe (cloud storage, external drive)

## Emergency Recovery

If you accidentally lose data:

1. Check if you have a recent backup in the `backups/` folder
2. Run the restore script with the most recent backup
3. If no backup exists, you'll need to manually re-enter your data through the admin panel

## Files Overview

### Safe Scripts (Use These)

- ✅ `scripts/backupDatabase.js` - Create database backup
- ✅ `scripts/restoreDatabase.js` - Restore from backup
- ✅ `scripts/addMissingProducts.js` - Add new products safely
- ✅ `scripts/createAdmin.js` - Create admin user

### Dangerous Files (Avoid)

- ⚠️ `seeds/DESTRUCTIVE-products-seed.js.DANGEROUS` - **DELETES ALL DATA**
- ⚠️ Only use for complete database reset (not recommended)

## Best Practices

1. **Always backup before making changes**
2. **Use the admin panel for edits** - it's safer and easier
3. **Store backups in multiple locations**
4. **Test major changes on a staging/development database first**
5. **Never run scripts with `deleteMany()` on production data**

## Questions?

- **Want to add a new product?** → Use admin panel or `addMissingProducts.js`
- **Want to edit existing products?** → Use admin panel
- **Lost your data?** → Restore from backup with `restoreDatabase.js`
- **Need regular backups?** → Run `backupDatabase.js` regularly (set up a cron job)
