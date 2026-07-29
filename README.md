# Awam Dost Party Website

Modern Next.js prototype for a Pakistani political party website with:

- public news, blogs, announcements, leadership profiles, media, and activities
- separate public pages for news, blogs, announcements, leadership, and media
- announcement popup on fresh website visits
- a public page-turning reader for `Political Pragmatism in Pakistan`
- online digital membership applications, affidavit confirmation, card generation, and download
- Postgres-backed membership records with CNIC and applicant contact details
- JWT-style protected admin dashboard for content uploads, book PDF updates, membership records, and CSV export

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Public pages:

- `http://localhost:3000/news`
- `http://localhost:3000/blogs`
- `http://localhost:3000/announcements`
- `http://localhost:3000/leadership`
- `http://localhost:3000/media`
- `http://localhost:3000/book`

The book reader loads its page text and PDF download URL from Postgres. Upload
or update the public PDF from the admin dashboard.

## Postgres Setup

Create a database and set `DATABASE_URL` in `.env.local`.

```bash
createdb awam_dost_party
psql "$DATABASE_URL" -f database/schema.sql
npm run db:seed
```

The `memberships` table stores private membership application submissions,
including CNIC, address, affidavit confirmations, and contact details. The
`content_entries` table is ready for news, blogs, announcements, leadership
profiles, audio, video reels, and party activities.

`npm run db:seed` adds repeatable demo content, member registrations, and book
metadata so the admin dashboard is populated during local development.

## Admin Dashboard

Set `ADMIN_SESSION_SECRET` in `.env.local` to a long random value. Then create
or update the first admin user:

```bash
npm run admin:create
```

Default local admin credentials:

- Username: `admin@awamdost.party`
- Password: `AwamDost@2026!`

Open `http://localhost:3000/admin/login`. After login, the admin can add news,
blogs, announcements, leadership profiles, audio, video reels, party activities,
upload media files, update the public book PDF download, view registration form
data, and download membership records as CSV.

`ADMIN_EXPORT_TOKEN` is still supported for server-to-server CSV export:

```bash
curl -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN" \
  http://localhost:3000/api/admin/memberships/export \
  -o adp-memberships.csv
```

Do not publish admin credentials, the session secret, or the export token.
Public visitors do not need login to read the book or browse public content.

## Checks

```bash
npm run lint
npm run build
```
