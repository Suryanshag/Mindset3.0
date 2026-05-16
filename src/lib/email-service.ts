import { Resend } from 'resend'
import { render } from '@react-email/render'
import { FROM_EMAIL } from '@/lib/email-config'
import SessionConfirmationEmail from '@/emails/session-confirmation'
import SessionBookingConfirmationEmail from '@/emails/session-booking-confirmation'
import DoctorNewBookingEmail from '@/emails/doctor-new-booking'
import SessionReminderEmail from '@/emails/session-reminder'
import OrderConfirmationEmail from '@/emails/order-confirmation'
import AssignmentCreatedEmail from '@/emails/assignment-created'
import AssignmentSubmittedEmail from '@/emails/assignment-submitted'
import NgoJoinConfirmationEmail from '@/emails/ngo-join-confirmation'
import WelcomeEmail from '@/emails/welcome'
import PaymentFailedEmail from '@/emails/payment-failed'
import SessionCancelledEmail from '@/emails/session-cancelled'
import EbookPurchasedEmail from '@/emails/ebook-purchased'
import SessionFollowupEmail from '@/emails/session-followup'
import PasswordResetEmail from '@/emails/password-reset'
import EmailVerificationEmail from '@/emails/email-verification'
import OrderShippedEmail from '@/emails/order-shipped'
import OrderDeliveredEmail from '@/emails/order-delivered'

const resend = new Resend(process.env.RESEND_API_KEY)

// Mask emails in console output: j***@example.com
function maskEmail(value: string): string {
  const at = value.indexOf('@')
  if (at <= 0) return '***'
  const local = value.slice(0, at)
  const domain = value.slice(at + 1)
  return `${local.charAt(0)}${'*'.repeat(Math.max(2, local.length - 1))}@${domain}`
}

// Helper: fire and forget with logging
function sendEmail(
  to: string,
  subject: string,
  htmlPromise: Promise<string>,
  tag: string
): void {
  const masked = maskEmail(to)
  htmlPromise
    .then((html) =>
      resend.emails.send({ from: FROM_EMAIL, to, subject, html })
    )
    .then(() => {
      console.log(`[EMAIL] ✓ ${tag} sent to ${masked}`)
    })
    .catch((err) => {
      console.error(`[EMAIL] ✗ ${tag} failed for ${masked}:`, err)
    })
}

// 1. Session confirmation (to user after payment)
export function sendSessionConfirmation(
  to: string,
  props: {
    userName: string
    doctorName: string
    doctorDesignation: string
    sessionDate: Date
    meetLink: string | null
  }
): void {
  sendEmail(
    to,
    `Session Confirmed — ${props.doctorName}`,
    render(SessionConfirmationEmail(props)),
    'session-confirmation'
  )
}

// 1b. Session booking confirmation (richer template — used by webhook after
//     payment.captured flips Session.status to CONFIRMED).
export function sendSessionBookingConfirmation(
  to: string,
  props: {
    userName: string
    doctorName: string
    sessionDate: Date
    durationMin: number
    meetLink: string | null
    sessionId: string
  }
): void {
  sendEmail(
    to,
    `Your session with ${props.doctorName} is confirmed`,
    render(SessionBookingConfirmationEmail(props)),
    'session-booking-confirmation'
  )
}

// 1c. Doctor "new booking, please add Meet link" notification — fired
//     from the webhook alongside sendSessionBookingConfirmation.
export function sendDoctorNewBookingNotification(
  to: string,
  props: {
    doctorName: string
    userName: string
    sessionDate: Date
    durationMin: number
    sessionId: string
  }
): void {
  sendEmail(
    to,
    'New session booking — please add a Meet link',
    render(DoctorNewBookingEmail(props)),
    'doctor-new-booking'
  )
}

// 2. Session reminder (sent by cron job)
export function sendSessionReminder(
  to: string,
  props: {
    userName: string
    doctorName: string
    sessionDate: Date
    meetLink: string | null
    hoursUntil: number
  }
): void {
  sendEmail(
    to,
    `Reminder: Your session is in ${props.hoursUntil} hours`,
    render(SessionReminderEmail(props)),
    'session-reminder'
  )
}

// 3. Order confirmation (to user after payment)
export function sendOrderConfirmation(
  to: string,
  props: {
    userName: string
    orderId: string
    orderNumber?: string | null
    items: { name: string; quantity: number; price: number }[]
    totalAmount: number
    shippingAddress: {
      name: string
      addressLine1: string
      addressLine2?: string
      city: string
      state: string
      pincode: string
    }
    deliveryCharge?: number
    courierName?: string
  }
): void {
  const display = props.orderNumber ?? `#${props.orderId.slice(-8).toUpperCase()}`
  sendEmail(
    to,
    `Order Confirmed — ${display}`,
    render(OrderConfirmationEmail(props)),
    'order-confirmation'
  )
}

// 4. Assignment created (to user when doctor creates assignment)
export function sendAssignmentCreated(
  to: string,
  props: {
    userName: string
    doctorName: string
    assignmentTitle: string
    dueDate: Date | null
    description: string
  }
): void {
  sendEmail(
    to,
    `New Assignment: ${props.assignmentTitle}`,
    render(AssignmentCreatedEmail(props)),
    'assignment-created'
  )
}

// 5. Assignment submitted (to doctor when user submits)
export function sendAssignmentSubmitted(
  to: string,
  props: {
    doctorName: string
    userName: string
    assignmentTitle: string
    submittedAt: Date
  }
): void {
  sendEmail(
    to,
    `Assignment Submitted: ${props.assignmentTitle}`,
    render(AssignmentSubmittedEmail(props)),
    'assignment-submitted'
  )
}

// 7. Welcome email (sent on registration)
export function sendWelcomeEmail(
  to: string,
  props: { userName: string }
): void {
  sendEmail(
    to,
    'Welcome to Mindset 🌱',
    render(WelcomeEmail(props)),
    'welcome'
  )
}

// 8. Payment failed
export function sendPaymentFailed(
  to: string,
  props: {
    userName: string
    amount: number
    type: 'SESSION' | 'EBOOK' | 'PRODUCT'
    retryUrl: string
  }
): void {
  sendEmail(
    to,
    'Payment unsuccessful — please try again',
    render(PaymentFailedEmail(props)),
    'payment-failed'
  )
}

// 9. Session cancelled
export function sendSessionCancelled(
  to: string,
  props: {
    userName: string
    doctorName: string
    sessionDate: Date
    cancelledBy: 'DOCTOR' | 'ADMIN' | 'USER'
    refundNote?: string
  }
): void {
  sendEmail(
    to,
    'Your session has been cancelled',
    render(SessionCancelledEmail(props)),
    'session-cancelled'
  )
}

// 10. Ebook purchased
export function sendEbookPurchased(
  to: string,
  props: {
    userName: string
    ebookTitle: string
    amount: number
  }
): void {
  sendEmail(
    to,
    `Purchase confirmed: ${props.ebookTitle}`,
    render(EbookPurchasedEmail(props)),
    'ebook-purchased'
  )
}

// 11. Session follow-up
export function sendSessionFollowup(
  to: string,
  props: {
    userName: string
    doctorName: string
    sessionDate: Date
  }
): void {
  sendEmail(
    to,
    `How did your session go, ${props.userName}?`,
    render(SessionFollowupEmail(props)),
    'session-followup'
  )
}

// 12. Password reset
export function sendPasswordResetEmail(
  to: string,
  props: {
    userName: string
    resetUrl: string
    expiresInMinutes: number
  }
): void {
  sendEmail(
    to,
    'Reset your Mindset password',
    render(PasswordResetEmail(props)),
    'password-reset'
  )
}

// 12b. Email verification
export function sendEmailVerificationEmail(
  to: string,
  props: {
    userName: string
    verifyUrl: string
    expiresInHours: number
  }
): void {
  sendEmail(
    to,
    'Verify your Mindset email',
    render(EmailVerificationEmail(props)),
    'email-verification'
  )
}

// 13. Order shipped
export function sendOrderShipped(
  to: string,
  props: {
    userName: string
    orderId: string
    orderNumber?: string | null
    courierName: string | null
    awbCode: string | null
    trackingUrl: string | null
  }
): void {
  const display = props.orderNumber ?? `#${props.orderId.slice(-8).toUpperCase()}`
  sendEmail(
    to,
    `Your order has shipped — ${display}`,
    render(OrderShippedEmail(props)),
    'order-shipped'
  )
}

// 14. Order delivered
export function sendOrderDelivered(
  to: string,
  props: {
    userName: string
    orderId: string
    orderNumber?: string | null
  }
): void {
  const display = props.orderNumber ?? `#${props.orderId.slice(-8).toUpperCase()}`
  sendEmail(
    to,
    `Your order has arrived — ${display}`,
    render(OrderDeliveredEmail(props)),
    'order-delivered'
  )
}

// 6. NGO join confirmation (to user when they join a visit)
export function sendNgoJoinConfirmation(
  to: string,
  props: {
    userName: string
    ngoName: string
    visitDate: Date
    location: string
    whatsappLink: string | null
  }
): void {
  sendEmail(
    to,
    `You're registered for the ${props.ngoName} visit!`,
    render(NgoJoinConfirmationEmail(props)),
    'ngo-join-confirmation'
  )
}
