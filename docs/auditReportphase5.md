# Audit Report

# AI-Assisted Service Request Management System (SRMS)

## Phase 5 – User Dashboard Audit & Enhancement

**Author:** Faijan Raza  
**Phase:** Phase 5  
**Audit Type:** Functional & Security Audit  
**Status:** ✅ Completed

---

# 1. Executive Summary

Phase 5 focused on auditing and enhancing the **User Dashboard** to improve usability, security, and overall user experience. The audit covered every major dashboard workflow, including request creation, request management, searching, filtering, pagination, ticket cancellation, validation, duplicate request prevention, and ownership enforcement.

Several usability and security gaps were identified during the audit and resolved through frontend and backend improvements. The resulting dashboard is significantly more reliable, secure, and production-ready.

---

# 2. Audit Objectives

The audit aimed to verify and improve the following functionality:

- Create Request
- View Requests
- Search Requests
- Filter Requests
- Pagination
- Cancel Ticket
- Duplicate Submission Prevention
- Loading States
- Error Handling
- Empty State Handling
- Responsive Design
- Backend Validation
- Frontend Validation
- Owner-Based Ticket Visibility

---

# 3. Audit Findings & Fixes

---

## 3.1 AI Service Audit

### Finding

The AI analysis endpoint returned fixed suggestions directly from the controller and did not guard against provider failures, invalid payloads, or slow responses.

### Risk

- Unvalidated AI suggestions could override backend-safe category and priority rules.
- Provider downtime could surface hard failures to the user.
- The frontend would not know whether the response came from a live AI source or a safe backup path.

### Resolution

Implemented a dedicated AI analysis utility that:

- retries failed provider calls up to 2 times,
- enforces a 3-second timeout,
- validates the response shape and values,
- normalizes category and priority to the backend-safe allowlist,
- falls back to a deterministic heuristic when the provider is unavailable or returns invalid data,
- preserves a clear fallback flag for the client.

The controller now returns a normalized response with both the suggested values and a fallback indicator, and the frontend displays that fallback state without bypassing backend validation.

### Result

The AI service is now resilient, validated, and safe even when the provider fails.

**Status:** ✅ Implemented

---

## 3.2 Create Request

### Finding

The request form lacked proper validation and allowed users to submit the same request multiple times while the API call was still in progress.

### Risk

- Duplicate service requests
- Invalid data submission
- Poor user experience

### Resolution

Implemented:

- Required field validation
- Title validation
- Description validation
- Disabled submit button during request processing
- Improved success and failure notifications
- Updated AI analysis to use the authenticated endpoint

### Result

Only valid requests are submitted, and duplicate form submissions are prevented.

**Status:** ✅ Fixed

---

## 3.2 View Requests

### Finding

Request listing lacked clear organization and informative user feedback.

### Risk

Poor visibility into submitted service requests.

### Resolution

Improved dashboard presentation by:

- Organizing request information
- Improving layout consistency
- Enhancing request display

### Result

Users can easily monitor and manage their submitted requests.

**Status:** ✅ Improved

---

## 3.3 Search Functionality

### Finding

No search capability existed.

### Risk

Users had difficulty locating specific tickets.

### Resolution

Implemented dynamic search across:

- Request Number
- Title
- Description

### Result

Users can quickly locate requests.

**Status:** ✅ Implemented

---

## 3.4 Filter Functionality

### Finding

Dashboard lacked filtering capability.

### Risk

Poor navigation through large request lists.

### Resolution

Added filtering by request status.

Supported values:

- OPEN
- IN_REVIEW
- IN_PROGRESS
- RESOLVED
- CANCELLED

### Result

Users can efficiently narrow displayed requests.

**Status:** ✅ Implemented

---

## 3.5 Pagination

### Finding

Large request lists displayed on a single page.

### Risk

Reduced usability and scalability.

### Resolution

Implemented pagination with:

- Previous
- Next
- Page Indicator

### Result

Dashboard remains responsive regardless of ticket count.

**Status:** ✅ Implemented

---

## 3.6 Cancel Ticket

### Finding

Cancellation lacked proper restrictions and user feedback.

### Risk

Resolved or cancelled requests could potentially be modified.

### Resolution

Implemented:

- Loading indicator
- Automatic dashboard refresh
- Backend restrictions preventing invalid cancellation

### Result

Only eligible requests can be cancelled.

**Status:** ✅ Improved

---

## 3.7 Duplicate Submission Prevention

### Finding

Users could unintentionally create duplicate requests.

### Risk

Duplicate tickets increased workload and affected data quality.

### Resolution

Implemented backend fingerprint generation using normalized:

- Title
- Description

Duplicate requests now return:

**HTTP 409 Conflict**

### Result

Repeated submissions are successfully prevented.

**Status:** ✅ Implemented

---

## 3.8 Loading States

### Finding

No visual indication was provided while asynchronous operations were executing.

### Risk

Users repeatedly triggered the same actions.

### Resolution

Added loading indicators for:

- Dashboard loading
- Ticket creation
- Ticket cancellation

### Result

Improved user feedback and reduced duplicate interactions.

**Status:** ✅ Implemented

---

## 3.9 Error States

### Finding

Errors were not clearly communicated to users.

### Risk

Poor usability and confusion during failures.

### Resolution

Added descriptive error messages for:

- Validation failures
- API failures
- Cancellation failures

### Result

Users receive meaningful feedback when operations fail.

**Status:** ✅ Improved

---

## 3.10 Empty State

### Finding

Dashboard appeared blank when no requests existed.

### Risk

Users could mistake empty data for an application failure.

### Resolution

Implemented dedicated empty-state messaging.

### Result

Users clearly understand when no requests are available.

**Status:** ✅ Implemented

---

## 3.11 Responsive Design

### Finding

Dashboard layout was not optimized for smaller devices.

### Risk

Poor usability on tablets and mobile phones.

### Resolution

Implemented responsive layouts:

- Desktop table layout
- Mobile card layout

### Result

Dashboard adapts across different screen sizes.

**Status:** ✅ Improved

---

## 3.12 Backend Validation

### Finding

Server-side validation required strengthening.

### Risk

Invalid data could be persisted.

### Resolution

Added validation for:

- Required title
- Required description
- Minimum length
- Maximum length
- Valid category
- Valid priority

### Result

Only valid requests are accepted.

**Status:** ✅ Implemented

---

## 3.13 Frontend Validation

### Finding

Validation relied primarily on backend responses.

### Risk

Delayed feedback to users.

### Resolution

Implemented client-side validation before API submission.

### Result

Users receive immediate validation feedback.

**Status:** ✅ Implemented

---

## 3.14 Owner-Based Ticket Visibility

### Finding

Dashboard required strict ownership enforcement.

### Risk

Potential Broken Object Level Authorization (BOLA).

### Resolution

Implemented ownership validation.

Standard users:

- Can only access their own requests.

Administrators:

- Can access all requests.

### Result

Unauthorized users cannot access another user's tickets.

**Status:** ✅ Implemented

---

# 4. Files Modified

## Frontend

- `client/src/pages/UserDashboard.tsx`
- `client/src/pages/CreateRequest.tsx`

## Backend

- `server/src/controllers/requestController.ts`
- `server/src/models/ServiceRequest.ts`
- `server/src/utils/requestFingerprint.ts`

---

# 5. Build Verification

The application was rebuilt after implementing all dashboard improvements.

| Verification                    | Result      |
| ------------------------------- | ----------- |
| Client Build                    | ✅ Passed   |
| Server Build                    | ✅ Passed   |
| Search Functionality            | ✅ Verified |
| Filter Functionality            | ✅ Verified |
| Pagination                      | ✅ Verified |
| Duplicate Submission Protection | ✅ Verified |
| Ticket Cancellation             | ✅ Verified |
| Backend Validation              | ✅ Verified |
| Frontend Validation             | ✅ Verified |
| Ownership Enforcement           | ✅ Verified |

---

# 6. Audit Summary

| Feature                         | Status         |
| ------------------------------- | -------------- |
| Create Request                  | ✅ Improved    |
| View Requests                   | ✅ Improved    |
| Search                          | ✅ Implemented |
| Filter                          | ✅ Implemented |
| Pagination                      | ✅ Implemented |
| Cancel Ticket                   | ✅ Improved    |
| Duplicate Submission Prevention | ✅ Implemented |
| Loading States                  | ✅ Implemented |
| Error States                    | ✅ Improved    |
| Empty State                     | ✅ Implemented |
| Responsive Design               | ✅ Improved    |
| Backend Validation              | ✅ Implemented |
| Frontend Validation             | ✅ Implemented |
| Owner-Based Access Control      | ✅ Implemented |

---

# 7. Overall Assessment

The Phase 5 audit successfully addressed both usability and security concerns within the User Dashboard. New features such as search, filtering, pagination, responsive layouts, and duplicate submission prevention greatly improve the user experience, while backend ownership enforcement and validation strengthen data integrity and access control. The dashboard is now better equipped to support real-world usage with improved reliability and maintainability.

---

# 8. Conclusion

The **Phase 5 – User Dashboard Audit & Enhancement** has been successfully completed. All targeted dashboard features were audited, verified, and improved where necessary. The module now offers a secure, responsive, and user-friendly experience, backed by robust validation, duplicate request prevention, and strict owner-based access control. The successful build verification confirms that the implemented enhancements integrate cleanly into the existing application and contribute to a more production-ready system.
