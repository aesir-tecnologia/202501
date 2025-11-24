#!/bin/bash

# 24-hour monitoring script for auto-complete cron job
# Run with: ./tests/monitor-cron-job.sh

set -e

PGPASSWORD=postgres
DB_HOST=127.0.0.1
DB_PORT=54322
DB_USER=postgres
DB_NAME=postgres

echo "📊 Auto-Complete Cron Job Monitoring Report"
echo "Generated at: $(date)"
echo "============================================"
echo ""

# Check 1: Cron job status
echo "1. Cron Job Configuration"
echo "-------------------------"
PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname = 'auto-complete-stints';
EOF
echo ""

# Check 2: Recent execution history
echo "2. Recent Executions (Last 30 runs)"
echo "------------------------------------"
PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
  runid,
  status,
  return_message,
  start_time,
  EXTRACT(EPOCH FROM (end_time - start_time))::int as duration_seconds
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-complete-stints')
ORDER BY start_time DESC
LIMIT 30;
EOF
echo ""

# Check 3: Execution statistics
echo "3. Execution Statistics (Last 24 hours)"
echo "---------------------------------------"
PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
WITH recent_runs AS (
  SELECT
    status,
    EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
  FROM cron.job_run_details
  WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-complete-stints')
    AND start_time > now() - interval '24 hours'
)
SELECT
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE status = 'succeeded') as successful_executions,
  COUNT(*) FILTER (WHERE status != 'succeeded') as failed_executions,
  ROUND((COUNT(*) FILTER (WHERE status = 'succeeded')::numeric / NULLIF(COUNT(*), 0) * 100)::numeric, 2) as success_rate_pct,
  ROUND(AVG(duration_seconds)::numeric, 3) as avg_duration_seconds,
  ROUND(MAX(duration_seconds)::numeric, 3) as max_duration_seconds
FROM recent_runs;
EOF
echo ""

# Check 4: Auto-completed stints
echo "4. Auto-Completed Stints (Last 24 hours)"
echo "-----------------------------------------"
PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
  DATE_TRUNC('hour', ended_at) as hour,
  COUNT(*) as auto_completed_stints
FROM stints
WHERE completion_type = 'auto'
  AND ended_at > now() - interval '24 hours'
GROUP BY DATE_TRUNC('hour', ended_at)
ORDER BY hour DESC;
EOF
echo ""

# Check 5: Expected execution count
echo "5. Health Check"
echo "---------------"
echo "Expected executions per hour: 30 (every 2 minutes)"
echo "Expected executions in 24 hours: 720"
echo ""

PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
WITH stats AS (
  SELECT COUNT(*) as actual_count
  FROM cron.job_run_details
  WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-complete-stints')
    AND start_time > now() - interval '24 hours'
)
SELECT
  actual_count,
  720 as expected_count,
  ROUND((actual_count::numeric / 720 * 100)::numeric, 2) as completion_pct,
  CASE
    WHEN actual_count >= 700 THEN '✅ HEALTHY'
    WHEN actual_count >= 600 THEN '⚠️  WARNING (some executions missed)'
    ELSE '❌ CRITICAL (significant executions missed)'
  END as health_status
FROM stats;
EOF
echo ""

# Check 6: Error analysis (if any)
echo "6. Error Analysis"
echo "-----------------"
error_count=$(PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "
  SELECT COUNT(*)
  FROM cron.job_run_details
  WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-complete-stints')
    AND start_time > now() - interval '24 hours'
    AND status != 'succeeded';
")

if [ "$error_count" -gt 0 ]; then
  echo "Found $error_count failed executions:"
  PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
SELECT
  start_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-complete-stints')
  AND start_time > now() - interval '24 hours'
  AND status != 'succeeded'
ORDER BY start_time DESC;
EOF
else
  echo "✅ No failed executions in the last 24 hours"
fi
echo ""

echo "============================================"
echo "Report completed at: $(date)"
echo ""
echo "💡 Tips:"
echo "  - Run this script periodically: watch -n 3600 ./tests/monitor-cron-job.sh"
echo "  - Health status should be 'HEALTHY' with >97% completion"
echo "  - Average duration should be <1 second"
echo "  - Error count should be 0"
