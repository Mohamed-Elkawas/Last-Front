import type { Field, FieldStatus, FieldType, FieldLicense, FieldReviewAction } from '@/lib/types/field'
import type { Playground } from '@/lib/types/playground'
import { mockDelay } from '@/lib/services/mock-delay'
import { usePlaygroundsStore } from '@/lib/stores/playgrounds.store'
import { useAppStore } from '@/lib/stores/app.store'

export class FieldService {
  /**
   * Create a new field with pending approval status
   */
  static async createField(fieldData: Omit<Field, 'id' | 'status' | 'submittedAt'>): Promise<Field> {
    await mockDelay(300)
    
    const newField: Field = {
      ...fieldData,
      id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'pending_approval',
      submittedAt: Date.now(),
      pitchSizes: [fieldData.fieldType], // Convert fieldType to pitchSizes for compatibility
    }
    
    // Save to playground store for persistence
    usePlaygroundsStore.getState().addUserPlayground(newField as Playground)
    
    // Notify system for admin review
    useAppStore.getState().addNotification({
      audience: 'both',
      type: 'system',
      title: 'New Field Pending Review',
      message: `Field "${fieldData.name.en}" requires approval`,
    })
    
    return newField
  }
  
  /**
   * Update field details
   */
  static async updateField(fieldId: string, updates: Partial<Field>): Promise<Field | null> {
    await mockDelay(200)
    
    const store = usePlaygroundsStore.getState()
    const userPlaygrounds = store.userPlaygrounds
    const existingField = userPlaygrounds.find(p => p.id === fieldId)
    
    if (!existingField) return null
    
    const updatedField = { ...existingField, ...updates } as Field
    store.updateUserPlayground(fieldId, updates as Partial<Playground>)
    
    return updatedField
  }
  
  /**
   * Get field by ID
   */
  static async getFieldById(fieldId: string): Promise<Field | null> {
    await mockDelay(100)
    
    const store = usePlaygroundsStore.getState()
    const userPlaygrounds = store.userPlaygrounds
    const field = userPlaygrounds.find(p => p.id === fieldId)
    
    return field as Field || null
  }
  
  /**
   * Get all fields with optional status filter
   */
  static async getFields(status?: FieldStatus): Promise<Field[]> {
    await mockDelay(150)
    
    const store = usePlaygroundsStore.getState()
    const userPlaygrounds = store.userPlaygrounds
    
    const fields = userPlaygrounds.filter(p => 'status' in p) as Field[]
    
    if (status) {
      return fields.filter(field => field.status === status)
    }
    
    return fields
  }
  
  /**
   * Upload field license
   */
  static async uploadLicense(fieldId: string, file: File): Promise<FieldLicense> {
    await mockDelay(500) // Simulate upload delay
    
    const license: FieldLicense = {
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: Date.now(),
      url: `https://storage.hagzaya.com/licenses/${fieldId}_${file.name}`,
    }
    
    // Update field with license
    await this.updateField(fieldId, { license })
    
    return license
  }
  
  /**
   * Admin action: Approve or reject field
   */
  static async reviewField(action: FieldReviewAction): Promise<Field | null> {
    await mockDelay(200)
    
    const field = await this.getFieldById(action.fieldId)
    if (!field) return null
    
    const updates: Partial<Field> = {
      status: action.action === 'approve' ? 'active' : 'rejected',
      reviewedAt: action.reviewedAt,
      reviewedBy: action.reviewedBy,
      rejectionReason: action.reason,
    }
    
    const updatedField = await this.updateField(action.fieldId, updates)
    
    // Notify owner
    useAppStore.getState().addNotification({
      audience: 'owner',
      type: action.action === 'approve' ? 'booking_approved' : 'booking_rejected',
      title: action.action === 'approve' ? 'Field Approved' : 'Field Rejected',
      message: action.action === 'approve' 
        ? `Your field "${field.name.en}" has been approved`
        : `Your field "${field.name.en}" was rejected: ${action.reason}`,
    })
    
    return updatedField
  }
  
  /**
   * Get fields pending admin review
   */
  static async getPendingFields(): Promise<Field[]> {
    await mockDelay(100)
    
    return this.getFields('pending_approval')
  }
  
  /**
   * Get field statistics
   */
  static async getFieldStatistics(): Promise<{
    total: number
    active: number
    pending: number
    rejected: number
    suspended: number
  }> {
    await mockDelay(100)
    
    const fields = await this.getFields()
    
    return {
      total: fields.length,
      active: fields.filter(f => f.status === 'active').length,
      pending: fields.filter(f => f.status === 'pending_approval').length,
      rejected: fields.filter(f => f.status === 'rejected').length,
      suspended: fields.filter(f => f.status === 'suspended').length,
    }
  }
}
