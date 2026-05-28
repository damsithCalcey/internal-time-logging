import type { CreateUserBody, UpdateUserBody } from '@repo/shared-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminUsersApi } from './api'

export const teamKeys = {
  all: ['team'] as const,
  list: () => [...teamKeys.all, 'list'] as const,
}

export function useTeamUsers() {
  return useQuery({
    queryKey: teamKeys.list(),
    queryFn: adminUsersApi.list,
    staleTime: 30_000,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateUserBody) => adminUsersApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.list() }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserBody }) =>
      adminUsersApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.list() }),
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminUsersApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.list() }),
  })
}

export function useReactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminUsersApi.reactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.list() }),
  })
}
