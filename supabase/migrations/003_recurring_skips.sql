-- Migration 003: Add recurring_skips table + extend recurring_payments status
-- recurring_skips: tracks intentionally skipped due dates so next_date still advances
-- recurring_payments: add 'paused' status (user can pause without archiving)

-- ── Extend recurring_payments status ────────────────────────────────
ALTER TABLE recurring_payments
  DROP CONSTRAINT IF EXISTS recurring_payments_status_check;
ALTER TABLE recurring_payments
  ADD CONSTRAINT recurring_payments_status_check
  CHECK (status IN ('active', 'inactive', 'paused'));

-- ── recurring_skips ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_skips (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_id   UUID REFERENCES recurring_payments(id) NOT NULL,
  skipped_date   DATE NOT NULL,
  reason         TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recurring_skips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own recurring_skips"
  ON recurring_skips FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM recurring_payments rp
      WHERE rp.id = recurring_skips.recurring_id
        AND rp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recurring_payments rp
      WHERE rp.id = recurring_skips.recurring_id
        AND rp.user_id = auth.uid()
    )
  );
