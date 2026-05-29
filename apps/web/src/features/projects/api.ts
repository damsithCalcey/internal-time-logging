import { http } from '@/shared/http'
import type {
  AssignedMember,
  AssignUserBody,
  CreateProjectBody,
  CreateTaskBody,
  ProjectDetail,
  ProjectListItem,
  ProjectOption,
  ProjectStats,
  Task,
  UpdateProjectBody,
  UpdateTaskBody,
  UserOption,
} from '@repo/shared-types'

export const projectsApi = {
  list(): Promise<ProjectListItem[]> {
    return http.get('/projects')
  },

  stats(): Promise<ProjectStats> {
    return http.get('/projects/stats')
  },

  detail(id: string): Promise<ProjectDetail> {
    return http.get(`/projects/${id}`)
  },

  create(body: CreateProjectBody): Promise<ProjectListItem> {
    return http.post('/projects', body)
  },

  update(id: string, body: UpdateProjectBody): Promise<ProjectDetail> {
    return http.patch(`/projects/${id}`, body)
  },

  listForTimeEntry(userId?: string): Promise<ProjectOption[]> {
    const params = new URLSearchParams({ for: 'time-entry' })
    if (userId) params.set('user', userId)
    return http.get(`/projects?${params}`)
  },

  assign(projectId: string, body: AssignUserBody): Promise<AssignedMember> {
    return http.post(`/projects/${projectId}/assignments`, body)
  },

  unassign(projectId: string, userId: string): Promise<void> {
    return http.delete(`/projects/${projectId}/assignments/${userId}`)
  },
}

export const tasksApi = {
  list(projectId: string): Promise<Task[]> {
    return http.get(`/projects/${projectId}/tasks`)
  },

  create(projectId: string, body: CreateTaskBody): Promise<Task> {
    return http.post(`/projects/${projectId}/tasks`, body)
  },

  update(projectId: string, taskId: string, body: UpdateTaskBody): Promise<Task> {
    return http.patch(`/projects/${projectId}/tasks/${taskId}`, body)
  },
}

export const usersApi = {
  listActive(): Promise<UserOption[]> {
    return http.get('/users')
  },
}
