import { z } from 'zod'
import { UserRole } from './common.js'

// ── Request bodies ────────────────────────────────────────────────

export const CreateProjectBodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  description: z.string().max(1000).trim().nullable().optional(),
})
export type CreateProjectBody = z.infer<typeof CreateProjectBodySchema>

export const UpdateProjectBodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim().optional(),
  description: z.string().max(1000).trim().nullable().optional(),
})
export type UpdateProjectBody = z.infer<typeof UpdateProjectBodySchema>

export const CreateTaskBodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
})
export type CreateTaskBody = z.infer<typeof CreateTaskBodySchema>

export const UpdateTaskBodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim().optional(),
  isActive: z.boolean().optional(),
})
export type UpdateTaskBody = z.infer<typeof UpdateTaskBodySchema>

export const AssignUserBodySchema = z.object({
  userId: z.string().uuid(),
})
export type AssignUserBody = z.infer<typeof AssignUserBodySchema>

// ── Response shapes ───────────────────────────────────────────────

export const TaskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Task = z.infer<typeof TaskSchema>

export const AssignedMemberSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  role: UserRole,
  assignedAt: z.string(),
})
export type AssignedMember = z.infer<typeof AssignedMemberSchema>

export const ProjectListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  taskCount: z.number(),
  memberCount: z.number(),
})
export type ProjectListItem = z.infer<typeof ProjectListItemSchema>

export const ProjectDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tasks: z.array(TaskSchema),
  members: z.array(AssignedMemberSchema),
})
export type ProjectDetail = z.infer<typeof ProjectDetailSchema>

// For time-entry dropdowns (Stage 4+) — projects with active tasks only
export const ProjectOptionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  tasks: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
})
export type ProjectOption = z.infer<typeof ProjectOptionSchema>

export const ProjectStatsSchema = z.object({
  projectCount: z.number(),
  taskCount: z.number(),
  memberCount: z.number(),
})
export type ProjectStats = z.infer<typeof ProjectStatsSchema>

// Minimal user info for the assignment picker
export const UserOptionSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  role: UserRole,
})
export type UserOption = z.infer<typeof UserOptionSchema>
