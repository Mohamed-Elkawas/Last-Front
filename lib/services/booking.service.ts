import type { Booking, BookingStatus, PaymentStatus, PersistedBooking } from '@/lib/types/booking'
import type { CreatePlaygroundBookingPayload } from '@/lib/types/booking'
import { useAppStore } from '@/lib/stores/app.store'
import { mockDelay } from '@/lib/services/mock-delay'

export class BookingService {
  /**
   * Create a new booking with pending review status
   */
  static async createBooking(payload: CreatePlaygroundBookingPayload): Promise<PersistedBooking> {
    await mockDelay(300)
    
    const booking: PersistedBooking = {
      id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      kind: "playground",
      status: "pending_review" as BookingStatus,
      createdAt: Date.now(),
      expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes payment window
      playerDisplayName: payload.playerDisplayName,
      playerPhone: payload.playerPhone,
      paymentMethod: payload.paymentMethod,
      playground: {
        id: payload.playgroundId,
        name: payload.playgroundName,
        location: payload.playgroundLocation,
        date: payload.date,
        dateLabel: payload.dateLabel,
        slots: payload.slots,
        hours: payload.hours,
        subtotal: payload.subtotal,
        pointsDiscount: payload.pointsDiscount,
        total: payload.total,
      },
      paymentSubmittedAt: Date.now(),
    }
    
    // Add to store
    useAppStore.getState().createPlaygroundBooking(payload)
    
    // Notify owner
    useAppStore.getState().addNotification({
      audience: 'owner',
      type: 'owner_booking_request',
      title: 'New Booking Request',
      message: `New booking request for ${payload.playgroundName.en}`,
    })
    
    return booking
  }
  
  /**
   * Approve a booking
   */
  static async approveBooking(bookingId: string, reviewedBy?: string): Promise<PersistedBooking | null> {
    await mockDelay(200)
    
    const store = useAppStore.getState()
    const booking = store.bookings.find(b => b.id === bookingId)
    
    if (!booking) return null
    
    // Update in store
    store.approveBookingRequest(bookingId)
    
    // Get updated booking
    const updatedBooking = store.bookings.find(b => b.id === bookingId) || null
    
    // Notify player
    useAppStore.getState().addNotification({
      audience: 'player',
      type: 'booking_approved',
      title: 'Booking Approved',
      message: `Your booking has been confirmed`,
    })
    
    return updatedBooking
  }
  
  /**
   * Reject a booking
   */
  static async rejectBooking(bookingId: string, reason: string, reviewedBy?: string): Promise<PersistedBooking | null> {
    await mockDelay(200)
    
    const store = useAppStore.getState()
    const booking = store.bookings.find(b => b.id === bookingId)
    
    if (!booking) return null
    
    // Update in store
    store.rejectBookingRequest(bookingId)
    
    // Get updated booking
    const updatedBooking = store.bookings.find(b => b.id === bookingId) || null
    
    // Notify player
    useAppStore.getState().addNotification({
      audience: 'player',
      type: 'booking_rejected',
      title: 'Booking Rejected',
      message: `Your booking was rejected: ${reason}`,
    })
    
    return updatedBooking
  }
  
  /**
   * Get booking by ID
   */
  static async getBookingById(bookingId: string): Promise<PersistedBooking | null> {
    await mockDelay(100)
    
    const store = useAppStore.getState()
    return store.bookings.find(b => b.id === bookingId) || null
  }
  
  /**
   * Get bookings with status filter
   */
  static async getBookings(status?: BookingStatus): Promise<PersistedBooking[]> {
    await mockDelay(150)
    
    const store = useAppStore.getState()
    let bookings = store.bookings
    
    if (status) {
      bookings = bookings.filter(b => b.status === status)
    }
    
    return bookings
  }
  
  /**
   * Get bookings pending review
   */
  static async getPendingReviewBookings(): Promise<PersistedBooking[]> {
  await mockDelay(100)

  return this.getBookings("pending_review")
}
  
  /**
   * Get booking statistics
   */
  static async getBookingStatistics(): Promise<{
    total: number
    pending: number
    confirmed: number
    rejected: number
    completed: number
    cancelled: number
  }> {
    await mockDelay(100)
    
    const bookings = await this.getBookings()
    
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending_review').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      rejected: bookings.filter(b => b.status === 'rejected').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    }
  }
  
  /**
   * Bulk approve bookings
   */
  static async bulkApprove(bookingIds: string[], reviewedBy?: string): Promise<PersistedBooking[]> {
    await mockDelay(300)
    
    const results = await Promise.all(
      bookingIds.map(bookingId => this.approveBooking(bookingId, reviewedBy))
    )
    
    return results.filter((booking): booking is PersistedBooking => booking !== null)
  }
  
  /**
   * Bulk reject bookings
   */
  static async bulkReject(bookingIds: string[], reason: string, reviewedBy?: string): Promise<PersistedBooking[]> {
    await mockDelay(300)
    
    const results = await Promise.all(
      bookingIds.map(bookingId => this.rejectBooking(bookingId, reason, reviewedBy))
    )
    
    return results.filter((booking): booking is PersistedBooking => booking !== null)
  }
}
