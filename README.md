# IMSSA Media Platform

Welcome to the **IMSSA Media Platform**! This is a centralized, role-based media evaluation and workflow management system designed specifically to streamline the marketing, design, and approval processes for IMSSA events (such as Exposition, HackX, Podcast Series, etc.).

## 🚀 Features

- **Role-Based Workspaces**: Customized dashboards for Marketing Coordinators, Designers, Media Directors, and Chief Coordinators.
- **Task Management (Kanban)**: Track tasks through states like `OPEN`, `IN_PROGRESS`, `IN_REVIEW`, and `COMPLETED`.
- **Media Review System**: Designers upload assets, Directors review them, request revisions, or approve them seamlessly.
- **Marketing Plan Tracker**: Maintain an integrated list of upcoming deliverables, platforms, and handover dates.
- **Calendar & Timelines**: Visual chronological views of all upcoming marketing plans and task deadlines.
- **Analytics Dashboard**: Real-time insights into designer workload, capacity, and on-time completion rates.
- **Global Chat & Annotations**: Built-in communication tools for discussing task specifics and global announcements.
- **Designer Packs (Checklists)**: Centrally managed database checklists to ensure brand guidelines are met before submission.

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management & Fetching**: React Query / React Hooks

### Backend (BaaS)
- **Platform**: [Appwrite](https://appwrite.io/) Cloud
- **Services Used**:
  - **Auth**: Passkey and Email session management.
  - **Databases**: Real-time document storage for tasks, users, marketing plans, chat, and designer packs.
  - **Storage**: Secure asset buckets for uploading images and videos (up to 5GB).

## 👥 Roles & Workflows

The platform heavily relies on strict Role-Based Access Control (RBAC). When you log in, your view changes based on your assigned role:

### 1. Marketing Coordinator
**Workspace:** Marketing (Kanban) & Marketing Plans
- **What to do:** You are the initiator. You create new tasks based on the marketing plans, assign them to designers, set deadlines, and monitor the overall progress of campaigns like *HackX* or *Exposition*.
- **Key Features:** Kanban Board, Campaign Filters, Calendar view.

### 2. Designer / Video Editor
**Workspace:** My Work
- **What to do:** You are the creator. You review assigned tasks, check off items on the IMSSA brand checklist (Designer Packs), and upload your draft images or videos for review. 
- **Key Features:** Drag-and-drop uploads, Revision Checklists, direct feedback from Directors.

### 3. Media Director
**Workspace:** Review Inbox
- **What to do:** You are the approver. You review submitted drafts from designers. If it looks good, you click **Approve**. If changes are needed, you add feedback and click **Request Revision**, which sends it back to the designer.
- **Key Features:** Media preview panes, Approval workflows, Feedback forms.

### 4. Chief Coordinator
**Workspace:** Analytics
- **What to do:** You are the overseer. You monitor the health of the entire media operation. You check how many tasks are active, whether deliverables are completed on time, and ensure no individual designer is over capacity.
- **Key Features:** High-level metrics, Designer Capacity Tables, aggregate task tracking.

### 5. Admin
**Workspace:** Admin Dashboard
- **What to do:** You manage the system infrastructure. You can add users, assign roles, change event affiliations, and handle system configurations.

## ⚙️ Getting Started (Local Development)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "IMSSA MEDIA EVALUATION"
   ```

2. **Install Dependencies:**
   Navigate into the Next.js app directory and install dependencies:
   ```bash
   cd apps/web
   npm install
   ```

3. **Environment Variables:**
   Ensure your `.env.local` file is populated with the correct Appwrite Cloud credentials:
   ```env
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=<your-project-id>
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=<your-db-id>
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗄️ Database Setup (Backend Scripts)
The `/infra/appwrite` folder contains all scripts necessary to recreate the database schemas, seed initial users, and set up permissions.
- run `node infra/appwrite/setup-schema.js` to initialize collections.
- run `node infra/appwrite/fix_permissions.js` to ensure proper access rights.
