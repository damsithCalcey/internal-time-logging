import { db } from '@/db/client.js'
import { usersRepo } from '@/db/repositories/index.js'

export async function listUsers() {
  return usersRepo.findAll(db)
}

export async function listActiveUsers() {
  return usersRepo.findAllActive(db)
}
