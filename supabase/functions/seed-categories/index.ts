import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining',   type: 'expense', icon: 'utensils',       color: '#E74C3C' },
  { name: 'Transport',       type: 'expense', icon: 'car',            color: '#E67E22' },
  { name: 'Shopping',        type: 'expense', icon: 'shopping-bag',   color: '#9B59B6' },
  { name: 'Utilities',       type: 'expense', icon: 'zap',            color: '#3498DB' },
  { name: 'Health',          type: 'expense', icon: 'heart-pulse',    color: '#2ECC71' },
  { name: 'Entertainment',   type: 'expense', icon: 'clapperboard',   color: '#F39C12' },
  { name: 'Education',       type: 'expense', icon: 'graduation-cap', color: '#1ABC9C' },
  { name: 'Rent & Housing',  type: 'expense', icon: 'home',           color: '#34495E' },
  { name: 'Personal Care',   type: 'expense', icon: 'sparkles',       color: '#E91E63' },
  { name: 'Miscellaneous',   type: 'expense', icon: 'circle-ellipsis',color: '#95A5A6' },
]

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary',             type: 'income', icon: 'briefcase',   color: '#2ECC71' },
  { name: 'Freelance',          type: 'income', icon: 'laptop',      color: '#27AE60' },
  { name: 'Business',           type: 'income', icon: 'building-2',  color: '#16A085' },
  { name: 'Investment Returns', type: 'income', icon: 'trending-up', color: '#FF5B24' },
  { name: 'Gift',               type: 'income', icon: 'gift',        color: '#8E44AD' },
  { name: 'Other Income',       type: 'income', icon: 'plus-circle', color: '#7F8C8D' },
]

Deno.serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) > 0) {
    return new Response(JSON.stringify({ seeded: false, message: 'Categories already exist' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const rows = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...DEFAULT_INCOME_CATEGORIES,
  ].map((c) => ({ ...c, user_id: user.id, is_default: true }))

  const { error } = await supabase.from('categories').insert(rows)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ seeded: true, count: rows.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
