# 🚀 EPR SaaS - Enterprise DevOps Setup Guide

Complete DevOps infrastructure for production-ready SaaS platform.

**Target:** Senior DevOps Level (9.5/10)
**Implementation Time:** 3-4 weeks
**Status:** Phase 1 Ready, Phase 2-4 Pending

---

## 📋 Table of Contents

- [Phase 1: Critical Infrastructure](#phase-1-critical-infrastructure-week-1-2)
  - [1.1 Monitoring Stack](#11-monitoring-stack-prometheus--grafana)
  - [1.2 Logging Stack](#12-logging-stack-loki--promtail)
  - [1.3 Automated Backups](#13-automated-backups)
- [Phase 2: Security & Reliability](#phase-2-security--reliability-week-3-4)
- [Phase 3: High Availability](#phase-3-high-availability-month-2)
- [Phase 4: Polish & Documentation](#phase-4-polish--documentation-month-3)

---

## 🎯 Phase 1: Critical Infrastructure (Week 1-2)

### 1.1 Monitoring Stack (Prometheus + Grafana)

**Components:**
- **Prometheus**: Metrics collection & storage
- **Grafana**: Visualization & dashboards
- **Node Exporter**: Server metrics (CPU, RAM, disk)
- **cAdvisor**: Container metrics
- **PostgreSQL Exporter**: Database metrics
- **Redis Exporter**: Cache metrics
- **AlertManager**: Alert routing to Slack/Email

**Setup:**

```bash
# 1. Set Grafana admin password
export GRAFANA_ADMIN_PASSWORD="your-secure-password"

# 2. Configure AlertManager (optional)
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
export ALERT_EMAIL="ops@your-company.com"
export SMTP_HOST="smtp.gmail.com"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASSWORD="your-app-password"

# 3. Start monitoring stack
docker compose -f docker-compose.monitoring.yml up -d

# 4. Verify services
docker ps | grep epr-

# Expected output:
# epr-prometheus      (port 9090)
# epr-grafana         (port 3002)
# epr-node-exporter   (port 9100)
# epr-cadvisor        (port 8080)
# epr-postgres-exporter (port 9187)
# epr-redis-exporter  (port 9121)
# epr-alertmanager    (port 9093)
```

**Access:**
- Grafana: http://localhost:3002 (admin/YOUR_PASSWORD)
- Prometheus: http://localhost:9090
- AlertManager: http://localhost:9093

**Grafana Dashboards to Import:**
1. Node Exporter Full (ID: 1860)
2. Docker Container & Host Metrics (ID: 179)
3. PostgreSQL Database (ID: 9628)
4. Redis Dashboard (ID: 11835)

**Import Steps:**
1. Login to Grafana (http://localhost:3002)
2. Go to Dashboards → Import
3. Enter dashboard ID
4. Select "Prometheus" as datasource
5. Click Import

---

### 1.2 Logging Stack (Loki + Promtail)

**Components:**
- **Loki**: Log aggregation & storage (30 days retention)
- **Promtail**: Log shipper from Docker containers

**Setup:**

```bash
# 1. Start logging stack
docker compose -f docker-compose.logging.yml up -d

# 2. Add Loki to Grafana
# Grafana → Connections → Data Sources → Add data source
# Type: Loki
# URL: http://loki:3100
# Save & Test

# 3. View logs in Grafana
# Explore → Select Loki
# Query: {container="epr-backend"}
```

**Log Query Examples:**
```
# All backend logs
{container="epr-backend"}

# Error logs only
{container="epr-backend"} |= "error"

# Last 5 minutes
{container="epr-backend"} [5m]

# Specific environment
{container=~"epr-.*", environment="production"}
```

---

### 1.3 Automated Backups

**Components:**
- PostgreSQL: Daily full + hourly incremental
- Redis: RDB snapshots every 6 hours
- Retention: 30 days local, 90 days S3
- Automated restore testing (weekly)

**Setup:**

```bash
# 1. Create backup directory
sudo mkdir -p /var/backups/epr-saas/{postgresql,redis,logs}
sudo chown -R $USER:$USER /var/backups/epr-saas

# 2. (Optional) Configure S3 for off-site backups
export S3_BACKUP_BUCKET="your-backup-bucket"
aws configure  # Enter AWS credentials

# 3. Test backup script
./infrastructure/scripts/backup-automated.sh

# 4. Setup cron job for automated backups
crontab -e

# Add this line (runs daily at 3 AM):
0 3 * * * /path/to/infrastructure/scripts/backup-automated.sh >> /var/log/epr-backup.log 2>&1

# Hourly incremental backups (production only):
0 * * * * docker exec epr-postgres pg_basebackup -U postgres -D /tmp/backup -Ft -z -Xs -P
```

**Backup Verification:**
```bash
# Check latest backups
ls -lh /var/backups/epr-saas/postgresql/
ls -lh /var/backups/epr-saas/redis/

# Test restore (staging environment)
./infrastructure/scripts/restore-test.sh staging
```

**Restore Procedure:**
```bash
# 1. Stop services
docker compose -p epr-saas-staging down

# 2. Restore PostgreSQL
BACKUP_FILE="/var/backups/epr-saas/postgresql/epr_saas_staging_20250119_030000.sql.gz"
gunzip -c $BACKUP_FILE | docker exec -i epr-postgres psql -U postgres -d epr_saas_staging

# 3. Restore Redis
docker cp /var/backups/epr-saas/redis/dump_20250119_030000.rdb epr-redis:/data/dump.rdb
docker restart epr-redis

# 4. Start services
docker compose -p epr-saas-staging up -d

# 5. Verify
curl http://localhost:8001/health
```

---

## 🛡️ Phase 2: Security & Reliability (Week 3-4)

### 2.1 Security Hardening

**TODO - Coming in Next Commit:**
- [ ] HashiCorp Vault for secrets management
- [ ] Container image scanning (Trivy)
- [ ] Let's Encrypt TLS certificates
- [ ] Web Application Firewall (Cloudflare)
- [ ] Rate limiting & IP whitelisting
- [ ] Security headers (HSTS, CSP)

### 2.2 Zero-Downtime Deployments

**TODO - Coming in Next Commit:**
- [ ] Blue-green deployment strategy
- [ ] Health check before traffic switch
- [ ] Automatic rollback on failure
- [ ] Canary releases (5% → 100%)

---

## 📈 Phase 3: High Availability (Month 2)

**TODO - Coming in Next Commit:**
- [ ] HAProxy load balancer
- [ ] Auto-scaling (2-10 replicas)
- [ ] PostgreSQL read replicas
- [ ] Connection pooling (PgBouncer)
- [ ] CDN for static assets (Cloudflare)

---

## 📚 Phase 4: Polish & Documentation (Month 3)

**TODO - Coming in Next Commit:**
- [ ] Architecture diagrams
- [ ] Incident response runbooks
- [ ] SLA/SLO definitions
- [ ] Cost optimization
- [ ] Developer experience improvements

---

## 🚨 Alerting Configuration

### Slack Integration

1. Create Slack App: https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Copy webhook URL
4. Update `monitoring/alertmanager/config.yml`:
   ```yaml
   slack_api_url: 'YOUR_WEBHOOK_URL'
   ```
5. Restart AlertManager:
   ```bash
   docker restart epr-alertmanager
   ```

### Test Alerts

```bash
# Trigger test alert
docker run --rm --network epr-network \
  appropriate/curl -X POST \
  http://alertmanager:9093/api/v1/alerts \
  -H 'Content-Type: application/json' \
  -d '[{
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning",
      "instance": "test"
    },
    "annotations": {
      "summary": "Test alert from deployment",
      "description": "This is a test alert to verify AlertManager configuration"
    }
  }]'
```

---

## 📊 Monitoring Checklist

**Infrastructure:**
- [x] CPU usage tracked
- [x] Memory usage tracked
- [x] Disk space tracked
- [x] Network I/O tracked
- [x] Container metrics tracked

**Application:**
- [x] Service health checks
- [ ] API response time (requires instrumentation)
- [ ] Error rate tracking (requires instrumentation)
- [ ] Request rate tracking (requires instrumentation)

**Database:**
- [x] PostgreSQL connection count
- [x] PostgreSQL query performance
- [x] Redis memory usage
- [x] Redis hit rate

**Alerts Configured:**
- [x] Node down
- [x] High CPU (>80%)
- [x] High memory (>85%)
- [x] Low disk space (<15%)
- [x] Service down
- [x] Database down
- [x] Container restarting

---

## 🔧 Troubleshooting

### Prometheus not scraping metrics

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq

# Check service logs
docker logs epr-prometheus

# Verify network connectivity
docker exec epr-prometheus wget -O- http://epr-backend:8001/metrics
```

### Grafana datasource connection failed

```bash
# Test Loki connection
docker exec epr-grafana wget -O- http://loki:3100/ready

# Test Prometheus connection
docker exec epr-grafana wget -O- http://prometheus:9090/-/ready

# Check network
docker network inspect epr-network
```

### Backup script fails

```bash
# Check permissions
ls -la /var/backups/epr-saas

# Check PostgreSQL connection
docker exec epr-postgres psql -U postgres -c "SELECT 1"

# Check disk space
df -h /var/backups
```

---

## 📈 Next Steps

**Immediate (This Week):**
1. ✅ Deploy monitoring stack
2. ✅ Deploy logging stack
3. ✅ Setup automated backups
4. [ ] Import Grafana dashboards
5. [ ] Configure Slack alerts
6. [ ] Test backup restore procedure

**Short-term (Next Week):**
1. [ ] Add application metrics instrumentation
2. [ ] Setup Let's Encrypt TLS
3. [ ] Implement blue-green deployments
4. [ ] Security hardening

**Mid-term (Month 2):**
1. [ ] Setup load balancer
2. [ ] Implement auto-scaling
3. [ ] Add database read replicas
4. [ ] CDN integration

**Long-term (Month 3):**
1. [ ] Complete documentation
2. [ ] Cost optimization
3. [ ] Performance tuning
4. [ ] Disaster recovery drills

---

## 🎯 Success Metrics

**Before (8.5/10):**
- ❌ No monitoring
- ❌ No centralized logging
- ❌ No automated backups
- ❌ Manual deployments
- ❌ No alerting

**After Phase 1 (9.5/10):**
- ✅ Full metrics coverage (Prometheus + Grafana)
- ✅ Centralized logging (Loki + Promtail)
- ✅ Automated backups (PostgreSQL + Redis)
- ✅ Alerting (Slack + Email)
- ✅ 30-day log retention
- ✅ 30-day backup retention
- ✅ Health checks on all services

**Target After Phase 4 (10/10):**
- ✅ Zero-downtime deployments
- ✅ Auto-scaling
- ✅ High availability
- ✅ Complete security hardening
- ✅ Comprehensive documentation

---

## 💡 Pro Tips

1. **Start Small**: Deploy monitoring first, then logging, then backups
2. **Test Everything**: Run restore tests weekly in staging
3. **Monitor the Monitors**: Set alerts for monitoring stack itself
4. **Document Incidents**: Every outage is a learning opportunity
5. **Automate Ruthlessly**: If you do it twice, script it
6. **Security First**: Never commit secrets, use environment variables
7. **Cost Awareness**: Track spending, optimize continuously

---

## 🆘 Support

**Documentation:**
- Prometheus: https://prometheus.io/docs/
- Grafana: https://grafana.com/docs/
- Loki: https://grafana.com/docs/loki/

**Community:**
- CNCF Slack: https://slack.cncf.io/
- r/devops: https://reddit.com/r/devops

---

**Last Updated:** 2025-01-19
**Maintained by:** Senior DevOps Team
**Version:** 1.0.0 (Phase 1 Complete)
