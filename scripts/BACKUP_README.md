# Backup & Disaster Recovery Scripts

This directory contains scripts for automated database backups, restoration, and disaster recovery.

## 📦 Available Scripts

### Database Backup

```bash
# Daily backup (default)
npm run backup:db

# Hourly backup
npm run backup:db -- --hourly

# Full backup (no compression)
npm run backup:db -- --full

# Verify latest backup
npm run backup:db -- --verify
```

### Backup Verification

```bash
# Verify latest backup integrity
npm run backup:verify

# Test restore to temporary database
npm run backup:verify -- --test-restore

# Verify specific backup file
npm run backup:verify -- --file=backups/daily/backup-2025-01-27-02-00-00.sql.gz
```

### Database Restore

```bash
# Restore latest backup
npm run restore:db -- --latest

# Restore from specific date
npm run restore:db -- --date=2025-01-27

# Restore from specific file
npm run restore:db -- backups/daily/backup-2025-01-27-02-00-00.sql.gz

# Dry run (preview restore)
npm run restore:db -- --latest --dry-run
```

### Data Retention Cleanup

```bash
# Run data retention cleanup
npm run retention:cleanup

# Dry run (preview what would be deleted)
npm run retention:cleanup -- --dry-run

# Force (skip confirmation)
npm run retention:cleanup -- --force
```

---

## ⚙️ Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Backup Configuration
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30

# AWS S3 (Optional)
AWS_S3_BUCKET=your-backup-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Google Cloud Storage (Optional)
GCS_BUCKET=your-backup-bucket
GCS_KEY_FILE=./path/to/service-account-key.json

# Data Retention
RETENTION_MESSAGES_DAYS=365
RETENTION_LOGS_DAYS=90
RETENTION_ANALYTICS_DAYS=730
RETENTION_DELETED_DAYS=30

# Test Database (for verification)
TEST_DATABASE_NAME=backup_test_restore
```

---

## 📁 Backup Directory Structure

```
backups/
├── daily/
│   ├── backup-2025-01-27-02-00-00.sql.gz
│   ├── backup-2025-01-28-02-00-00.sql.gz
│   └── ...
├── hourly/
│   ├── backup-2025-01-27-10-00-00.sql.gz
│   ├── backup-2025-01-27-11-00-00.sql.gz
│   └── ...
└── monthly/
    ├── backup-2025-01-01-02-00-00.sql.gz
    └── ...
```

---

## 🔄 Automated Backups

### Using Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /path/to/backend && npm run backup:db

# Hourly backup
0 * * * * cd /path/to/backend && npm run backup:db -- --hourly

# Weekly verification
0 3 * * 0 cd /path/to/backend && npm run backup:verify
```

### Using Task Scheduler (Windows)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (daily at 2 AM)
4. Action: Start a program
5. Program: `npm`
6. Arguments: `run backup:db`
7. Start in: `C:\path\to\backend`

### Using PM2 (Node.js Process Manager)

```bash
# Install pm2-cron
npm install -g pm2-cron

# Create cron job
pm2-cron "0 2 * * *" "cd /path/to/backend && npm run backup:db"
```

---

## ☁️ Cloud Storage Setup

### AWS S3

1. **Create S3 Bucket:**
   ```bash
   aws s3 mb s3://your-backup-bucket
   ```

2. **Configure IAM:**
   - Create IAM user with S3 access
   - Generate access keys
   - Add to `.env` file

3. **Test Upload:**
   ```bash
   aws s3 cp backups/daily/backup-test.sql.gz s3://your-backup-bucket/backups/
   ```

### Google Cloud Storage

1. **Create GCS Bucket:**
   ```bash
   gsutil mb gs://your-backup-bucket
   ```

2. **Create Service Account:**
   - Go to GCP Console → IAM & Admin → Service Accounts
   - Create service account with Storage Admin role
   - Download JSON key file

3. **Configure:**
   ```env
   GCS_BUCKET=your-backup-bucket
   GCS_KEY_FILE=./path/to/service-account-key.json
   ```

4. **Test Upload:**
   ```bash
   gsutil cp backups/daily/backup-test.sql.gz gs://your-backup-bucket/backups/
   ```

---

## 🔍 Backup Verification

### Automated Verification

The backup script automatically verifies backups by:
- Checking file existence and size
- Validating compressed files (if gzipped)
- Verifying SQL structure (basic check)

### Manual Verification

```bash
# Verify latest backup
npm run backup:verify

# Test restore to temporary database
npm run backup:verify -- --test-restore
```

### What Gets Verified

- ✅ File exists and is readable
- ✅ File size > 0
- ✅ Compression valid (if gzipped)
- ✅ SQL structure valid (basic check)
- ✅ Can restore to test database (if --test-restore)

---

## 🚨 Disaster Recovery

### Quick Recovery

```bash
# 1. Stop application
pm2 stop all

# 2. Verify backup
npm run backup:verify

# 3. Restore database
npm run restore:db -- --latest

# 4. Run migrations
npx prisma migrate deploy

# 5. Restart application
pm2 start all
```

### Point-in-Time Recovery

For point-in-time recovery, you need WAL archiving enabled:

1. **Enable WAL Archiving in PostgreSQL:**
   ```conf
   # postgresql.conf
   wal_level = replica
   archive_mode = on
   archive_command = 'cp %p /path/to/wal_archive/%f'
   ```

2. **Restore to Specific Time:**
   ```bash
   # This requires manual PostgreSQL configuration
   # See PostgreSQL documentation for PITR
   ```

---

## 📊 Monitoring

### Check Backup Status

```bash
# List recent backups
ls -lh backups/daily/
ls -lh backups/hourly/

# Check backup sizes
du -sh backups/

# View backup logs
tail -f logs/backup.log
```

### Backup Health Checks

- ✅ Latest backup exists
- ✅ Backup size reasonable
- ✅ Backup age < 24 hours (daily) or < 1 hour (hourly)
- ✅ Cloud upload successful (if configured)

---

## 🛠️ Troubleshooting

### Backup Fails

**Error:** `pg_dump: command not found`
- **Solution:** Install PostgreSQL client tools
- **Linux:** `sudo apt-get install postgresql-client`
- **Mac:** `brew install postgresql`
- **Windows:** Install PostgreSQL from postgresql.org

**Error:** `Permission denied`
- **Solution:** Check file permissions on backup directory
- **Fix:** `chmod 755 backups/`

**Error:** `Database connection failed`
- **Solution:** Verify DATABASE_URL in `.env`
- **Check:** Database is running and accessible

### Restore Fails

**Error:** `Database already exists`
- **Solution:** Use `--force` flag or manually drop database first

**Error:** `Backup file corrupted`
- **Solution:** Try restoring from a different backup
- **Prevention:** Enable backup verification

### Cloud Upload Fails

**Error:** `AWS CLI not found`
- **Solution:** Install AWS CLI: `pip install awscli`

**Error:** `Access denied`
- **Solution:** Check IAM permissions and credentials

---

## 📝 Best Practices

1. **Test Backups Regularly**
   - Verify backups daily
   - Test restore monthly
   - Document recovery procedures

2. **Monitor Backup Size**
   - Alert if backup size changes significantly
   - Monitor disk space

3. **Multiple Backup Locations**
   - Local storage (primary)
   - Cloud storage (secondary)
   - Off-site backup (tertiary)

4. **Encryption**
   - Encrypt backups at rest
   - Use TLS for transfers
   - Secure backup access

5. **Documentation**
   - Document recovery procedures
   - Keep contact information updated
   - Review DR plan quarterly

---

## 🔗 Related Documentation

- [Disaster Recovery Plan](../../DISASTER_RECOVERY_PLAN.md)
- [Data Retention Policy](../../DATA_RETENTION_POLICY.md)
- [Security Implementation Summary](../../SECURITY_IMPLEMENTATION_SUMMARY.md)

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review disaster recovery plan
3. Contact database administrator

---

**Remember:** Regular backups are only useful if you test them regularly!
