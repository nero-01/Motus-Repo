# Data Safety Mapping (Issue 18)

Use this file to complete Play Console Data Safety and App Store privacy labels consistently.

## Data Collected

### Account Data
- Email address
- Authentication identifiers (user id)

Purpose:
- Account creation, login, and security

### User Content / Family Data
- Family name/description
- Child profile details (name, age, related profile fields)
- Routine/reminder/task inputs
- Worksheet/activity progress entries

Purpose:
- Core app functionality
- Family organization and progress tracking

### Diagnostic / Operational Data
- Basic error logging in development workflows (where enabled)

Purpose:
- App quality and troubleshooting

## Data Sharing

Current expected position (verify before submission):
- Data is **not sold**.
- Data is **not shared with third parties for advertising**.
- Data is processed to provide app functionality and account services.

## Security Practices

- Authentication handled via Supabase auth.
- Access controls rely on backend row-level policies and user scoping.
- Transport security provided over HTTPS endpoints.

## Required Verification Before Submission

- [ ] Confirm all listed data points reflect current production behavior.
- [ ] Confirm no hidden analytics/ad SDK introduces extra collection categories.
- [ ] Confirm privacy policy URL is live and matches these declarations.
- [ ] Confirm support contact is active for data/privacy requests.

## Links

- Privacy policy (app default): https://motustots.com/privacy
- In-app source of URL: `constants/support.ts`

