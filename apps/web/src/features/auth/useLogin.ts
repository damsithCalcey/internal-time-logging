import { supabase } from '@/shared/supabase'
import { useMutation } from '@tanstack/react-query'

export interface LoginInput {
  email: string
  password: string
}

export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }: LoginInput) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
  })
}
