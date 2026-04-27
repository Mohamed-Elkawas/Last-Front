import type { Field, FieldReviewAction } from '@/lib/types/field'
import { FieldService } from '@/lib/services/field.service'
import { mockDelay } from '@/lib/services/mock-delay'

export class AdminFieldReviewService {
  /**
   * Get all fields pending admin review
   */
  static async getPendingReviews(): Promise<Field[]> {
    await mockDelay(100)
    return FieldService.getPendingFields()
  }
  
  /**
   * Get field details for review
   */
  static async getFieldForReview(fieldId: string): Promise<Field | null> {
    await mockDelay(100)
    return FieldService.getFieldById(fieldId)
  }
  
  /**
   * Approve a field
   */
  static async approveField(fieldId: string, adminId: string, notes?: string): Promise<Field | null> {
    await mockDelay(200)
    
    const action: FieldReviewAction = {
      fieldId,
      action: 'approve',
      reviewedBy: adminId,
      reviewedAt: Date.now(),
      reason: notes,
    }
    
    return FieldService.reviewField(action)
  }
  
  /**
   * Reject a field
   */
  static async rejectField(fieldId: string, adminId: string, reason: string): Promise<Field | null> {
    await mockDelay(200)
    
    const action: FieldReviewAction = {
      fieldId,
      action: 'reject',
      reviewedBy: adminId,
      reviewedAt: Date.now(),
      reason,
    }
    
    return FieldService.reviewField(action)
  }
  
  /**
   * Get review statistics
   */
  static async getReviewStatistics(): Promise<{
    pending: number
    approvedToday: number
    rejectedToday: number
    totalReviewed: number
    averageReviewTime: number
  }> {
    await mockDelay(100)
    
    const allFields = await FieldService.getFields()
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    const pending = allFields.filter(f => f.status === 'pending_approval').length
    const approvedToday = allFields.filter(f => 
      f.status === 'active' && 
      f.reviewedAt && 
      f.reviewedAt >= todayStart.getTime()
    ).length
    const rejectedToday = allFields.filter(f => 
      f.status === 'rejected' && 
      f.reviewedAt && 
      f.reviewedAt >= todayStart.getTime()
    ).length
    const totalReviewed = allFields.filter(f => f.reviewedAt).length
    
    // Calculate average review time (mock data)
    const averageReviewTime = 2.5 // hours
    
    return {
      pending,
      approvedToday,
      rejectedToday,
      totalReviewed,
      averageReviewTime,
    }
  }
  
  /**
   * Bulk approve multiple fields
   */
  static async bulkApprove(fieldIds: string[], adminId: string): Promise<Field[]> {
    await mockDelay(300)
    
    const results = await Promise.all(
      fieldIds.map(fieldId => this.approveField(fieldId, adminId))
    )
    
    return results.filter((field): field is Field => field !== null)
  }
  
  /**
   * Bulk reject multiple fields
   */
  static async bulkReject(fieldIds: string[], adminId: string, reason: string): Promise<Field[]> {
    await mockDelay(300)
    
    const results = await Promise.all(
      fieldIds.map(fieldId => this.rejectField(fieldId, adminId, reason))
    )
    
    return results.filter((field): field is Field => field !== null)
  }
}
