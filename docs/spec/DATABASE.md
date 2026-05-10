# MECH Finance — Database Schema
**Supabase Project:** imabiudrbsbizlynbqql
**Last updated:** 2026-05-10

> Source of truth for all tables and relationships.
> Always update this file BEFORE writing a migration.

## Tables

### accounts
Cash, bank, e-wallet, savings accounts.
```sql
CREATE TABLE accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users NOT NULL,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('cash','bank','ewallet','savings')),
  currency       TEXT DEFAULT 'LKR',
  initial_amount NUMERIC(15,2) DEFAULT 0,
  color          TEXT,
  icon           TEXT,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);
```

### credit_cards
```sql
CREATE TABLE credit_cards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users NOT NULL,
  name          TEXT NOT NULL,
  bank          TEXT,
  last_four     TEXT,
  credit_limit  NUMERIC(15,2) NOT NULL,
  billing_date  INT CHECK (billing_date BETWEEN 1 AND 31),
  due_date      INT CHECK (due_date BETWEEN 1 AND 31),
  currency      TEXT DEFAULT 'LKR',
  color         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own cards" ON credit_cards FOR ALL USING (auth.uid() = user_id);
```

### categories
```sql
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users NOT NULL,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('expense','income','both')),
  icon       TEXT,
  color      TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own categories" ON categories FOR ALL USING (auth.uid() = user_id);
```

### goals
Created before transfers because transfers references goals.
```sql
CREATE TABLE goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users NOT NULL,
  name           TEXT NOT NULL,
  target_amount  NUMERIC(15,2) NOT NULL,
  initial_amount NUMERIC(15,2) DEFAULT 0,
  target_date    DATE,
  icon           TEXT,
  color          TEXT,
  is_completed   BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own goals" ON goals FOR ALL USING (auth.uid() = user_id);
```

### transactions
Unified income + expense log. Central table.
```sql
CREATE TABLE transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount         NUMERIC(15,2) NOT NULL,
  date           DATE NOT NULL,
  description    TEXT NOT NULL,
  notes          TEXT,
  category_id    UUID REFERENCES categories(id),
  account_id     UUID REFERENCES accounts(id),
  credit_card_id UUID REFERENCES credit_cards(id),
  occasion       TEXT,
  is_recurring   BOOLEAN DEFAULT false,
  recurring_id   UUID,
  receipt_url    TEXT,
  ai_categorized BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
```

### transfers
Moves between accounts, cards, and goals.
```sql
CREATE TABLE transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users NOT NULL,
  amount          NUMERIC(15,2) NOT NULL,
  date            DATE NOT NULL,
  notes           TEXT,
  from_account_id UUID REFERENCES accounts(id),
  from_card_id    UUID REFERENCES credit_cards(id),
  to_account_id   UUID REFERENCES accounts(id),
  to_card_id      UUID REFERENCES credit_cards(id),
  to_goal_id      UUID REFERENCES goals(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own transfers" ON transfers FOR ALL USING (auth.uid() = user_id);
```

### budgets
```sql
CREATE TABLE budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  month       DATE NOT NULL,
  amount      NUMERIC(15,2) NOT NULL,
  rollover    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category_id, month)
);
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
```

### recurring_payments
```sql
CREATE TABLE recurring_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users NOT NULL,
  name           TEXT NOT NULL,
  amount         NUMERIC(15,2) NOT NULL,
  billing_cycle  TEXT NOT NULL CHECK (billing_cycle IN ('monthly','quarterly','yearly')),
  next_date      DATE NOT NULL,
  category_id    UUID REFERENCES categories(id),
  account_id     UUID REFERENCES accounts(id),
  credit_card_id UUID REFERENCES credit_cards(id),
  status         TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  auto_log       BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own recurring" ON recurring_payments FOR ALL USING (auth.uid() = user_id);
```

### credits_debts
```sql
CREATE TABLE credits_debts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('i_owe','they_owe')),
  person            TEXT NOT NULL,
  amount            NUMERIC(15,2) NOT NULL,
  remaining         NUMERIC(15,2) NOT NULL,
  date              DATE NOT NULL,
  due_date          DATE,
  reason            TEXT,
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','partial','settled')),
  linked_account_id UUID REFERENCES accounts(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE credits_debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own credits" ON credits_debts FOR ALL USING (auth.uid() = user_id);
```

### credit_debt_payments
```sql
CREATE TABLE credit_debt_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_debt_id UUID REFERENCES credits_debts(id) NOT NULL,
  amount         NUMERIC(15,2) NOT NULL,
  date           DATE NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);
```

### portfolio_assets
```sql
CREATE TABLE portfolio_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('cash','investment','property','vehicle','valuables','business','other')),
  description TEXT,
  currency    TEXT DEFAULT 'LKR',
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own assets" ON portfolio_assets FOR ALL USING (auth.uid() = user_id);
```

### portfolio_asset_snapshots
```sql
CREATE TABLE portfolio_asset_snapshots (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   UUID REFERENCES portfolio_assets(id) NOT NULL,
  value      NUMERIC(15,2) NOT NULL,
  date       DATE NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### portfolio_liabilities
```sql
CREATE TABLE portfolio_liabilities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('bank_loan','mortgage','credit_card_debt','hire_purchase','other')),
  original_amount NUMERIC(15,2) NOT NULL,
  description     TEXT,
  start_date      DATE,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE portfolio_liabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own liabilities" ON portfolio_liabilities FOR ALL USING (auth.uid() = user_id);
```

### portfolio_liability_snapshots
```sql
CREATE TABLE portfolio_liability_snapshots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liability_id UUID REFERENCES portfolio_liabilities(id) NOT NULL,
  balance      NUMERIC(15,2) NOT NULL,
  date         DATE NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

### account_balance_snapshots
```sql
CREATE TABLE account_balance_snapshots (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) NOT NULL,
  balance    NUMERIC(15,2) NOT NULL,
  date       DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Computed values (never stored — always derived)

| Value | Formula |
|---|---|
| Account balance | `initial_amount + Σincome - Σexpense - Σtransfer_out + Σtransfer_in` |
| CC outstanding | `Σ(CC expenses) - Σ(transfers to card)` |
| CC available | `credit_limit - outstanding` |
| Goal current | `initial_amount + Σ(transfers to goal)` |
| Goal progress % | `(current / target) × 100` |
| Asset value | Latest snapshot value |
| Liability balance | Latest snapshot balance |
| Net worth | `Σ(asset values) - Σ(liability balances)` |
| Budget remaining | `budget.amount - Σ(expenses in category this month)` |
| Recurring monthly cost | monthly=cost / quarterly=cost÷3 / yearly=cost÷12 |
