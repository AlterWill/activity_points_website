# KTU Activity Points Management System

Next.js application for the **APJ Abdul Kalam Technological University 2024 Scheme** activity points workflow.

- Students submit certificate evidence against the official activity catalog.
- Faculty advisors review each certificate, adjust points, approve or reject it with remarks.
- Progress is calculated against 2024 Scheme targets: Regular 120/40, Lateral Entry 90/30, PwD 60/20.

## Tech stack

Next.js 16 App Router, TypeScript, Tailwind CSS 4, Neon Postgres, Prisma, Neon Object Storage, bcrypt, JWT session cookies, Lucide icons.

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Link Neon and provision Postgres plus the object-storage bucket:

   ```bash
   npx neon@latest login
   npx neon@latest init
   npx neon@latest deploy
   ```

   For an existing Neon project, link it first. `neon deploy` applies `neon.ts`, creates the private `assets` bucket, and writes the database and standard `AWS_*` variables into `.env`. Alternatively, copy `.env.example` to `.env` and fill in the values manually.

3. Create the database tables:

   ```bash
   pnpm db:push
   ```

   `DATABASE_URL` is the pooled runtime URL. Prisma uses `DATABASE_URL_UNPOOLED` for direct migration access.

4. Seed the KTU activity catalog and accounts:

   ```bash
   pnpm db:seed
   ```

5. Start the app:

   ```bash
   pnpm dev
   ```

Open http://localhost:3000.

### Development accounts

The seed creates these only when `NODE_ENV` is not `production`:

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@ktu.edu` | `student123` |
| Faculty advisor | `admin@ktu.edu` | `admin123` |

In production, run the seed with `NODE_ENV=production` and a strong `SEED_ADMIN_PASSWORD`; the demo student is skipped. Change all seeded passwords before handling real student data.

```bash
NODE_ENV=production SEED_ADMIN_PASSWORD='a-strong-password' pnpm db:seed
```

To rotate a seeded password, set the new value and opt in to resetting existing accounts:

```bash
SEED_ADMIN_PASSWORD='a-strong-new-password' SEED_RESET_PASSWORDS=true pnpm db:seed
```

Without `SEED_RESET_PASSWORDS=true`, re-seeding the catalog leaves existing passwords untouched.

## Editing activity points

`lib/ktu-rules.ts` is the single source of truth for the catalog.

1. Edit or add an activity.
2. Keep the activity `code` unique and stable. The seed uses codes to update existing rows instead of creating duplicates.
3. Use one point mode per activity: `levelPoints`, `options`, `fixedPoints`, or `hourlyRate`.
4. Run `pnpm db:seed` again. Re-seeding is safe and preserves submissions.

Activities that are removed from the file are marked inactive instead of deleted. Historical submissions remain intact.

## Security notes

- Public registration always creates a `STUDENT`. Admin accounts are seeded or provisioned manually.
- Passwords are hashed with bcrypt. Sessions use signed, HTTP-only, same-site cookies.
- Proxied route protection plus database role checks on every protected page and server action.
- The server recalculates claimed points from the activity configuration. Client-provided points, groups, and levels are never trusted.
- Certificates are limited to 5 MB for PDF and 2 MB for PNG/JPG, then validated by magic bytes. They are stored privately in Neon Object Storage in production, with local disk as a development fallback. PDFs are gzip-compressed on the server and transparently decompressed on download. Certificates are served only to the owning student or an admin through an authenticated route.
- Prisma parameterises all database queries, which prevents SQL injection.
- Approvals are transactional and guarded against double-review and per-activity point caps.
- Serve the app over HTTPS in production and put the login endpoint behind a reverse-proxy rate limit. The session cookie is `Secure`, HTTP-only and same-site.

## Certificate storage

Neon Object Storage is the production certificate store. `neon.ts` declares a private `assets` bucket, and `neon deploy` injects these standard AWS variables:

```bash
AWS_ENDPOINT_URL_S3="..."
AWS_REGION="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

The app uses the AWS SDK with path-style addressing. It deliberately does not use Cloudflare R2's `S3_*` variable names or Vercel Blob.

Browser uploads receive a 15-minute presigned PUT URL, so the certificate goes directly to Neon and avoids Vercel's 4.5 MB Function request cap. On submission, the server checks the reservation, reads the object metadata, validates magic bytes, and enforces these limits:

- PDF: 5 MB.
- PNG/JPG: 2 MB after browser-side compression. Source images may be up to 15 MB; images larger than 1.5 MB are resized and re-encoded to JPEG before upload.

PDFs are gzip-compressed server-side before final storage. The database records `certificateEncoding = GZIP` and the compressed size. Authenticated downloads receive a presigned GET with `ResponseContentEncoding: gzip`, so the browser decompresses the original PDF transparently. If gzip does not make the file smaller, the original bytes and `IDENTITY` encoding are kept.

To prevent a successful-looking upload from exceeding the store quota, the app tracks stored certificate sizes in `Submission.certificateSize`, plus active 15-minute `CertificateUpload` reservations created before each presigned upload. Set `CERTIFICATE_STORAGE_LIMIT_MB` to override the defaults: 9000 MB for Neon and 900 MB for local disk. The upload modal shows usage and warns at 90%.

Outside Vercel with no `AWS_*` values, the app uses `storage/certificates/` on local disk. On Vercel, missing Neon object-storage values disable uploads with an explicit error instead of silently writing to ephemeral disk.

If you use a custom S3-compatible endpoint instead of Neon, keep the bucket private and allow `PUT`, `GET`, and `HEAD` with the `Content-Type` header from your app origins. The presigned PUT signs `Content-Type`, so the browser must send the same value the server signed.

## Deploying to Vercel

1. Link the Neon project and provision Postgres plus the object-storage bucket:

   ```bash
   npx neon@latest login
   npx neon@latest init
   npx neon@latest deploy
   ```

   For an existing Neon project, link it first. `neon deploy` writes the pooled/direct database URLs and `AWS_*` storage variables into `.env` locally. Add the same variables to the Vercel project. Use `DATABASE_URL` (pooled) at runtime and `DATABASE_URL_UNPOOLED` for Prisma CLI commands.

2. Apply the schema and seed the production catalog and admin account:

   ```bash
   pnpm db:push
   NODE_ENV=production SEED_ADMIN_PASSWORD='a-strong-password' pnpm db:seed
   ```

3. Set `NEXTAUTH_SECRET` to a random value of at least 32 characters. Optionally set `CERTIFICATE_STORAGE_LIMIT_MB` below your Neon storage capacity.

4. Deploy. Uploads use presigned URLs, so PDF certificates can be 5 MB without passing through a Vercel Function. PDFs are compressed server-side; PNG/JPG certificates are capped at 2 MB.

## Useful commands

```bash
pnpm dev          # development server
pnpm build        # production build
pnpm typecheck    # TypeScript check
pnpm lint         # ESLint
pnpm db:push      # apply the Prisma schema
pnpm db:seed      # seed/refresh the activity catalog and accounts
pnpm db:studio    # open Prisma Studio
```

## Project structure

```
app/
  actions/                 server actions for auth, submissions, reviews
  api/certificates/        authenticated certificate download
  admin/dashboard/         review queue + student roster
  admin/students/[id]/     printable per-student report
  dashboard/               student progress + certificate upload
  login/ register/         authentication pages
lib/
  auth.ts / jwt.ts         session helpers
  certificates.ts          private upload storage + validation
  certificate-format.ts    certificate extension/MIME helpers
  neon-storage.ts          Neon object-storage presigned upload/download helpers
  image-compression.ts     browser-side image optimization
  storage.ts               certificate quota, limits, and warnings
  ktu-rules.ts             editable KTU 2024 activity catalog
  points.ts                server/client point calculation rules
  prisma.ts / queries.ts   database access and DTO mapping
prisma/
  schema.prisma            database models
  seed.ts                  idempotent catalog + account seed
neon.ts                    Neon Postgres/object-storage policy
```

## Verification

Run the local checks before deploying:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Certificate uploads require working Neon object-storage credentials. The app will not fall back to ephemeral disk on Vercel.
