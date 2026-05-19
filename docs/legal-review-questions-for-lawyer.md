# Mindset — Legal Review Questions for Lawyer Consult

**Status:** Prep document for Suryansh's upcoming lawyer consultation
**Prepared:** 2026-05-19
**Context:** Soft launch (10–20 personally-invited users) on `mindset.org.in` imminent; Razorpay live keys arrive after KYC. This document is *not* legal advice; it is a structured prep doc to make the consult efficient.

---

## 1. What we have today

### Privacy Policy — `src/app/privacy-policy/page.tsx`

A 14-section policy already in place, written with DPDP Act 2023 awareness. Effective date `May 1, 2026`. Covers:

- **Identity** (§1) — names Mindset as Data Fiduciary; does **not** disclose registered legal entity name, address, or CIN.
- **Data categories** (§2) — account info, health/well-being info ("sensitive personal data"), payment info (Razorpay), shipping info (Shiprocket), communications, plus automatic info (device, usage, IP, cookies).
- **Purposes** (§3) — six purposes listed (service delivery, payments, therapist matching, transactional email, fraud prevention, legal compliance).
- **Legal basis** (§4) — consent + Section 7 legitimate uses of the DPDP Act, with named right to withdraw consent.
- **Confidentiality of clinical data** (§5) — RCI ethics referenced; serious-and-imminent-risk and court-order exceptions named.
- **Recipients** (§6) — Razorpay, Shiprocket, Resend, Cloudinary, Google Calendar, OpenRouter (AI), hosting providers, lawful authorities. Names cross-border transfer in general terms.
- **Retention** (§7) — account data while active + dispute window; clinical notes 3 years per RCI norms; tax records per Indian tax law.
- **User rights** (§8) — access, correction, erasure, nomination, grievance redress (with DPB escalation).
- **Children** (§9) — 18+ default, 13–18 with verifiable parental consent.
- **Security** (§10) — TLS, at-rest encryption for sensitive fields, RBAC, breach notification.
- **Cookies** (§11) — points to /cookies and the in-page "Update cookie preferences" trigger (added in Sprint Launch-Prep Task 1).
- **Changes** (§12), **Grievance Officer** (§13), **Contact** (§14).
- Closing **callout** acknowledging the doc is a good-faith template and needs lawyer review before launch.

### Terms of Use — `src/app/terms-of-use/page.tsx`

A 16-section terms-of-use document already in place. Effective `May 1, 2026`. Covers:

- Crisis disclaimer callout (iCall, Vandrevala, NIMHANS, KIRAN helplines named) — at top.
- Eligibility (§1) — 18+ default, 13–18 with parental consent.
- Service description (§2) — "platform, not substitute for medical/psychiatric care, emergency, or hospital"; therapist relationship clarified.
- Account responsibilities (§3).
- Session conduct (§4) — 24-hour reschedule rule, recording prohibition, conduct expectations.
- Workshops + digital products (§5) — IP, licensing.
- Physical products + returns (§6) — Shiprocket, 7-day damaged-on-arrival window.
- Payments + pricing (§7) — INR, taxes-inclusive, Razorpay.
- Refund policy (§8) — sessions 24h, workshops 48h, digital non-refundable, physical → §6. **See `docs/refund-policy-audit.md` for inconsistencies to fix.**
- Acceptable use (§9).
- Privacy reference (§10).
- Disclaimers (§11), Limitation of liability (§12) — caps damages to fees paid in trailing 3 months.
- Termination (§13).
- Governing law + disputes (§14) — Indian law; placeholder `[Your registered jurisdiction]`.
- Changes (§15), Contact (§16).
- Closing **callout** flagging §6, §8, §12, §14 for lawyer review before going live.

### Cookie Policy — `src/app/cookies/page.tsx` (new, Sprint Launch-Prep Task 1)

7-section cookie policy: definition, three categories (Essential, Analytics, Marketing), consent mechanics, change/withdraw, third-party note (Razorpay, reCAPTCHA), updates, contact.

### Cookie Banner — `src/components/legal/cookie-banner.tsx` (new)

First-visit banner. Equal-weight Accept/Reject (no dark pattern). Customize modal with focus trap + Escape. Choice persisted to `localStorage` (`mindset_cookie_consent_v1`). Re-openable from Privacy Policy §11 via custom event.

---

## 2. What we're missing (or has placeholder text)

These are gaps in the current docs — every item below either is missing entirely or has a `[bracketed placeholder]` that needs to be filled in by the lawyer / by Mindset's founders.

### Hard blockers (must fix before launch)

- **Privacy Policy §13** — Grievance Officer **name** is `[To be appointed before launch]`. The DPDP Act requires a named individual.
- **Privacy Policy §13** — **registered office address** is `[Your registered office address]`. Mandatory under DPDP for Grievance Officer disclosure.
- **Privacy Policy §1** — **legal entity name** of Mindset is missing. Is "Mindset" a sole proprietorship, a registered LLP, a Pvt Ltd, or a Section 8 company? Must match Razorpay merchant onboarding.
- **Terms §14** — `[Your registered jurisdiction]` placeholder. Must match where the entity is registered (likely Bengaluru per ops doc, but confirm).

### DPDP-specific items that need lawyer review

- **Cross-border data transfer disclosure** (Privacy §6) — current text says "Some of these partners may store data outside India; in that case we ensure transfer is permitted under the DPDP Act and is governed by appropriate contractual safeguards." DPDP Act allows the Central Government to **restrict transfers to specific countries** via notification. Confirm wording covers us if such notification issues post-launch.
- **Sensitive Personal Data** — DPDP Act does *not* currently have the SPDI Rules' formal "sensitive personal data" category. Privacy Policy §2.1 calls health/well-being info "sensitive personal data" — confirm this characterisation is still useful (it is, for SPDI Rules 2011 compliance which **also still applies**), but ask whether stronger DPDP-aligned language is preferable.
- **Significant Data Fiduciary (SDF) thresholds** — at what user count or revenue level would Mindset cross into SDF obligations (DPO mandatory, DPIA mandatory, periodic audits)? Per current Rules guidance, this is set by Central Government notification — confirm there's no notified threshold currently in force that captures us.
- **Children's consent** (Privacy §9, Terms §1) — DPDP Act requires *verifiable* parental consent. Our current text says "verifiable consent and supervision of a parent or legal guardian" but does **not specify the verification mechanism**. Confirm what a defensible mechanism looks like for a mental health platform at our scale.
- **Right to erasure vs. clinical retention** — Privacy §8 grants erasure rights "subject to lawful retention requirements"; Privacy §7 says clinical notes retained for "typically 3 years from last interaction… unless you ask for earlier deletion and there is no legal bar to it." Confirm whether 3 years matches RCI's actual professional record-keeping norm (we cite RCI generically; the lawyer should verify the cite).
- **Grievance officer SLA** — we commit to 48h acknowledgement + 30 day resolution (Privacy §13). DPDP Rules 2025 may set a different floor; confirm.
- **Cookie consent** — does our Task 1 banner (Accept all / Reject non-essential equal weight, localStorage, version-pinned, withdrawable from Privacy Policy) satisfy DPDP for soft-launch scale? At what point do we need to upgrade to DB-backed consent (so consent is portable across devices)?

### Mental-health-specific items

- **Crisis disclaimer enforceability** — Terms top-of-page callout names four helplines. If a user has a serious crisis after a session, is this disclaimer sufficient to limit Mindset's liability under Indian consumer-protection law? Are there additional steps (e.g. mandatory crisis-screening question on signup) that strengthen the position?
- **Therapist independence vs. platform liability** — Terms §2 says "Therapists… are independently qualified and registered. The clinical advice they give in sessions is theirs, not Mindset's." Confirm this allocation holds under Indian law for a platform that (a) matches the user to the therapist, (b) sets the price, (c) processes payment. Risk: courts may pierce the "platform-only" framing if Mindset is functionally an employer/agent.
- **Recording rules** — DPDP requires explicit consent for recording. Terms §4 prohibits recording by either party "without written consent". Sessions run via Google Meet. If a therapist *wants* to record (e.g. for case-conference / supervision review), what is the required consent flow under DPDP? Does our current "written consent" wording satisfy it, or do we need a specific recording-consent screen?
- **Telemedicine Practice Guidelines (2020)** — these BoG-MCI/MoHFW guidelines apply to RMPs (registered medical practitioners). Most Mindset therapists are RCI-registered counsellors/psychologists, not RMPs — but psychiatrists on the platform would be RMPs. Confirm whether any of these guidelines bind our platform-level conduct.

### Commercial / tax items

- **GST registration threshold** — when does Mindset cross the GST threshold (₹20L turnover for services in most states; ₹10L for special-category states)? Are we collecting + displaying GST correctly on invoices today?
- **Razorpay merchant agreement** — confirm KYC docs match the legal entity named in Privacy §1.
- **Limitation of liability cap** (Terms §12 — fees paid in trailing 3 months) — is this enforceable under the Consumer Protection Act 2019? Some courts hold consumer-favouring caps cannot exclude liability for service deficiency.
- **Force majeure** — Terms does **not** have an explicit force majeure clause. Should we add one (e.g. for therapist no-shows due to internet outage, regional disasters)?

### Other gaps

- **Children under 13** — Privacy §9 + Terms §1 say "not intended for children under 13." DPDP children = under 18. Confirm whether the "under 13 prohibited" language is meaningful or whether it should be removed/recast.
- **Data Protection Officer (DPO)** — Privacy Policy does not name a DPO. At soft-launch scale we likely don't need one, but confirm the trigger.
- **Breach notification** — Privacy §10 commits to notifying users + DPB "where the law requires." DPDP Rules require a specific format and timeline (currently 72 hours under the draft Rules); confirm our wording covers us once Rules are notified.
- **Marketing consent** — Privacy §7 mentions "marketing consent records: until you opt out" but the platform does not currently have a marketing-email opt-in flow. Confirm whether transactional-only correspondence is safe to send without a separate marketing opt-in.

---

## 3. Key questions for the lawyer

Prioritised. Bring the printouts in §4 to the consult.

### Priority 1 — Blockers

1. Given Mindset is operating as **[legal entity TBD]**, what is the correct way to identify the Data Fiduciary in Privacy §1 and the governing-law jurisdiction in Terms §14?
2. Who can serve as Grievance Officer (Privacy §13)? Can it be Suryansh or Muskan personally, or do we need a third party?
3. Is our current Privacy Policy DPDP-compliant for soft launch (10–20 invited users on `mindset.org.in`)? Specifically — what changes are required *before* the first paying user and what can wait until public launch?
4. Crisis disclaimer (Terms top callout) — is the current wording sufficient to limit liability if a user has a mental-health crisis during or after a session? What strengthens it?

### Priority 2 — DPDP shape

5. At what user count or revenue does Mindset cross into Significant Data Fiduciary obligations? Any currently-notified threshold?
6. Cross-border data transfer disclosures (Vercel hosting, Neon database, Resend email, Cloudinary, OpenRouter) — are §6's disclosures adequate, or do we need partner-specific transfer impact assessments?
7. Mental health data retention — does "3 years from last interaction" align with RCI's actual record-keeping requirement for psychologists/counsellors, and does that override the user's erasure right?
8. Children — is "verifiable parental consent" required by a specific mechanism (e.g. signed digital declaration, OTP to parent's phone), or is process-level documentation enough?
9. Does the cookie banner we shipped in Sprint Launch-Prep (`src/components/legal/cookie-banner.tsx`) satisfy DPDP cookie consent at our soft-launch scale? When must we upgrade to DB-backed consent?

### Priority 3 — Commercial / tax / liability

10. GST — at what threshold does Mindset need to register, and is current invoicing compliant?
11. Therapist independence (Terms §2) — does the legal allocation of clinical liability to the therapist hold under Indian consumer-protection law given Mindset's payment/match role?
12. Limitation of liability (Terms §12) — is the 3-month-fees cap enforceable, or should we expect courts to disregard it?
13. Recording rules (Terms §4) — under DPDP, what consent flow does a therapist need to record a session (for supervision / case-conference)? Does generic "written consent" suffice?

### Priority 4 — Smaller items (raise if time permits)

14. Force majeure — recommended wording for therapist no-shows due to internet/health outage?
15. Telemedicine Practice Guidelines (2020) — does any portion bind us at the platform level?
16. Marketing consent — can transactional emails alone proceed without a separate marketing opt-in?
17. Breach notification SLA — what timeline + format does DPDP Rules currently require?

---

## 4. Documents to bring to the consult

- **Printout: current Privacy Policy** — easiest: print `https://mindset-ten.vercel.app/privacy-policy` (or whichever URL the soft launch lives on at consult-time).
- **Printout: current Terms of Use** — same as above for `/terms-of-use`.
- **Printout: current Cookie Policy** — same for `/cookies`.
- **Cookie banner screenshots** — capture the banner (first-visit), the Customize modal (both empty + with toggles flipped), and the Privacy §11 "Update cookie preferences" button.
- **`docs/refund-policy-audit.md`** — Sprint Launch-Prep Task 3 output. Names the inconsistencies and the canonical policy draft awaiting ratification.
- **This document.**
- **Mindset's incorporation/registration document** (whichever entity Razorpay KYC was submitted under).
- **List of third-party vendors with data access** — Razorpay, Shiprocket, Resend, Cloudinary, Google (Calendar + reCAPTCHA), OpenRouter, Vercel (hosting), Neon (database).

---

## 5. Suggested lawyers / firms

**Important:** Suryansh — verify each independently before contacting. These are well-known names in the Indian tech/privacy/health-tech legal space, not personal recommendations. Pricing varies dramatically across the list.

- **Ikigai Law** (Delhi / Bengaluru) — tech, privacy, healthtech specialism. Reasonably accessible to early-stage companies.
- **Spice Route Legal** (Bengaluru) — privacy + tech regulatory; works with venture-backed startups.
- **TechLegis** (Delhi) — DPDP-focused boutique; cost-effective for narrow scopes.
- **Nishith Desai Associates** (Mumbai / Bengaluru) — sophisticated privacy practice with healthcare experience; premium pricing.
- **Trilegal** (Bengaluru) — broad commercial firm with growing privacy practice.
- **Alternative — NGO network** — Muskan may have legal contacts through her existing NGO operations; a pro bono / discounted consult is plausible at this stage.

### Likely scope for first consult

Two-hour paid consult to (a) review Privacy Policy + Terms + Cookie Policy against DPDP, (b) draft fixes for the blockers in §2, (c) confirm soft-launch is safe to proceed with those fixes. Estimated cost range: ₹15,000 – ₹50,000 depending on firm (smaller boutiques on the low end, top-tier on the high end).

---

## 6. After the consult — checklist for the follow-up sprint

- [ ] Fill bracketed placeholders in `privacy-policy/page.tsx` (entity name, registered address, Grievance Officer name + email).
- [ ] Fill bracketed placeholder in `terms-of-use/page.tsx` §14 (jurisdiction).
- [ ] Apply lawyer's required changes to Privacy / Terms / Cookie Policy.
- [ ] Decide on automated-vs-manual refunds (`docs/refund-policy-audit.md` §C1) and rewrite `refund-policy/page.tsx` accordingly.
- [ ] If lawyer flags it: add explicit recording-consent flow to the booking UI.
- [ ] If lawyer flags it: add a marketing-email opt-in to user signup, even if not used yet.
- [ ] Update the effective date at the top of each legal page.
- [ ] Email all soft-launch users a notice of the policy update (DPDP "material change" notification).
