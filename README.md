# JASIQ Labs Internship Readiness Audit
## Service Request Management System

Welcome to the JASIQ Labs Internship Readiness Audit. You are tasked with assessing, fixing, and extending a partially developed Service Request Management System (SRMS). 

This application is designed to allow organization users to raise support/service requests (e.g., VPN issues, hardware replacements) and administrators to review, assign, and update those requests.

---

## About the Assessment

This repository contains a deliberately incomplete and partially defective codebase (approximately 30% functional). The core infrastructure is established, but there are multiple technical, security, functional, and user experience gaps left for you to resolve.

Your responsibility is to:
1. **Explore & Analyze**: Understand the project structure, inspect the client and server code, and identify bugs, security vulnerabilities, and missing features.
2. **Implement**: Address the issues, secure the endpoints, complete the unfinished flows, and ensure the system behaves reliably.
3. **Test**: Write meaningful automated tests and document your manual test scenarios.
4. **Deploy**: Deploy both the client and server applications to hosting platforms.
5. **Document & Present**: Complete the submission template at the bottom of this README, document your findings, and prepare to defend your engineering decisions in a live demo.

> [!IMPORTANT]
> **AI tools, documentation, and online resources are allowed and encouraged.** However, you must fully understand every line of code you submit, be able to explain how your fixes work, and defend your architectural choices during your presentation.

---

## Existing Working Functionality

The following scenarios are verified to work out-of-the-box:
1. **User Login**: A seeded user can open the login screen, enter their credentials, receive a JSON Web Token (JWT), and access the dashboard.
2. **Request Creation**: A logged-in user can navigate to the "New Request" page, fill in the title and description, and submit. The record is successfully saved in MongoDB.

*Note: All other workflows and pages have intentional defects, missing route protections, and incomplete backend integrations.*

---

## Candidate Responsibilities

You must inspect and improve the following areas in the codebase:
- **Authentication & Authorization**: Address token security, implement session restore on page refresh, secure role-based access, and prevent unauthorized actions (e.g., privilege escalation during registration).
- **Security & Data Isolation**: Verify data ownership. Standard users should never see or access requests created by other users (Broken Object Level Authorization / IDOR).
- **Request Management**: Complete the request cancellation flow, log status history updates in the database, and link the assignee selection to actual database records.
- **Admin Workflows**: Calculate dashboard metrics dynamically from the database and fix the status change interaction.
- **Input Validation**: Implement consistent frontend and backend validation for required field lengths, formats, and allowed values. Implement duplicate submission prevention.
- **Error Handling**: Replace raw database errors and generic 500 crashes with descriptive, user-friendly error messages and clean HTTP status codes.
- **Responsive UI**: Fix the mobile navigation menu and table layouts for small screens.
- **Testing**: Configure and write automated unit/integration tests to cover core flows.
- **Deployment**: Prepare the monorepo for production deployment. Resolve hardcoded connection strings and secure CORS configuration.

---

## Local Setup

Follow these steps to run the application on your local machine:

### 1. Clone the Repository
```bash
git clone https://github.com/jasiq-labs-admin/service-request-management-system.git
cd service-request-management-system
```

### 2. Install Dependencies
This project uses npm workspaces. Run the following command in the root directory to install dependencies for both the frontend and backend:
```bash
npm install
```

### 3. Environment Configuration
Set up your local environment files:
- **Backend**: Copy `server/.env.example` to `server/.env` and configure your local MongoDB connection string (e.g. `mongodb://localhost:27017/service-request-db`). Add any other configuration variables needed.
- **Frontend**: Copy `client/.env.example` to `client/.env`.

### 4. Database Seeding
Initialize the database with default test users and mock service requests:
```bash
npm run seed
```

### 5. Run the Application
Start the frontend client and backend server concurrently in development mode:
```bash
npm run dev
```
- Client will start at: `http://localhost:3000`
- Server will start at: `http://localhost:5000`

### 6. Production Build
Ensure that both client and server compile and build without compilation errors:
```bash
npm run build
```

---

## Environment Variables

### Backend (`server/.env`)
- `PORT` - The port on which the Express server runs (default: 5000)
- `MONGODB_URI` - MongoDB connection string (e.g. `mongodb://localhost:27017/service-request-db`)
- *(Identify and document any other production env variables you introduce)*

### Frontend (`client/.env`)
- `VITE_API_URL` - Backend server URL accessed by the client.

---

## Test Credentials

Use these seeded accounts to log in and test the system:

| Role | Email | Password |
|---|---|---|
| **User** | `user@example.com` | `User@123` |
| **Admin** | `admin@example.com` | `Admin@123` |

*You may create additional test users as part of your verification plan.*

---

## Assessment Duration

You have **5 calendar days** from the date of assignment to complete the audit, push your changes, deploy the application, and fill in the submission details.

---

## Git Submission Workflow

### Step 1: Create a Feature Branch
Do not commit directly to the default `master` branch. Branch off `master` to work on your features:
```bash
git checkout master
git pull origin master
git checkout -b assessment/<your-name>
```
*Example: `git checkout -b assessment/rahul-sharma`*

### Step 2: Push Your Branch
Make small, atomic commits as you progress. Push your branch to the remote repository:
```bash
git push -u origin assessment/<your-name>
```

### Step 3: Share the Branch URL
Submit the direct link to your assessment branch. **Do not merge your branch into master.**

---

## Required Tested Use Cases

Your submission must document test results for at least the following test categories:

### 1. Authentication & Session
- Valid user and admin logins.
- Invalid login attempts (e.g. incorrect passwords, non-existent emails).
- Accessing protected pages (e.g., User/Admin Dashboards) without a token.
- Role-based route enforcement (preventing standard users from loading admin views).
- Re-loading pages (verifying session persists on refresh).

### 2. Service Requests
- Valid request creation and confirmation.
- Validation of missing required fields (e.g. blank titles).
- Duplicate request prevention (e.g., blocking multiple quick submissions).
- Isolating records (verifying User A cannot retrieve or update User B's tickets).
- Successful ticket cancellation and status update flows.

### 3. Error Handling
- Handling of invalid request IDs (e.g. passing random strings to detail page routes).
- Client behavior when backend service is offline.
- Standardized API error formats (avoiding raw server crash logs).

### 4. UI & Responsiveness
- Form submission loading state indicators.
- Empty states (displays helpful message when no tickets exist).
- Navigating the system on mobile screen sizes.

### 5. Deployment
- Reaching both frontend and backend URLs in a live production environment.
- Persistent state (verifying database operations remain intact after deployment).
- Proper page refresh behavior on nested client-side React routes.

---

# Internship Readiness Audit Submission

*Candidates: Please fill in the details below before submitting your branch.*

## Candidate Details

- Name:
- Email:
- College:
- Course and Year:
- Technology Track:
- GitHub Profile:

## Repository Submission

- Feature Branch:
- Branch URL:
- Latest Commit:
- Pull Request URL, if created:

## Deployment

- Frontend URL:
- Backend URL:
- Test User Credentials:
- Test Admin Credentials:

## Gap Analysis

List the important functional, technical, security, UI and deployment gaps identified before development:
1.
2.
3.

## Changes Completed

Describe the fixes and enhancements you implemented:
1.
2.
3.

## Use Cases Tested

| ID | Use Case | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| TC-01 | | | | Pass/Fail |

## Known Limitations

List any remaining issues, unhandled edge cases, or potential design limitations:
1.
2.
3.

## AI and External Tools Used

| Tool | Where It Was Used | How the Output Was Verified |
|---|---|---|
| | | |

## Deployment Notes

Explain your hosting platform choice, environment variable setup, CORS policies, or any deployment challenges you encountered.

## Demo

- Demo Video URL:
- Preferred Live Demo Time:
