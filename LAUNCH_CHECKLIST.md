# Chazon Soft Launch Checklist (Week 13)

## Pre-Launch Configuration

### Supabase Dashboard

- [ ] **Database Replication**: Enable `chatmessage` table for Realtime
- [ ] **Auth Settings**: Configure redirect URLs for production
  - Site URL: https://chazon-two.vercel.app
  - Redirect URLs: https://chazon-two.vercel.app/auth/callback
- [ ] **Rate Limiting**: Review and adjust if needed

### Environment Variables (Vercel)

- [ ] `NEXT_PUBLIC_APP_URL` = https://chazon-two.vercel.app
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = [from Supabase]
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = [from Supabase]
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = [from Supabase]
- [ ] `DATABASE_URL` = [connection string]
- [ ] `FLUTTERWAVE_SECRET` = [live/test key]
- [ ] `FLUTTERWAVE_PUBLIC_KEY` = [live/test key]
- [ ] `AFRICASTALKING_API_KEY` = [production key]

### Flutterwave (Production)

- [ ] Switch from TEST to LIVE keys
- [ ] Verify webhook endpoint accessible
- [ ] Test payment flow with real Mobile Money

### SMS (Production)

- [ ] Disable SMS_TEST_MODE=true in production
- [ ] Verify Africa's Talking credits available

---

## Feature Verification

### Core Features ✅

- [x] User registration & login
- [x] Steward application flow
- [x] Service browsing
- [x] Booking creation
- [x] Payment initiation (Flutterwave Mobile Money)
- [x] Chat messaging (Realtime)
- [x] Review system
- [x] Dispute system
- [x] Admin dashboard

### UI/UX ✅

- [x] Responsive design
- [x] Booking timeline
- [x] Smart matching display
- [x] Notification badges
- [x] Terms acceptance

### Security ✅

- [x] Platform communication enforcement
- [x] ToS checkbox on signup
- [x] Rate limiting
- [x] Contact sharing detection

---

## Launch Day Tasks

### Hour 0 - Before Launch

- [ ] Final deployment to Vercel
- [ ] Verify all environment variables set
- [ ] Clear test data from database
- [ ] Create initial admin account

### Hour 0 - Launch

- [ ] Deploy to production
- [ ] Verify homepage loads
- [ ] Test user registration
- [ ] Test booking flow with small amount

### Hour 1-4 - Monitoring

- [ ] Monitor Vercel logs for errors
- [ ] Monitor Supabase dashboard
- [ ] Check Flutterwave dashboard
- [ ] Monitor error reporting

---

## Post-Launch

### Week 1

- [ ] Collect user feedback
- [ ] Monitor booking completion rate
- [ ] Track payment success rate
- [ ] Review flagged messages
- [ ] Address any critical bugs

### Week 2

- [ ] Marketing push
- [ ] Social media presence
- [ ] Partner with local businesses
- [ ] Community outreach

---

## Contact Information

### Support

- Email: support@chazon.com
- Admin panel: /admin

### Escalation

- Technical issues: Check Vercel logs
- Payment issues: Flutterwave dashboard
- Database issues: Supabase dashboard

---

## Quick Reference

### Test Phone Numbers (Flutterwave)

- MTN: 0770000001
- Airtel: 0750000001

### Database Connection

- Use Supabase pooler (port 6543) for better reliability

### Key URLs

- Production: https://chazon-two.vercel.app
- Admin: https://chazon-two.vercel.app/admin
- API: https://chazon-two.vercel.app/api
