import type { PersistedBooking } from '@/lib/types/booking'
import { BookingService } from '@/lib/services/booking.service'
import { useAppStore } from '@/lib/stores/app.store'
import { mockDelay } from '@/lib/services/mock-delay'

export interface QRCodeData {
  bookingId: string
  timestamp: number
  checksum: string
}

export interface CheckInResult {
  success: boolean
  booking?: PersistedBooking
  error?: string
  checkedInAt?: number
}

export class QRCheckInService {
  /**
   * Generate QR code data for a booking
   */
  static generateQRCodeData(bookingId: string): QRCodeData {
    const timestamp = Date.now()
    const checksum = this.generateChecksum(bookingId, timestamp)
    
    return {
      bookingId,
      timestamp,
      checksum,
    }
  }
  
  /**
   * Generate checksum for QR code validation
   */
  private static generateChecksum(bookingId: string, timestamp: number): string {
    const data = `${bookingId}-${timestamp}`
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }
  
  /**
   * Validate QR code data
   */
  static validateQRCodeData(qrData: QRCodeData): boolean {
    const { bookingId, timestamp, checksum } = qrData
    
    // Check if QR code is expired (24 hours)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    if (now - timestamp > maxAge) {
      return false
    }
    
    // Validate checksum
    const expectedChecksum = this.generateChecksum(bookingId, timestamp)
    return checksum === expectedChecksum
  }
  
  /**
   * Check in booking using QR code
   */
  static async checkInBooking(qrData: QRCodeData): Promise<CheckInResult> {
    await mockDelay(500)
    
    // Validate QR code
    if (!this.validateQRCodeData(qrData)) {
      return {
        success: false,
        error: 'Invalid or expired QR code',
      }
    }
    
    // Get booking
    const booking = await BookingService.getBookingById(qrData.bookingId)
    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }
    
    // Check booking status
    if (booking.status !== 'confirmed') {
      return {
        success: false,
        error: `Cannot check in booking with status: ${booking.status}`,
      }
    }
    
    // Check if already checked in
    if (booking.playedAt) {
      return {
        success: false,
        error: 'Booking already checked in',
      }
    }
    
    // Check if it's time for the booking (allow 30 min early)
    const now = Date.now()
    const bookingTime = new Date(booking.createdAt).getTime()
    const thirtyMinutes = 30 * 60 * 1000
    
    if (now < bookingTime - thirtyMinutes) {
      return {
        success: false,
        error: 'Too early to check in',
      }
    }
    
    // Update booking status to completed
    const store = useAppStore.getState()
    const bookingIndex = store.bookings.findIndex(b => b.id === qrData.bookingId)
    
    if (bookingIndex >= 0) {
      const updatedBooking = { ...booking, playedAt: Date.now() }
      store.bookings[bookingIndex] = updatedBooking
      
      // Notify player
      useAppStore.getState().addNotification({
        audience: 'player',
        type: 'booking_approved',
        title: 'Check-in Successful',
        message: 'Your booking has been checked in successfully',
      })
      
      return {
        success: true,
        booking: updatedBooking,
        checkedInAt: updatedBooking.playedAt,
      }
    }
    
    return {
      success: false,
      error: 'Failed to update booking',
    }
  }
  
  /**
   * Get QR code URL for display
   */
  static getQRCodeURL(qrData: QRCodeData): string {
    const encoded = btoa(JSON.stringify(qrData))
    return `https://hagzaya.com/checkin/${encoded}`
  }
  
  /**
   * Parse QR code from URL
   */
  static parseQRCodeFromURL(url: string): QRCodeData | null {
    try {
      const parts = url.split('/')
      const encoded = parts[parts.length - 1]
      const decoded = JSON.parse(atob(encoded))
      return decoded
    } catch {
      return null
    }
  }
  
  /**
   * Get check-in statistics
   */
  static async getCheckInStatistics(): Promise<{
    totalBookings: number
    checkedInBookings: number
    checkInRate: number
    todayCheckIns: number
  }> {
    await mockDelay(100)
    
    const store = useAppStore.getState()
    const bookings = store.bookings.filter(b => b.kind === 'playground')
    
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
    const checkedInBookings = confirmedBookings.filter(b => b.playedAt)
    
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayCheckIns = checkedInBookings.filter(b => 
      b.playedAt && b.playedAt >= todayStart.getTime()
    ).length
    
    const checkInRate = confirmedBookings.length > 0 
      ? (checkedInBookings.length / confirmedBookings.length) * 100 
      : 0
    
    return {
      totalBookings: confirmedBookings.length,
      checkedInBookings: checkedInBookings.length,
      checkInRate: Math.round(checkInRate * 10) / 10,
      todayCheckIns,
    }
  }
}
