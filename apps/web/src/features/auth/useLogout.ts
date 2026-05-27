import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/shared/supabase'

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  })
}
