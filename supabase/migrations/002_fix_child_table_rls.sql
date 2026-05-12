-- Migration 002: Enable RLS on child tables that were missing policies
-- credit_debt_payments, portfolio_asset_snapshots, portfolio_liability_snapshots,
-- account_balance_snapshots all had no RLS — authenticated users couldn't insert.
-- Each policy joins back to the parent table to verify user ownership.

-- ── credit_debt_payments ─────────────────────────────────────────────
ALTER TABLE credit_debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own credit_debt_payments"
  ON credit_debt_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM credits_debts
      WHERE credits_debts.id = credit_debt_payments.credit_debt_id
        AND credits_debts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM credits_debts
      WHERE credits_debts.id = credit_debt_payments.credit_debt_id
        AND credits_debts.user_id = auth.uid()
    )
  );

-- ── portfolio_asset_snapshots ────────────────────────────────────────
ALTER TABLE portfolio_asset_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own asset snapshots"
  ON portfolio_asset_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_assets
      WHERE portfolio_assets.id = portfolio_asset_snapshots.asset_id
        AND portfolio_assets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio_assets
      WHERE portfolio_assets.id = portfolio_asset_snapshots.asset_id
        AND portfolio_assets.user_id = auth.uid()
    )
  );

-- ── portfolio_liability_snapshots ────────────────────────────────────
ALTER TABLE portfolio_liability_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own liability snapshots"
  ON portfolio_liability_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_liabilities
      WHERE portfolio_liabilities.id = portfolio_liability_snapshots.liability_id
        AND portfolio_liabilities.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio_liabilities
      WHERE portfolio_liabilities.id = portfolio_liability_snapshots.liability_id
        AND portfolio_liabilities.user_id = auth.uid()
    )
  );

-- ── account_balance_snapshots ────────────────────────────────────────
ALTER TABLE account_balance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own balance snapshots"
  ON account_balance_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM accounts
      WHERE accounts.id = account_balance_snapshots.account_id
        AND accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounts
      WHERE accounts.id = account_balance_snapshots.account_id
        AND accounts.user_id = auth.uid()
    )
  );
