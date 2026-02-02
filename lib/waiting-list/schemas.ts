import { z } from 'zod'

export const waitingListSubmitSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().optional(),
  useCase: z.string().max(1000, 'Use case must be under 1000 characters').optional(),
})

export type WaitingListSubmitInput = z.infer<typeof waitingListSubmitSchema>

export const waitingListApprovalSchema = z.object({
  id: z.string().cuid(),
})

export type WaitingListApprovalInput = z.infer<typeof waitingListApprovalSchema>

export const waitingListBulkApprovalSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, 'Select at least one entry'),
})

export type WaitingListBulkApprovalInput = z.infer<typeof waitingListBulkApprovalSchema>
