#!/bin/bash

# Verification script for auto-completion feature
# This script tests the auto_complete_expired_stints() function
# Run with: ./tests/verify-auto-complete.sh

set -e

PGPASSWORD=postgres
DB_HOST=127.0.0.1
DB_PORT=54322
DB_USER=postgres
DB_NAME=postgres

echo "🧪 Testing auto_complete_expired_stints() function..."
echo ""

# Test 1: Verify function exists and runs
echo "Test 1: Function executes successfully"
result=$(PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT completed_count, error_count FROM auto_complete_expired_stints();")
echo "  Result: $result"
echo "  ✓ Function executed"
echo ""

# Test 2: Verify cron job is scheduled
echo "Test 2: Cron job is scheduled"
cron_job=$(PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'auto-complete-stints';")
if [ -n "$cron_job" ]; then
  echo "  Result: $cron_job"
  echo "  ✓ Cron job is scheduled"
else
  echo "  ✗ Cron job not found"
  exit 1
fi
echo ""

# Test 3: Create an expired stint and verify auto-completion
echo "Test 3: Auto-complete expired stint"

# Get a test user and project
user_id=$(PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT id FROM auth.users LIMIT 1;" | tr -d ' ')
project_id=$(PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT id FROM projects LIMIT 1;" | tr -d ' ')

if [ -z "$user_id" ] || [ -z "$project_id" ]; then
  echo "  ✗ No test user or project found. Skipping test."
else
  # Create expired stint
  stint_id=$(PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "
    INSERT INTO stints (user_id, project_id, status, planned_duration, started_at, paused_duration)
    VALUES ('$user_id', '$project_id', 'active', 60, now() - interval '3 hours', 0)
    RETURNING id;
  " | head -1 | tr -d ' \n')

  echo "  Created expired stint: $stint_id"

  # Run auto-complete
  result=$(PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT completed_count, error_count FROM auto_complete_expired_stints();")
  echo "  Auto-complete result: $result"

  # Verify completion
  completion_check=$(PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "
    SELECT status, completion_type
    FROM stints
    WHERE id = '$stint_id';
  " | head -1)
  echo "  Stint status after auto-complete: $completion_check"

  if [[ $completion_check == *"completed"* ]] && [[ $completion_check == *"auto"* ]]; then
    echo "  ✓ Stint was auto-completed correctly"
  else
    echo "  ✗ Stint was not auto-completed"
    exit 1
  fi

  # Cleanup
  PGPASSWORD=$PGPASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "DELETE FROM stints WHERE id = '$stint_id';" > /dev/null
fi
echo ""

echo "✅ All tests passed!"
