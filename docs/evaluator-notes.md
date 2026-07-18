# Evaluator Notes - Service Request Management System

This document is for the JASIQ Labs evaluation team. It contains details of the intentionally introduced gaps, missing modules, defective implementations, and instructions on how to evaluate the candidate's submission.

---

## 1. Intentionally Incomplete Features & Missing Modules

### Missing Modules
1. **User Profile (`/auth/me` / User Profile Module)**:
   - **Backend**: The endpoint `/api/auth/me` is completely missing.
   - **Impact**: When the frontend reloads, it attempts to verify the session by fetching `/api/auth/me`. Since the endpoint is missing, the session is reset and they are logged out. The candidate must build `/auth/me` to fetch the user profile.
2. **Admin User Listing (`/users/admins` or similar)**:
   - **Backend**: No endpoint exists to get active admin accounts.
   - **Impact**: The assignee dropdown in `AdminDashboard.tsx` uses mock options. The candidate must build a route/controller to query active admin accounts and populate this dynamically.
3. **Dashboard Stats / Metrics Module**:
   - **Backend**: No stats endpoint exists to calculate totals for tickets.
   - **Impact**: The stats cards in `AdminDashboard.tsx` are hardcoded. The candidate must build stats calculation dynamically.

---

## 2. Known Defects Inserted

### Authentication & Authorization
1. **Plaintext Password Saving**:
   - **File**: `server/src/controllers/authController.ts`
   - **Description**: The `/register` endpoint saves the password directly in plaintext without hashing, while `/login` uses `bcrypt.compare`.
   - **Impact**: Registered accounts fail to log in.
2. **Privilege Escalation in Registration**:
   - **File**: `server/src/controllers/authController.ts` & `client/src/pages/Register.tsx`
   - **Description**: Frontend has a role selector, and backend saves it without check.
3. **Broken Object Level Authorization (BOLA/IDOR)**:
   - **File**: `server/src/controllers/requestController.ts`
   - **Description**: Regular users can see everyone's requests and details, and cancel any request.
4. **Missing Route Protection**:
   - **File**: `server/src/routes/requestRoutes.ts` & `client/src/main.tsx`
   - **Description**: Details view is unprotected on backend, and `/admin` is unprotected on frontend.

### UI & UX Glitches
1. **Broken Mobile Navigation**:
   - **File**: `client/src/components/Navbar.tsx`
   - **Description**: Hamburger button click does not toggle menu.
2. **State Synchronization Bug**:
   - **File**: `client/src/pages/UserDashboard.tsx`
   - **Description**: Cancelling a request does not update UI state until manual page refresh.
3. **HTTP Method Mismatch**:
   - **File**: `client/src/pages/AdminDashboard.tsx`
   - **Description**: Frontend calls PUT instead of PATCH for status update.

---

## 3. Verification of the Two Working Scenarios

### Working Scenario 1: User Login
1. Seed database: `npm run seed` inside `server/`.
2. Start backend: `npm run dev` in `server/`.
3. Start client: `npm run dev` in `client/`.
4. Login using `user@example.com` / `User@123`.

### Working Scenario 2: Create a Basic Service Request
1. Log in, click "New Request".
2. Enter Title and Description and submit.
