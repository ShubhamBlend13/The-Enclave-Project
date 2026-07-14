# The Enclave

A private villa and community management web application built for managing issues, announcements, upkeep schedules, and resident accounts across The Enclave.

The application is designed as an installable Progressive Web App (PWA) with role-based access and area-level data isolation.

## Overview

The Enclave consists of eight villas and a shared clubhouse:

- S1
- S2
- S3
- S4
- E1
- E2
- E3
- E4
- Clubhouse

The system follows a simple access model:

> **Area controls what data a user can access. Role controls what actions a user can perform.**

Residents and Villa Admins are limited to their assigned villa and the Clubhouse, while operational roles can access all areas.

## Features

### Authentication

- Private application with no public signup
- Phone number and password login for family users
- Employee ID and password login for upkeep staff
- Persistent authenticated sessions
- Forced password change after account creation or password reset
- Account activation and deactivation
- Role-based application access

### Issue Management

- Report issues for villas and shared areas
- Issue categories, location, description, and priority
- Open, In Progress, and Resolved statuses
- Issue status timeline
- Operational updates
- Area-based issue filtering
- Persistent Supabase-backed issue data

### Community Announcements

- Villa Admins can publish announcements
- Villa-specific announcements
- Clubhouse announcements
- Residents see announcements for accessible areas
- Owner Admin has read-only community access
- Upkeep Managers cannot access Community

### Upkeep Management

- Create upkeep schedules
- Edit existing schedules
- Weekly, monthly, quarterly, half-yearly, and yearly frequencies
- Track the next due date
- Complete upkeep tasks with notes
- Automatic next-due-date calculation
- Completion history
- Database and frontend protection against saving past due dates
- Residents and Villa Admins have read-only upkeep access

### Account Management

#### Owner Admin

Can:

- Create Villa Admin accounts
- Create Upkeep Manager accounts
- Reset managed account passwords
- Activate or deactivate managed accounts
- View resident profiles

#### Villa Admin

Can:

- View residents from their own villa
- Create resident accounts for their villa
- Reset resident passwords
- Activate or deactivate resident accounts

#### Residents

Can:

- Access their own villa and the Clubhouse
- Report and view issues
- Read announcements
- View upkeep schedules

#### Upkeep Manager

Can:

- Access all villas and the Clubhouse
- View and manage issues
- Resolve and reopen issues
- Create and edit upkeep schedules
- Complete upkeep tasks
- View upkeep history

The Upkeep Manager does not have access to Community announcements.

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS / inline component styling
- Vite PWA Plugin
- Workbox

### Backend

- Supabase Auth
- PostgreSQL
- Row Level Security
- PostgreSQL functions and triggers
- Supabase Edge Functions

### Deployment

- Cloudflare Pages
- GitHub-based deployment workflow

## Architecture

```text
React PWA
   |
   | Supabase JavaScript Client
   |
   +------------------------------+
   |                              |
Supabase Auth                Supabase Data API
   |                              |
User Sessions                 PostgreSQL
                                  |
                           Row Level Security
                                  |
                    Issues / Announcements / Upkeep
                                  |
                         PostgreSQL Functions
                                  |
                     Atomic workflow operations

React
   |
   | Authenticated request
   |
Supabase Edge Function
   |
manage-user
   |
Supabase Admin API
   |
Create / Reset / Manage Users
```

Privileged user-management operations are not executed directly from the browser.

The `manage-user` Supabase Edge Function validates the authenticated user's session and application role before using server-side administrative Auth APIs.

## Database Tables

The application currently uses the following tables:

### `areas`

Stores villas and common areas.

### `profiles`

Stores application-specific user information including:

- Full name
- Phone number
- Employee ID
- Role
- Assigned home villa
- Account status
- Forced password-change status

### `issues`

Stores reported issues.

### `issue_updates`

Stores issue timeline and status updates.

### `announcements`

Stores villa and Clubhouse announcements.

### `upkeep_tasks`

Stores upkeep schedules and next due dates.

### `upkeep_history`

Stores upkeep task completion records.

## Security

Security is enforced at the database and server level rather than relying only on hidden frontend controls.

### Row Level Security

All application tables use PostgreSQL Row Level Security.

Examples:

- Residents can access only their villa and common areas
- Villa Admins can view only residents from their own villa
- Upkeep Managers can access operational data across all areas
- Upkeep Managers cannot query announcements
- Only operational roles can update issue statuses
- Only Villa Admins can create announcements
- Only Owner Admins and Upkeep Managers can manage upkeep schedules

### Edge Function Security

User creation, password resets, and account activation changes are handled by:

```text
supabase/functions/manage-user
```

The browser never receives a Supabase secret or service-role key.

The Edge Function:

1. Requires an authenticated request
2. Validates the Supabase Auth access token
3. Loads the caller's application profile
4. Checks the caller's role and account status
5. Validates the target account
6. Performs the requested privileged action

## Project Structure

```text
The-Enclave-Project/
├── public/
│   ├── favicon.svg
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── maskable-icon-512x512.png
│
├── scripts/
│   └── bootstrap-owner.mjs
│
├── src/
│   ├── components/
│   ├── constants/
│   ├── contexts/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   ├── RootApp.jsx
│   └── main.jsx
│
├── supabase/
│   ├── functions/
│   │   └── manage-user/
│   ├── migrations/
│   └── config.toml
│
├── index.html
├── vite.config.js
└── package.json
```

## Local Development

### Requirements

- Node.js 22 or later
- npm
- Git

Supabase CLI and Deno are recommended for database and Edge Function development.

### Install dependencies

```bash
npm install
```

### Environment variables

Create:

```text
.env.local
```

Add:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Do not place a Supabase secret key or service-role key in the frontend environment file.

### Start the development server

```bash
npm run dev
```

### Run ESLint

```bash
npm run lint
```

### Create a production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Database Migrations

The project uses Supabase migrations stored in:

```text
supabase/migrations/
```

Check migration status:

```bash
npx supabase migration list
```

Preview pending migrations:

```bash
npx supabase db push --dry-run
```

Apply migrations:

```bash
npx supabase db push
```

Do not modify an already-applied migration to introduce a new database change.

Create a new migration instead:

```bash
npx supabase migration new migration_name
```

## Edge Function

The protected user-management function is located at:

```text
supabase/functions/manage-user/index.ts
```

Validate the Deno function:

```bash
deno check --config supabase/functions/manage-user/deno.json supabase/functions/manage-user/index.ts
```

Deploy:

```bash
npx supabase functions deploy manage-user --no-verify-jwt
```

The function performs its own access-token validation and role authorization before privileged actions.

## PWA

The Enclave is configured as an installable Progressive Web App.

The production build generates:

- Web app manifest
- Service worker
- Workbox cache
- PWA icons

The PWA caches the application shell and static assets.

Supabase authentication and application data still require an internet connection. Offline data synchronization is not currently implemented.

To test the PWA locally:

```bash
npm run build
npm run preview
```

Open the preview URL in Chrome and inspect:

```text
DevTools
→ Application
→ Manifest
```

and:

```text
DevTools
→ Application
→ Service Workers
```

## Deployment

The application is intended to be deployed using Cloudflare Pages with Git integration.

Recommended build configuration:

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
```

Required environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Never configure the Supabase service-role key as a frontend or Cloudflare Pages build variable.

## Current Prototype Status

Implemented:

- Authentication
- Role-based access
- Area-based access
- Owner Admin
- Villa Admin
- Resident
- Upkeep Manager
- Forced password changes
- Account activation and deactivation
- Issue reporting
- Issue timelines and status management
- Community announcements
- Account management
- Upkeep scheduling
- Upkeep completion history
- Due-date validation
- Row Level Security
- Protected user-management Edge Function
- Installable PWA

Remaining operational work:

- Production Cloudflare Pages deployment
- Final live role and RLS QA
- Client deployment and handover checks

## Future Improvements

Potential future additions include:

- Push notifications
- Issue image uploads
- Announcement attachments
- Offline data synchronization
- Audit log dashboard
- Custom domain
- Branded production application icons
- Advanced upkeep reminders and escalation workflows

## Ownership

The application is structured so that production infrastructure can remain client-owned:

```text
GitHub repository
→ Client ownership

Supabase project
→ Client ownership

Cloudflare Pages
→ Client ownership
```

Development and deployment access can be provided to collaborators without transferring ownership of the production infrastructure.

---

Built for **The Enclave**.