# Agent Directive: KTU Activity Points Management System

## System Role & Overview
You are an expert Full-Stack Next.js Developer building a web application for tracking and managing KTU (APJ Abdul Kalam Technological University) 2024 Scheme Student Activity Points[cite: 1, 2].

The system serves two distinct roles:
1. **Student (User):** Tracks point progress across 3 distinct activity groups, submits certificate evidence, and monitors approval statuses[cite: 5, 21].
2. **Admin (Senior Faculty Advisor / Faculty):** Reviews, authenticates, approves/rejects certificate submissions, and manages student records[cite: 5, 21].

---

## Technical Stack Architecture

- **Framework:** Next.js 14+ (App Router, Server Actions, React Server Components)
- **Language:** TypeScript
- **Styling & UI:** Tailwind CSS, Shadcn UI, Lucide Icons, Recharts (for analytics/progress bars)
- **Database & ORM:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js / Auth.js (Credentials Provider with Role-Based Access Control: `STUDENT`, `ADMIN`)
- **Storage:** Supabase Storage / Uploadthing / Local Storage for PDF and Image certificate uploads

---

## Domain Rules & KTU 2024 Guidelines Enforcement

The application must enforce these rules strictly from the KTU 2024 Scheme Handbook:

1. **Target Requirements by Student Category[cite: 5]:**
   - **Regular:** Minimum 120 Total Points (Minimum 40 points in Group I, Group II, Group III)[cite: 5].
   - **Lateral Entry:** Minimum 90 Total Points (Minimum 30 points per group)[cite: 5].
   - **PwD (Persons with Disabilities):** Minimum 60 Total Points (Minimum 20 points per group)[cite: 5].

2. **Activity Group Distribution:**
   - **Group I:** Sports, Arts & Cultural Activities, Community Outreach (NSS, NCC, Blood Donation, Emergency Training, Swimming, Driving License)[cite: 6, 7, 8, 9].
   - **Group II:** Technical Events, Tech-Fests, Paper/Poster Presentations, Leadership Roles, FOSS, Standardized Tests (TOEFL, IELTS, GRE, GATE, CAT)[cite: 10, 11, 12, 13, 14].
   - **Group III:** Industry Exposure, Internships, Startups, Patents, Hackathons, Approved Skilling Courses (SWAYAM/NPTEL)[cite: 15, 16, 17, 18, 19].

3. **Sub-Category Limits & Rules:**
   - Enforce sub-category maximum point caps (e.g., Four-wheeler license max 5 pts[cite: 6]; Blood donation max 10 pts[cite: 7]; College Magazine publication max 20 pts[cite: 6]).
   - **Participation vs. Winner Rule:** Participation and winning points cannot be combined for the same event; only the highest achievement level applies[cite: 20].

---

## Database Schema Design (`prisma/schema.prisma`)

Implement models for:
- `User`: `id`, `name`, `email`, `password`, `role` (`STUDENT` | `ADMIN`), `registerNo`, `branch`, `studentType` (`REGULAR`, `LATERAL_ENTRY`, `PWD`), `createdAt`.
- `Category`: `id`, `group` (`GROUP_1`, `GROUP_2`, `GROUP_3`), `title`, `maxPointsCap`.
- `ActivityHead`: `id`, `categoryId`, `title`, `pointsConfig` (JSON storing levels like College, Zonal, State, National, International)[cite: 6, 10].
- `Submission`: `id`, `studentId`, `activityHeadId`, `group` (`GROUP_1`, `GROUP_2`, `GROUP_3`), `certificateUrl`, `level`, `claimedPoints`, `approvedPoints`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `adminRemarks`, `submittedAt`, `reviewedAt`.

---

## Detailed Page Structures & Features

### 1. Auth & Onboarding (`/login`, `/register`)
- Role assignment during registration or admin invitation.
- Profile setup allowing students to select their student type (`REGULAR`, `LATERAL_ENTRY`, `PWD`) to automatically set their point goals[cite: 5].

### 2. Student Dashboard (`/dashboard`)
- **Target Progress Section:**
  - Radial or bar progress charts using Recharts displaying current points vs target (e.g., `85 / 120 Points`).
  - Breakdown meters for Group I, Group II, and Group III with min-threshold indicators (e.g., Group I: `35/40`, Group II: `40/40`, Group III: `10/40`)[cite: 5].
- **Certificate Upload Modal/Form:**
  - Category / Sub-Activity selection cascade.
  - Event level dropdown (College, Zonal, State, National, International)[cite: 6, 10].
  - File upload component supporting `.pdf`, `.png`, `.jpg` (Max 5MB).
  - Calculated point estimation indicator before submitting.
- **My Submissions Table:**
  - Status filters (`All`, `Pending`, `Approved`, `Rejected`).
  - View certificate preview, claim details, and admin feedback/remarks.

### 3. Admin Dashboard (`/admin/dashboard`)
- **Review Queue:**
  - Table of pending submissions sorted by date.
  - Quick action to open Review Modal.
- **Review Modal:**
  - Split view: Certificate PDF/Image viewer on the left, submission metadata and approval form on the right.
  - Actions: **Approve** (with option to adjust points) or **Reject** (with mandatory reason/remark field).
- **Student Analytics & Export:**
  - Overview list of all students with overall point completion indicators.
  - Export feature to generate PDF summary files per student for SFA authentication[cite: 5, 21].

---

## Coding Guidelines & Implementation Rules

1. Use Next.js **App Router** server actions for database mutations (`approveSubmission`, `rejectSubmission`, `createSubmission`).
2. Implement **middleware protection** to restrict `/admin/*` routes to users with `ADMIN` role.
3. Include a database seed script (`prisma/seed.ts`) pre-populated with all KTU Activity Categories and point structures based on Table 2 of the 2024 Scheme Handbook[cite: 6, 10, 15].
4. Ensure full responsive design using Tailwind CSS. Use clean, modern Shadcn UI primitives (`Table`, `Dialog`, `Form`, `Select`, `Card`, `Badge`, `Progress`).
