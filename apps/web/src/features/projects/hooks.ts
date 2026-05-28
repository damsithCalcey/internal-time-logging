import type {
  AssignUserBody,
  CreateProjectBody,
  CreateTaskBody,
  UpdateProjectBody,
  UpdateTaskBody,
} from '@repo/shared-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectsApi, tasksApi, usersApi } from './api'

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  stats: () => [...projectKeys.all, 'stats'] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  tasks: (projectId: string) => [...projectKeys.all, 'tasks', projectId] as const,
  users: ['users', 'active'] as const,
}

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: projectsApi.list,
  })
}

export function useProjectStats() {
  return useQuery({
    queryKey: projectKeys.stats(),
    queryFn: projectsApi.stats,
  })
}

export function useProjectDetail(id: string | null) {
  return useQuery({
    queryKey: projectKeys.detail(id!),
    queryFn: () => projectsApi.detail(id!),
    enabled: !!id,
  })
}

export function useActiveUsers() {
  return useQuery({
    queryKey: projectKeys.users,
    queryFn: usersApi.listActive,
    staleTime: 60_000,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateProjectBody) => projectsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      qc.invalidateQueries({ queryKey: projectKeys.stats() })
    },
  })
}

export function useUpdateProject(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateProjectBody) => projectsApi.update(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
    },
  })
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTaskBody) => tasksApi.create(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      qc.invalidateQueries({ queryKey: projectKeys.stats() })
    },
  })
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: UpdateTaskBody }) =>
      tasksApi.update(taskId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      qc.invalidateQueries({ queryKey: projectKeys.stats() })
    },
  })
}

export function useAssignUser(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AssignUserBody) => projectsApi.assign(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export function useUnassignUser(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => projectsApi.unassign(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}
