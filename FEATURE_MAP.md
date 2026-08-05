# IMSSA Media Platform — Role-by-Role Feature Map

> **Legend:**
> - `Page` = Next.js route file
> - `Component` = React component
> - `Script` = Backend/infra script

---

## 🔐 Authentication — All Roles

| Feature | File Path |
|---|---|
| Passkey login (4-digit code) | `apps/web/app/login/page.tsx` → `src/components/auth/LoginForm.tsx` |
| Session management & auto-redirect by role | `src/components/auth/AuthGuard.tsx` |
| Role-based route protection (Access Denied page) | `src/components/auth/AuthGuard.tsx` |
| Sidebar navigation (shows only allowed links per role) | `src/components/auth/AuthGuard.tsx` (ROLE_ROUTES map) |
| Notification bell in top navbar | `src/components/auth/AuthGuard.tsx` (header section) |
| Global Chat Widget (WhatsApp-style, all dashboards) | `src/components/chat/GlobalChatWidget.tsx` |
| Calendar (read access for all roles) | `apps/web/app/calendar/page.tsx` → `src/components/workspace/CalendarWorkspace.tsx` |
| User profile view | `apps/web/app/profile/page.tsx` → `src/components/profile/UserProfile.tsx` |
| Sign out | `src/components/auth/AuthGuard.tsx` (header section) |

---

## 👑 Chief Coordinator

> **Allowed Routes:** `/analytics`, `/calendar`
> **Database Roles:** `CHIEF_COORDINATOR`

| Feature | File Path |
|---|---|
| Analytics dashboard (task progress, workload charts) | `apps/web/app/analytics/page.tsx` → `src/components/workspace/ChiefCoordinatorWorkspace.tsx` |
| Team overview (all members and roles) | `src/components/workspace/ChiefCoordinatorWorkspace.tsx` |
| Calendar — event timelines & deadlines | `apps/web/app/calendar/page.tsx` → `src/components/workspace/CalendarWorkspace.tsx` |
| Global Chat | `src/components/chat/GlobalChatWidget.tsx` |
| Notification bell | `src/components/auth/AuthGuard.tsx` |

---

## 📣 Marketing Coordinator

> **Allowed Routes:** `/` (home), `/marketing-plan`, `/calendar`
> **Database Roles:** `MARKETING_COORDINATOR`

| Feature | File Path |
|---|---|
| Marketing home dashboard | `apps/web/app/page.tsx` → `src/components/workspace/MarketingWorkspace.tsx` |
| Marketing plans list | `apps/web/app/marketing-plan/page.tsx` → `src/components/workspace/MarketingPlanWorkspace.tsx` |
| Default filter by event (auto-loads own event's plan) | `src/components/workspace/MarketingPlanWorkspace.tsx` |
| Filter buttons — switch between HackX / HackX Jr. / Exposition | `src/components/workspace/MarketingPlanWorkspace.tsx` |
| View another event's full marketing plan | `src/components/workspace/MarketingPlanWorkspace.tsx` |
| Calendar — view deadlines | `apps/web/app/calendar/page.tsx` → `src/components/workspace/CalendarWorkspace.tsx` |
| Global Chat | `src/components/chat/GlobalChatWidget.tsx` |
| Notification bell | `src/components/auth/AuthGuard.tsx` |

---

## 🎨 Designer / Video Editor

> **Allowed Routes:** `/designer`, `/calendar`
> **Database Roles:** `DESIGNER`, `VIDEO_EDITOR`

| Feature | File Path |
|---|---|
| Designer workspace (full view) | `apps/web/app/designer/page.tsx` → `src/components/workspace/DesignerWorkspace.tsx` |
| Kanban board (To Do → In Progress → In Review → Done) | `src/components/kanban/KanbanBoard.tsx` |
| Task cards with real assignee initials (from DB) | `src/components/kanban/TaskCard.tsx` |
| Task detail dialog (view/edit task info) | `src/components/kanban/TaskDialog.tsx` |
| Per-task chat thread (message on a specific task) | `src/components/kanban/TaskChat.tsx` |
| Capacity panel (live workload of all designers/directors) | `src/components/workspace/CapacityPanel.tsx` |
| Designer packs access | `src/components/workspace/DesignerWorkspace.tsx` |
| Calendar | `apps/web/app/calendar/page.tsx` → `src/components/workspace/CalendarWorkspace.tsx` |
| Global Chat | `src/components/chat/GlobalChatWidget.tsx` |
| Notification bell | `src/components/auth/AuthGuard.tsx` |

---

## 🎬 Media Director

> **Allowed Routes:** `/director`, `/calendar`
> **Database Roles:** `MEDIA_DIRECTOR`

| Feature | File Path |
|---|---|
| Review Inbox / Director workspace | `apps/web/app/director/page.tsx` → `src/components/workspace/DirectorWorkspace.tsx` |
| Post approval dialog (approve / reject submitted work) | `src/components/workspace/PostApprovalDialog.tsx` |
| Review canvas (view submitted design work) | `src/components/workspace/ReviewCanvas.tsx` |
| Workflow stepper (track submission stages) | `src/components/layout/WorkflowStepper.tsx` |
| Capacity panel (view all designers' workloads) | `src/components/workspace/CapacityPanel.tsx` |
| Calendar | `apps/web/app/calendar/page.tsx` → `src/components/workspace/CalendarWorkspace.tsx` |
| Global Chat | `src/components/chat/GlobalChatWidget.tsx` |
| Notification bell | `src/components/auth/AuthGuard.tsx` |

---

## 🛡️ Admin

> **Allowed Routes:** `/admin`, `/admin/users`, + access to all routes
> **Database Roles:** `ADMIN`

| Feature | File Path |
|---|---|
| Admin dashboard | `apps/web/app/admin/page.tsx` → `src/components/workspace/AdminWorkspace.tsx` |
| View all users and roles | `apps/web/app/admin/users/page.tsx` |
| Add new user dialog (creates in Appwrite Auth + DB) | `src/components/workspace/AddUserDialog.tsx` |
| User requests list | `src/components/admin/UserRequestsList.tsx` |
| Bypass all route restrictions | `src/components/auth/AuthGuard.tsx` |

---

## 📡 API / Backend Layer — Used By All Roles

| Feature | File Path |
|---|---|
| Appwrite client setup (project, endpoint config) | `apps/web/src/lib/appwrite.ts` |
| Auth functions (login, logout, get session) | `apps/web/src/api/auth.ts` |
| All database API calls (tasks, users, plans, messages) | `apps/web/src/api/api-client.ts` |
| TanStack Query hooks (useTasks, useUsers, useMarketingPlans…) | `apps/web/src/api/queries.ts` |

---

## 🗄️ Database & Infrastructure Scripts

| Script | Purpose |
|---|---|
| `infra/appwrite/setup-schema.js` | Creates all Appwrite collections, attributes & indexes |
| `infra/appwrite/fix_permissions.js` | Sets correct read/write permissions on all collections |
| `infra/appwrite/ingest_users.js` | Creates all 20 real users in Appwrite Auth + users collection |
| `infra/appwrite/update_dulaj_roles.js` | Adds CHIEF_COORDINATOR role to Dulaj (dual role) |
| `infra/appwrite/ingest_tasks.js` | Inserts realistic tasks assigned to real designers from DB |
| `infra/appwrite/ingest_marketing_plans.js` | Inserts HackX & HackX Jr. marketing plan data |
| `infra/appwrite/ingest_hackx.js` | Inserts HackX event-specific records |
| `infra/appwrite/setup_designer_packs.js` | Inserts designer pack records |
| `infra/appwrite/setup_global_messages.js` | Initialises global chat message structure |
| `infra/appwrite/setup-functions.js` | Deploys Appwrite Cloud Functions (e.g. create-user) |
| `infra/appwrite/update_marketing_schema.js` | Updates marketing plan collection schema |
| `infra/appwrite/update_task_messages_schema.js` | Updates task messages collection schema |

---

## 🗺️ Route Summary

| Route | Role(s) | Component |
|---|---|---|
| `/login` | Everyone (public) | `LoginForm.tsx` |
| `/register` | Everyone (public) | `RegisterForm.tsx` |
| `/` | `MARKETING_COORDINATOR` | `MarketingWorkspace.tsx` |
| `/marketing-plan` | `MARKETING_COORDINATOR` | `MarketingPlanWorkspace.tsx` |
| `/designer` | `DESIGNER`, `VIDEO_EDITOR` | `DesignerWorkspace.tsx` |
| `/director` | `MEDIA_DIRECTOR` | `DirectorWorkspace.tsx` |
| `/analytics` | `CHIEF_COORDINATOR` | `ChiefCoordinatorWorkspace.tsx` |
| `/calendar` | All authenticated roles | `CalendarWorkspace.tsx` |
| `/admin` | `ADMIN` | `AdminWorkspace.tsx` |
| `/admin/users` | `ADMIN` | User list page |
| `/profile` | All authenticated roles | `UserProfile.tsx` |
