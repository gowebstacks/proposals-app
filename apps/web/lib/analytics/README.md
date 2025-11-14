# Analytics Setup

This directory contains analytics integrations for the proposals-app, including Google Tag Manager (GTM), PostHog, and Segment.

## Components

### SegmentScript
Loads and initializes Segment Analytics for tracking user behavior and events.

### PostHogScript
Integrates PostHog for product analytics and session recording. Automatically connects with Segment when available.

### GTMScript
Loads Google Tag Manager for managing marketing tags and tracking pixels.

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Analytics Configuration
NEXT_PUBLIC_SEGMENT_API_KEY=your-segment-write-key
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-project-key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

## Usage

The analytics scripts are automatically loaded in the root layout (`app/layout.tsx`). No additional setup is required.

### Tracking Events

Use the utility functions in `utils/segment.ts`:

```typescript
import { trackEvent, identifyUser, trackFormSubmission } from '@/utils/segment';

// Track a custom event
trackEvent('Button Clicked', {
  buttonName: 'Download Proposal',
  proposalId: '123',
});

// Identify a user
identifyUser('user@example.com', {
  firstName: 'John',
  lastName: 'Doe',
  company: 'Acme Inc',
});

// Track form submission with automatic identify and group calls
trackFormSubmission({
  formId: 'contact-form',
  formFields: [
    { name: 'email', value: 'user@example.com' },
    { name: 'firstName', value: 'John' },
    { name: 'company', value: 'Acme Inc' },
  ],
  eventName: 'Form Submitted',
});
```

## Integration Details

- **Segment** is loaded first and serves as the primary analytics hub
- **PostHog** connects to Segment for unified tracking and session recording
- **GTM** loads independently for tag management
- All scripts use `afterInteractive` strategy for optimal performance
- Page views are automatically tracked on route changes

## Notes

- The `types.ts` file extends the Window interface for TypeScript support
- Analytics scripts only load in the browser (client-side)
- PostHog is configured to mask password inputs by default
- Segment automatically tracks page views on navigation
