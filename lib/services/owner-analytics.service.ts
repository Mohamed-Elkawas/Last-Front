import type { OwnerKPIs, BookingAnalytics, FieldUtilization } from '@/lib/types/owner-analytics'
import type { Booking } from '@/lib/types/booking'
import type { Playground } from '@/lib/types/playground'
import { mockDelay } from '@/lib/services/mock-delay'

export class OwnerAnalyticsService {
  /**
   * Calculate comprehensive KPIs for owner dashboard
   */
  static async calculateKPIs(
    bookings: Booking[],
    ownedFields: Playground[]
  ): Promise<OwnerKPIs> {
    await mockDelay(200)
    
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1)
    
    // Today's bookings
    const todayBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt)
      return bookingDate >= todayStart && bookingDate < todayEnd
    })
    
    // No-show calculation
    const noShowBookings = bookings.filter(booking => 
      (booking.status === 'cancelled' && booking.cancelledAt && booking.paymentStatus === 'captured') ||
      (booking.status === 'expired' && booking.paymentStatus === 'captured')
    )
    
    const noShowRate = bookings.length > 0 
      ? (noShowBookings.length / bookings.length) * 100 
      : 0
    
    // Utilization rate calculation
    const totalAvailableHours = ownedFields.length * 16 // 16 hours per day (6:00 - 22:00)
    const totalBookedHoursToday = todayBookings.reduce((total, booking) => {
      if (booking.playground) {
        return total + (booking.playground as any).hours || 1
      }
      return total
    }, 0)
    
    const utilizationRate = totalAvailableHours > 0 
      ? (totalBookedHoursToday / totalAvailableHours) * 100 
      : 0
    
    // Calculate trends (mock data for now - in production would compare with previous period)
    const todayBookingsTrend = todayBookings.length > 0 ? 12.5 : -5.2
    const utilizationTrend = utilizationRate > 50 ? 8.3 : -3.1
    
    return {
      todayBookingsCount: todayBookings.length,
      totalBookingsCount: bookings.length,
      noShowRate: Math.round(noShowRate * 10) / 10,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      todayBookingsTrend,
      utilizationTrend
    }
  }
  
  /**
   * Get field utilization breakdown
   */
  static async getFieldUtilization(
    bookings: Booking[],
    ownedFields: Playground[]
  ): Promise<FieldUtilization[]> {
    await mockDelay(150)
    
    return ownedFields.map(field => {
      const fieldBookings = bookings.filter(booking => 
        booking.playground?.id === field.id
      )
      
      const totalBookedHours = fieldBookings.reduce((total, booking) => {
        return total + (booking.playground as any).hours || 1
      }, 0)
      
      const totalAvailableHours = 16 // 16 hours per day
      const utilizationRate = totalAvailableHours > 0 
        ? (totalBookedHours / totalAvailableHours) * 100 
        : 0
      
      return {
        fieldId: field.id,
        fieldName: field.name.en || field.name.ar,
        totalHours: totalAvailableHours,
        bookedHours: totalBookedHours,
        utilizationRate: Math.round(utilizationRate * 10) / 10
      }
    })
  }
  
  /**
   * Get booking analytics for detailed reporting
   */
  static async getBookingAnalytics(bookings: Booking[]): Promise<BookingAnalytics[]> {
    await mockDelay(100)
    
    return bookings.map(booking => ({
      id: booking.id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      date: new Date(booking.createdAt).toISOString(),
      hours: (booking.playground as any)?.hours || 1,
      createdAt: booking.createdAt,
      playedAt: booking.playedAt,
      cancelledAt: booking.cancelledAt
    }))
  }
}
