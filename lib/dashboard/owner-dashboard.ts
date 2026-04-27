"use client"

import type { PersistedBooking } from "@/lib/types/booking"

export type OwnerDashboardStats = {
  bookingsToday: number
  confirmedToday: number
  pendingPaymentReviews: number
  revenueToday: number
  utilizationRate: number
  noShowCandidates: number
  tournamentsInProgress: number
}

export type UpcomingBooking = {
  id: string
  bookingCode: string
  fieldName: string
  customerName: string
  customerType: string
  startTime: string
  endTime: string
  amount: number
  currency: string
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Check if a booking is for today (playground bookings)
 */
function isTodayBooking(booking: PersistedBooking): boolean {
  if (booking.kind === 'playground' && booking.playground) {
    return booking.playground.date === getTodayDate()
  }
  // For tournaments, consider created today as today booking
  if (booking.kind === 'tournament') {
    const createdDate = new Date(booking.createdAt).toISOString().split('T')[0]
    return createdDate === getTodayDate()
  }
  return false
}

/**
 * Check if booking is confirmed
 */
function isConfirmedBooking(booking: PersistedBooking): boolean {
  return booking.status === 'confirmed'
}

/**
 * Check if booking is pending owner review
 */
function isPendingOwnerReview(booking: PersistedBooking): boolean {
  return booking.status === 'awaiting_admin_approval'
}

/**
 * Check if booking contributes to revenue (confirmed and paid)
 */
function isRevenueEligible(booking: PersistedBooking): boolean {
  return booking.status === 'confirmed'
}

/**
 * Get total amount for a booking
 */
function getBookingAmount(booking: PersistedBooking): number {
  if (booking.kind === 'playground' && booking.playground) {
    return booking.playground.total
  }
  if (booking.kind === 'tournament' && booking.tournament) {
    return booking.tournament.total
  }
  return 0
}

/**
 * Check if booking is upcoming (future date)
 */
function isUpcomingBooking(booking: PersistedBooking): boolean {
  const now = new Date()
  if (booking.kind === 'playground' && booking.playground) {
    const bookingDate = new Date(booking.playground.date)
    return bookingDate > now
  }
  // For tournaments, assume upcoming if not expired
  return booking.expiresAt > now.getTime()
}

/**
 * Check if booking is no-show candidate
 */
function isNoShowCandidate(booking: PersistedBooking): boolean {
  // Mock logic: confirmed bookings that are past their time
  if (booking.status === 'confirmed') {
    const now = new Date()
    if (booking.kind === 'playground' && booking.playground) {
      const endTime = new Date(`${booking.playground.date}T${booking.playground.slots.split(' - ')[1]}:00`)
      return endTime < now
    }
  }
  return false
}

/**
 * Check if tournament is in progress
 */
function isTournamentInProgress(booking: PersistedBooking): boolean {
  return booking.kind === 'tournament' && booking.status === 'confirmed'
}

/**
 * Compute owner dashboard stats from bookings
 */
export function getOwnerDashboardStats(bookings: PersistedBooking[]): OwnerDashboardStats {
  const todayBookings = bookings.filter(isTodayBooking)
  const confirmedToday = todayBookings.filter(isConfirmedBooking)
  const pendingReviews = bookings.filter(isPendingOwnerReview)
  const revenueToday = confirmedToday.reduce((sum, b) => sum + getBookingAmount(b), 0)
  
  // Mock utilization: assume 20 total slots, count booked slots today
  const totalSlots = 20
  const bookedSlotsToday = todayBookings.length // rough approximation
  const utilizationRate = totalSlots > 0 ? Math.round((bookedSlotsToday / totalSlots) * 100 * 10) / 10 : 0
  
  const noShowCandidates = bookings.filter(isNoShowCandidate).length
  const tournamentsInProgress = bookings.filter(isTournamentInProgress).length

  return {
    bookingsToday: todayBookings.length,
    confirmedToday: confirmedToday.length,
    pendingPaymentReviews: pendingReviews.length,
    revenueToday,
    utilizationRate,
    noShowCandidates,
    tournamentsInProgress,
  }
}

/**
 * Get upcoming bookings for owner dashboard
 */
export function getUpcomingOwnerBookings(bookings: PersistedBooking[]): UpcomingBooking[] {
  return bookings
    .filter(b => isUpcomingBooking(b) && ['pending_payment', 'payment_submitted', 'awaiting_admin_approval', 'confirmed'].includes(b.status))
    .sort((a, b) => {
      // Sort by date/time
      if (a.kind === 'playground' && b.kind === 'playground' && a.playground && b.playground) {
        return new Date(a.playground.date).getTime() - new Date(b.playground.date).getTime()
      }
      return a.createdAt - b.createdAt
    })
    .slice(0, 5) // Limit to 5
    .map(booking => ({
      id: booking.id,
      bookingCode: `BK-${booking.id.slice(-4).toUpperCase()}`,
      fieldName: booking.kind === 'playground' && booking.playground ? booking.playground.name.en : 'Tournament',
      customerName: booking.playerDisplayName || 'Unknown Player',
      customerType: booking.kind === 'playground' ? 'player' : 'team',
      startTime: booking.kind === 'playground' && booking.playground ? `${booking.playground.date}T${booking.playground.slots.split(' - ')[0]}:00Z` : new Date(booking.createdAt).toISOString(),
      endTime: booking.kind === 'playground' && booking.playground ? `${booking.playground.date}T${booking.playground.slots.split(' - ')[1]}:00Z` : new Date(booking.expiresAt).toISOString(),
      amount: getBookingAmount(booking),
      currency: 'EGP',
    }))
}