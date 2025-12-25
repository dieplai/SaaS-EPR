# Database Naming Convention

## Overview

This document defines the **standardized database naming convention** for the EPR SaaS Platform. All team members must follow these conventions to ensure consistency across environments and prevent deployment issues.

## Naming Principle

**Always use FULL environment names. No abbreviations.**

This principle ensures:
- ✅ Consistency across all environments
- ✅ Clear, self-documenting configuration
- ✅ Reduced confusion for new team members
- ✅ Easier maintenance and troubleshooting

## Database Names

| Environment | Database Name | Example |
|-------------|--------------|---------|
| **Staging** | `epr_saas_staging` | Production-like test environment |
| **Production** | `epr_saas_production` | Live production database |

### Pattern
```
epr_saas_{environment}
```

## Database Users

| Environment | Username | Purpose |
|-------------|----------|---------|
| **Staging** | `epr_staging` | Owner of staging database |
| **Production** | `epr_production` | Owner of production database |

### Pattern
```
epr_{environment}
```

### ❌ DO NOT USE
- `epr_prod` (abbreviated - violates naming principle)
- `epr_stg` (abbreviated - violates naming principle)
- `production` (missing prefix)
- `staging` (missing prefix)

## Connection Strings

### Staging
```bash
DATABASE_URL=postgresql://epr_staging:${PASSWORD}@postgres:5432/epr_saas_staging
```

### Production
```bash
DATABASE_URL=postgresql://epr_production:${PASSWORD}@postgres:5432/epr_saas_production
```

## File Locations

Configuration files that use these naming conventions:

### Environment Templates
- `infrastructure/.env.staging.template`
- `infrastructure/.env.production.template`
- `infrastructure/.env.prod.template` (legacy, same as production)

### Initialization Scripts
- `infrastructure/docker/init-scripts/01-init-db.sh` - Creates databases and users

### Database Scripts
- `infrastructure/scripts/run-migrations.sh` - Runs migrations
- `infrastructure/scripts/sync-db-from-prod.sh` - Syncs staging from production
- `infrastructure/scripts/backup-db.sh` - Backs up production database
- `infrastructure/scripts/setup-database.sh` - Sets up databases and users

## Verification

To verify naming consistency across the codebase:

```bash
# Should return NO results
grep -r "epr_prod[^u]" infrastructure/

# Should return NO results
grep -r "epr_stg" infrastructure/
```

If either command returns results, those files need to be updated to use full environment names.

## Historical Context

### Why This Convention Exists

Previously, the codebase had inconsistent naming:
- Staging used full name: `epr_staging` ✅
- Production used abbreviated: `epr_prod` ❌

This caused production deployment failures because:
1. Init script created user `epr_prod`
2. Migration script expected user `epr_production`
3. Mismatch caused authentication failure: `FATAL: role "epr_production" does not exist`

### The Fix (2025-12-25)

All files were updated to use `epr_production` consistently:
- Changed `CREATE USER epr_prod` → `CREATE USER epr_production`
- Updated all connection strings
- Updated all migration and backup scripts

## Best Practices

### For Developers

1. **Always use full environment names** in configuration files
2. **Never abbreviate** environment names (staging, production)
3. **Test locally** before pushing database-related changes
4. **Verify consistency** using grep commands above

### For DevOps

1. **Document any exceptions** to this convention (if absolutely necessary)
2. **Update this document** when adding new environments
3. **Add CI/CD validation** to prevent abbreviations from being merged

### For Code Reviews

Check that:
- [ ] All database usernames use full environment names
- [ ] All database names follow the `epr_saas_{environment}` pattern
- [ ] No abbreviations like `epr_prod` or `epr_stg` exist
- [ ] Connection strings match the standard format

## Example: Adding a New Environment

If adding a `development` environment:

```bash
# Database name
epr_saas_development

# Username
epr_development

# Connection string
DATABASE_URL=postgresql://epr_development:${PASSWORD}@postgres:5432/epr_saas_development
```

**NOT:**
- ❌ `epr_dev` (abbreviated)
- ❌ `development` (missing prefix)
- ❌ `epr_devel` (non-standard abbreviation)

## References

This naming convention follows industry best practices from:
- Netflix deployment patterns
- Uber database management practices
- Google SRE handbook recommendations

## Questions?

If you encounter naming inconsistencies or have questions about this convention:
1. Check this document first
2. Search existing code for examples
3. Ask the team lead for clarification
4. Update this document if the answer isn't clear

---

**Last Updated:** 2025-12-25
**Version:** 1.0
**Status:** Active
