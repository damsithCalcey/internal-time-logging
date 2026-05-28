import { http } from '@/shared/http'
import type { CreateUserBody, UpdateUserBody, UserDetail } from '@repo/shared-types'

export const adminUsersApi = {
  list(): Promise<UserDetail[]> {
    return http.get('/admin/users')
  },

  create(body: CreateUserBody): Promise<UserDetail> {
    return http.post('/admin/users', body)
  },

  update(id: string, body: UpdateUserBody): Promise<UserDetail> {
    return http.patch(`/admin/users/${id}`, body)
  },

  deactivate(id: string): Promise<void> {
    return http.post(`/admin/users/${id}/deactivate`)
  },

  reactivate(id: string): Promise<void> {
    return http.post(`/admin/users/${id}/reactivate`)
  },
}
