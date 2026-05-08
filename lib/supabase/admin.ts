import { createClient } from "@supabase/supabase-js"

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      client: null,
      error: "サーバー側のSupabase設定が未完了です（NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）。",
    }
  }

  return {
    client: createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    }),
    error: null,
  }
}
