-- ===================================================================
-- Smart Issuance Database Initialization Script (Marketing Service)
-- File: 09_smart_issuance_tables.sql
-- Version: v1.0
-- Created: 2025-01-03
-- Description: Add auto-issuance rules and history tables
-- ===================================================================

-- 1. Create auto-issuance rules table
CREATE TABLE IF NOT EXISTS auto_issuance_rules (
    id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL,
    coupon_template_id BIGINT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    condition_json TEXT,
    frequency VARCHAR(20) NOT NULL DEFAULT 'ONCE',
    priority INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_from TIMESTAMP,
    effective_until TIMESTAMP,
    total_issue_limit INTEGER,
    issued_count INTEGER NOT NULL DEFAULT 0,
    created_by BIGINT
);

COMMENT ON TABLE auto_issuance_rules IS 'Auto issuance rules table';
COMMENT ON COLUMN auto_issuance_rules.rule_name IS 'Rule name';
COMMENT ON COLUMN auto_issuance_rules.description IS 'Rule description';
COMMENT ON COLUMN auto_issuance_rules.trigger_type IS 'Trigger type: NEW_USER, CREDIT_UPGRADE, ORDER_MILESTONE, BIRTHDAY, etc.';
COMMENT ON COLUMN auto_issuance_rules.coupon_template_id IS 'Associated coupon template ID';
COMMENT ON COLUMN auto_issuance_rules.enabled IS 'Is enabled';
COMMENT ON COLUMN auto_issuance_rules.condition_json IS 'Rule condition in JSON format';
COMMENT ON COLUMN auto_issuance_rules.frequency IS 'Issuance frequency: ONCE, DAILY, WEEKLY, MONTHLY';
COMMENT ON COLUMN auto_issuance_rules.priority IS 'Rule priority, smaller number means higher priority';
COMMENT ON COLUMN auto_issuance_rules.created_at IS 'Creation time';
COMMENT ON COLUMN auto_issuance_rules.updated_at IS 'Update time';
COMMENT ON COLUMN auto_issuance_rules.effective_from IS 'Effective from time';
COMMENT ON COLUMN auto_issuance_rules.effective_until IS 'Effective until time';
COMMENT ON COLUMN auto_issuance_rules.total_issue_limit IS 'Total issuance limit';
COMMENT ON COLUMN auto_issuance_rules.issued_count IS 'Issued count';
COMMENT ON COLUMN auto_issuance_rules.created_by IS 'Creator ID (Admin ID)';

CREATE INDEX IF NOT EXISTS idx_trigger_type ON auto_issuance_rules (trigger_type);
CREATE INDEX IF NOT EXISTS idx_enabled ON auto_issuance_rules (enabled);
CREATE INDEX IF NOT EXISTS idx_priority ON auto_issuance_rules (priority);
CREATE INDEX IF NOT EXISTS idx_coupon_template ON auto_issuance_rules (coupon_template_id);
CREATE INDEX IF NOT EXISTS idx_effective_time ON auto_issuance_rules (effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_created_at ON auto_issuance_rules (created_at);

-- 2. Create auto-issuance history table
CREATE TABLE IF NOT EXISTS auto_issuance_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    rule_id BIGINT NOT NULL,
    user_coupon_id BIGINT,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_event_json TEXT,
    successful BOOLEAN NOT NULL,
    failure_reason VARCHAR(500),
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processing_time_ms BIGINT,
    FOREIGN KEY (rule_id) REFERENCES auto_issuance_rules (id) ON DELETE CASCADE
);

COMMENT ON TABLE auto_issuance_history IS 'Auto issuance history table';
COMMENT ON COLUMN auto_issuance_history.user_id IS 'User ID';
COMMENT ON COLUMN auto_issuance_history.rule_id IS 'Triggered rule ID';
COMMENT ON COLUMN auto_issuance_history.user_coupon_id IS 'Issued user coupon ID';
COMMENT ON COLUMN auto_issuance_history.trigger_type IS 'Trigger type';
COMMENT ON COLUMN auto_issuance_history.trigger_event_json IS 'Trigger event details in JSON';
COMMENT ON COLUMN auto_issuance_history.successful IS 'Is successful';
COMMENT ON COLUMN auto_issuance_history.failure_reason IS 'Failure reason';
COMMENT ON COLUMN auto_issuance_history.issued_at IS 'Issuance time';
COMMENT ON COLUMN auto_issuance_history.processing_time_ms IS 'Processing time in ms';

CREATE INDEX IF NOT EXISTS idx_user_id ON auto_issuance_history (user_id);
CREATE INDEX IF NOT EXISTS idx_rule_id ON auto_issuance_history (rule_id);
CREATE INDEX IF NOT EXISTS idx_history_trigger_type ON auto_issuance_history (trigger_type);
CREATE INDEX IF NOT EXISTS idx_successful ON auto_issuance_history (successful);
CREATE INDEX IF NOT EXISTS idx_issued_at ON auto_issuance_history (issued_at);
CREATE INDEX IF NOT EXISTS idx_user_rule ON auto_issuance_history (user_id, rule_id);

-- 3. Insert initial sample rules
INSERT INTO
    auto_issuance_rules (
        rule_name,
        description,
        trigger_type,
        coupon_template_id,
        enabled,
        condition_json,
        frequency,
        priority,
        effective_from,
        effective_until,
        total_issue_limit,
        created_by
    )
VALUES
    -- New user welcome coupon
    (
        'New User Welcome Coupon',
        'Automatically issue welcome coupon within 7 days of registration',
        'NEW_USER',
        1,
        TRUE,
        '{"registrationDays": 7}',
        'ONCE',
        10,
        '2025-01-01 00:00:00',
        '2025-12-31 23:59:59',
        10000,
        1
    ),

-- High credit user exclusive coupon
(
    'High Credit User Exclusive',
    'Automatically issue exclusive coupon for users with credit level 5 or above',
    'CREDIT_UPGRADE',
    1,
    TRUE,
    '{"minCreditLevel": 5, "maxCreditLevel": 10}',
    'ONCE',
    20,
    '2025-01-01 00:00:00',
    '2025-12-31 23:59:59',
    5000,
    1
),

-- Order milestone reward
(
    '10 Orders Milestone Reward',
    'Automatically issue reward coupon when user reaches 10 orders',
    'ORDER_MILESTONE',
    1,
    TRUE,
    '{"minOrderCount": 10, "minTotalAmount": 300.0}',
    'ONCE',
    30,
    '2025-01-01 00:00:00',
    '2025-12-31 23:59:59',
    2000,
    1
),

-- VIP user monthly benefit
(
    'VIP User Monthly Benefit',
    'Monthly exclusive benefit for VIP users',
    'VIP_USER',
    1,
    TRUE,
    '{"minCreditLevel": 8}',
    'MONTHLY',
    5,
    '2025-01-01 00:00:00',
    '2025-12-31 23:59:59',
    NULL,
    1
);

-- 4. Create view: Active rules statistics
CREATE OR REPLACE VIEW v_active_rules_stats AS
SELECT
    r.trigger_type,
    COUNT(*) as rule_count,
    SUM(r.issued_count) as total_issued,
    AVG(r.issued_count) as avg_issued_per_rule,
    MIN(r.created_at) as earliest_rule_created,
    MAX(r.updated_at) as latest_rule_updated
FROM auto_issuance_rules r
WHERE
    r.enabled = TRUE
    AND (
        r.effective_from IS NULL
        OR r.effective_from <= NOW()
    )
    AND (
        r.effective_until IS NULL
        OR r.effective_until > NOW()
    )
GROUP BY
    r.trigger_type;

-- 5. Create view: Issuance success rate statistics
CREATE OR REPLACE VIEW v_issuance_success_rate AS
SELECT
    r.id as rule_id,
    r.rule_name,
    r.trigger_type,
    COUNT(h.id) as total_attempts,
    SUM(
        CASE
            WHEN h.successful = TRUE THEN 1
            ELSE 0
        END
    ) as successful_attempts,
    SUM(
        CASE
            WHEN h.successful = FALSE THEN 1
            ELSE 0
        END
    ) as failed_attempts,
    ROUND(
        SUM(
            CASE
                WHEN h.successful = TRUE THEN 1
                ELSE 0
            END
        ) * 100.0 / COUNT(h.id),
        2
    ) as success_rate_percent,
    AVG(h.processing_time_ms) as avg_processing_time_ms
FROM
    auto_issuance_rules r
    LEFT JOIN auto_issuance_history h ON r.id = h.rule_id
WHERE
    r.enabled = TRUE
GROUP BY
    r.id,
    r.rule_name,
    r.trigger_type
HAVING
    COUNT(h.id) > 0;

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_history_user_rule_time ON auto_issuance_history (
    user_id,
    rule_id,
    issued_at DESC
);

CREATE INDEX IF NOT EXISTS idx_history_successful_time ON auto_issuance_history (successful, issued_at DESC);

CREATE INDEX IF NOT EXISTS idx_rules_valid_priority ON auto_issuance_rules (
    enabled,
    effective_from,
    effective_until,
    priority
);

-- 7. Create procedure: Cleanup expired history
CREATE OR REPLACE PROCEDURE CleanupExpiredIssuanceHistory(days_to_keep INT)
LANGUAGE plpgsql
AS $$
DECLARE
    rows_deleted INT;
BEGIN
    DELETE FROM auto_issuance_history 
    WHERE issued_at < NOW() - (days_to_keep || ' days')::interval;
    
    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    
    RAISE NOTICE 'Cleanup completed, deleted % history records', rows_deleted;
END;
$$;

-- 8. Create trigger: Auto update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_auto_issuance_rules_updated_at
    BEFORE UPDATE ON auto_issuance_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- Script execution completion note
-- ===================================================================
/*
This script created the following database objects for smart issuance feature:

1. Tables:
- auto_issuance_rules
- auto_issuance_history

2. Indexes

3. Views:
- v_active_rules_stats
- v_issuance_success_rate

4. Procedures:
- CleanupExpiredIssuanceHistory

5. Triggers:
- tr_auto_issuance_rules_updated_at

6. Sample data: 4 initial rules
*/
