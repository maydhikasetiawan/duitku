import { supabase } from '../supabase.js'

// ── AUTH ──
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

// ── SETTINGS (kas, invest, emas) ──
export async function getSettings() {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return { kas: 0, invest: 0, emas_gram: 0, emas_harga_manual: 0 }
  }
  return data
}

export async function saveSettings(settings) {
  const user = await getCurrentUser()
  
  const { error } = await supabase
    .from('settings')
    .upsert(
      { 
        user_id: user.id,
        kas: settings.kas || 0,
        invest: settings.invest || 0,
        emas_gram: settings.emas_gram || 0,
        emas_harga_manual: settings.emas_harga_manual || 0,
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.log('saveSettings error:', error)
    return false
  }
  return true
}

// ── BANK ACCOUNTS ──
export async function getBankAccounts() {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('name')
  return error ? [] : data
}

export async function addBankAccount(name, balance) {
  const user = await getCurrentUser()
  const { error } = await supabase
    .from('bank_accounts')
    .insert({ id: 'bank_' + Date.now(), user_id: user.id, name, balance })
  return !error
}

export async function updateBankBalance(id, balance) {
  const { error } = await supabase
    .from('bank_accounts')
    .update({ balance })
    .eq('id', id)
  return !error
}

export async function deleteBankAccount(id) {
  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id)
  return !error
}

// ── TRANSACTIONS ──
export async function getTransactions() {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(100)
  return error ? [] : data
}

export async function addTransaction(tx) {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...tx, user_id: user.id })
    .select()
    .single()
  return error ? null : data
}

export async function voidTransaction(id) {
  const { error } = await supabase
    .from('transactions')
    .update({ voided: true })
    .eq('id', id)
  return !error
}

// ── BUDGETS ──
export async function getBudgets() {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
  return error ? [] : data
}

export async function saveBudget(category, amount) {
  const user = await getCurrentUser()
  const { error } = await supabase
    .from('budgets')
    .upsert({ user_id: user.id, category, amount },
      { onConflict: 'user_id, category' })
  return !error
}

// ── GOALS ──
export async function getGoals() {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('id')
  return error ? [] : data
}

export async function addGoal(goal) {
  const user = await getCurrentUser()
  const { error } = await supabase
    .from('goals')
    .insert({ ...goal, user_id: user.id })
  return !error
}

export async function updateGoalSaved(id, saved) {
  const { error } = await supabase
    .from('goals')
    .update({ saved })
    .eq('id', id)
  return !error
}

export async function deleteGoal(id) {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
  return !error
}