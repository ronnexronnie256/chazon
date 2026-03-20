# Chazon Beta Testing Checklist

## Test Environment

- **URL**: https://chazon-two.vercel.app
- **Test User**: Create test accounts for clients and stewards

---

## Authentication Flow

- [ ] Sign up as new client
- [ ] Sign up as new steward
- [ ] Email verification works
- [ ] Login with email/password
- [ ] Logout works correctly
- [ ] Protected routes redirect to login
- [ ] Admin routes protected for non-admins

## Steward Application Flow

- [ ] Steward application form accessible
- [ ] ToS checkbox required
- [ ] Application submits successfully
- [ ] Admin receives notification (if enabled)
- [ ] Steward status updates correctly

## Services

- [ ] Services page loads correctly
- [ ] Category filters work
- [ ] Price filters work
- [ ] Smart matching shows when location enabled
- [ ] Service cards display correctly
- [ ] Service detail page loads
- [ ] Steward badges display

## Booking Flow

- [ ] Select service → booking form
- [ ] Fill booking details (date, time, address, notes)
- [ ] Submit booking creates task
- [ ] Booking confirmation page shows timeline
- [ ] Steward receives booking notification
- [ ] Steward can accept/reject booking
- [ ] Steward can start task
- [ ] Steward can mark task complete
- [ ] Client can confirm & release payment
- [ ] Client can cancel pending/confirmed booking

## Payment Flow (Flutterwave Test Mode)

- [ ] Payment initiation works
- [ ] Test payment completes successfully
- [ ] Payment verification updates booking status
- [ ] Webhook updates payment status
- [ ] Payment failure handled gracefully

## Chat (Realtime)

- [ ] Chat page loads conversations
- [ ] Sending message works
- [ ] Message appears instantly (Realtime)
- [ ] Messages persist on page refresh
- [ ] Unread count updates in header
- [ ] Contact sharing patterns blocked
- [ ] Flag message button works

## Reviews

- [ ] Review form displays after completion
- [ ] Rating selection works (1-5 stars)
- [ ] Comment can be added
- [ ] Review appears on booking page
- [ ] Steward rating updates

## Dispute System

- [ ] Dispute form accessible from booking
- [ ] Dispute reason selection works
- [ ] Description can be added
- [ ] Admin disputes page shows disputes
- [ ] Admin can review/resolve disputes

## Notifications

- [ ] Notifications dropdown in header
- [ ] Unread count shows
- [ ] Clicking notification navigates correctly
- [ ] Mark as read works

## Dashboard

- [ ] Dashboard loads with stats
- [ ] Active bookings count correct
- [ ] Completed bookings count correct
- [ ] Quick actions work
- [ ] Wallet balance shows (stewards)

## Admin Panel

- [ ] Admin dashboard accessible
- [ ] User management works
- [ ] Steward applications can be approved/rejected
- [ ] Flagged messages review works
- [ ] Disputes management works
- [ ] Analytics charts display

## Mobile Responsive

- [ ] Services page responsive
- [ ] Dashboard responsive
- [ ] Chat responsive
- [ ] Mobile menu works
- [ ] Touch interactions work

---

## Test Accounts

### Test Client

- Email: test-client@chazon.com
- Password: Test123!

### Test Steward (Approved)

- Email: test-steward@chazon.com
- Password: Test123!

### Admin

- Email: admin@chazon.com
- Password: Admin123!

---

## Known Issues / Notes

1. **Realtime**: Enable `chatmessage` table replication in Supabase Dashboard → Database → Replication
2. **SMS OTP**: Currently in test mode - check server console for OTP codes
3. **Payments**: Use Flutterwave test mode with test phone numbers

---

## Bug Report Template

```
Title: [Brief description]
Severity: Critical / High / Medium / Low
Steps to Reproduce:
1.
2.
3.

Expected:
Actual:

Screenshots: [Attach if applicable]
```
