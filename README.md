# Helhal 🚀

**Helhal** is a hybrid freelancing marketplace designed to streamline the connection between service providers (Sellers) and clients (Buyers). The platform supports both digital services and local physical tasks through a robust ecosystem featuring job postings, service listings, real-time communication, and a secure dual-payment system (Escrow and Pay on Delivery).

---

## 📋 Table of Contents

1. [Platform Roles](#-platform-roles)
   - [Admin (System Overseer)](#1-admin-system-overseer)
   - [Buyer (Client)](#2-buyer-client)
   - [Seller (Service Provider)](#3-seller-service-provider)

2. [Access Control for Pages](#-pages--access-control)
   - [Guest](#guest-unauthenticated-user)
   - [Buyer](#buyer)
   - [Seller](#seller)
   - [Admin](#admin)

3. [System Workflows](#-system-workflows)
   - [Service Lifecycle](#a-service-lifecycle-marketplace-flow)
   - [Job Lifecycle](#b-job-lifecycle-marketplace-flow)
   - [Order Creation & Payment](#c-order-creation--payment-lifecycle)
   - [Order Execution Flow](#d-order-execution-flow)
   - [Review System](#e-review-workflow)
   - [Dispute Resolution](#f-dispute-resolution-workflow)

4. [Pages & Testing Guide](#-pages--testing-guide)
   - [Public Pages](#-public-pages-accessible-by-all-roles)
   - [Buyer Pages](#-buyer-pages)
   - [Seller Pages](#-seller-pages)
   - [Admin Pages](#-admin-pages)
   - [Shared Pages](#-shared-pages-multiple-roles)
   - [Payment Pages](#-payment-pages)
   - [Other Pages](#-other-pages)
   - [Testing Best Practices](#-testing-best-practices)

5. [Background Services](#-background-services)
   - [Order Auto-Updater](#1-order-auto-updater-service)
   - [Ratings Auto-Updater](#2-ratings-auto-updater-service)
   - [Response Time Updater](#3-response-time-updater-service)
   - [Withdrawal Cleanup](#4-withdrawal-cleanup-service)
   - [Service Lifecycle](#a-service-lifecycle-marketplace-flow)
   - [Job Lifecycle](#b-job-lifecycle-marketplace-flow)
   - [Order Creation & Payment](#c-order-creation--payment-lifecycle)
   - [Order Execution Flow](#d-order-execution-flow)
   - [Review System](#e-review-workflow)
   - [Dispute Resolution](#f-dispute-resolution-workflow)

4. [Pages & Testing Guide](#-pages--testing-guide)

---

## 👥 Platform Roles

Helhal operates with three distinct user roles, each with specific capabilities and workflows.

### 1. Admin (System Overseer)

* **User & Content Management:** Full control over user accounts, published services, and active jobs.
* **Financial Oversight:** Monitor all platform invoices and track global financial flows.
* **Dispute Resolution:** Act as an arbitrator to resolve conflicts between Buyers and Sellers.
* **System Configuration:** Manage platform-wide settings, categories, and commission rates.
* **Orders Control:**

### 2. Buyer (Client)

Buyers are the primary source of demand on the platform, seeking to hire professional help.

* **Job Creation:** Post detailed job requests and receive competitive proposals from sellers.
* **Direct Purchase:** Browse the marketplace and instantly purchase predefined services.
* **Hybrid Account:** Capacity to create a sub-seller profile and seamlessly switch between buying and selling modes.
* **Order Management:** Track order progress, edit his account details, and open disputes if delivery terms are not met.
* **Wallet Management:** View balance and withdraw funds from their personal platform wallet.

### 3. Seller (Service Provider)

Sellers are the experts providing services and bidding on available opportunities.

* **Service Portfolio:** Create and publish detailed services for direct purchase by buyers.
* **Bid Management:** Browse the job board and submit tailored proposals to buyer requests.
* **Order Fulfillment:** Receive and manage incoming orders, communicating directly with clients via chat.
* **Account Controls:** Edit professional profiles, monitor active orders, and initiate disputes if necessary.
* **Earnings & Payouts:** wallet monitoring to track earnings and request withdrawals.

---

## 🔐 Pages & Access Control

This section outlines which pages each user role can access on the platform.

### Guest (Unauthenticated User)

| Page | Access | Purpose |
|------|--------|---------|
| `/services` | ✅ View Only | Browse available services with service mega menu  |
| `/auth?tab=login` | ✅ Full | Login page |
| `/auth?tab=register` | ✅ Full | Registration/Sign-up page |
| `/freelance` | ✅ Full | How become a freelancer |
| **All Other Pages** | ❌ Blocked | Redirected to login |

### Buyer

| Page | Access | Purpose |
|------|--------|---------|
| `/services` | ✅ Full | Browse and purchase services with mega menu categories |
| `/share-job-description` | ✅ Full | Create and post new jobs |
| `/my-jobs` | ✅ Full | View and manage posted jobs |
| `/my-orders` | ✅ Full | Track all orders and purchases |
| `/my-disputes` | ✅ Full | View and manage disputes |
| `/my-billing` | ✅ Full | View invoices, transactions, and wallet |
| `/cart` | ✅ Full | Shopping cart for service purchases |
| `/chat` | ✅ Full | Real-time messaging with sellers |
| `/profile` | ✅ Full | Edit buyer profile and settings |
| `/become-seller` | ✅ Full | Convert to seller role (if not already) |
| `/settings` | ✅ Full | Account settings and preferences |
| `/invite` | ✅ Full | Invite other users |
| `/jobs` | ❌ Blocked  |  (not available to buyer) |
| `/my-gigs` | ❌ Blocked | Seller feature (unless buyer becomes seller) |
| `/create-gig` | ❌ Blocked | Seller feature (unless buyer becomes seller) |
| `/jobs/proposals` | ❌ Blocked | Seller feature |
| `/dashboard` | ❌ Blocked | Admin feature |

### Seller

| Page | Access | Purpose |
|------|--------|---------|
| `/my-gigs` | ✅ Full | View, edit, and manage published services |
| `/create-gig` | ✅ Full | Create and publish new services |
| `/jobs` | ✅ Full | Browse available jobs to bid on |
| `/jobs/proposals` | ✅ Full | View and manage submitted proposals |
| `/my-orders` | ✅ Full | View orders received from buyers |
| `/my-disputes` | ✅ Full | View and manage disputes |
| `/my-billing` | ✅ Full | View earnings and request payouts |
| `/profile` | ✅ Full | Edit seller profile and credentials |
| `/settings` | ✅ Full | Account settings and preferences |
| `/invite` | ✅ Full | Invite other users |
| `/cart` | ✅ Full | Shopping cart for service purchases |
| `/chat` | ✅ Full | Communicate with buyers |
| `/share-job-description` | ❌ Blocked | Buyer feature |
| `/services` | ❌ Blocked  | (not available to seller) no mega menu|
| `/my-jobs` | ❌ Blocked | Buyer feature |
| `/become-seller` | ❌ Blocked | Already a seller |
| `/dashboard` | ❌ Blocked | Admin feature |

### Admin

| Page | Access | Purpose |
|------|--------|---------|
| `/services` | ✅ Full (Admin View) | Review, approve, or deny services; manage service statuses |
| `/jobs` | ✅ Full (Admin View) | Monitor job postings; manage job statuses |
| `/dashboard` | ✅ Full | Main admin panel with all controls |
| `/my-orders` | ✅ Full | View orders received from buyers |
| `/my-disputes` | ✅ Full | View and manage disputes |
| `/my-billing` | ✅ Full | View earnings and request payouts |
| `/profile` | ✅ Full | Edit seller profile and credentials |
| `/settings` | ✅ Full | Account settings and preferences |
| `/invite` | ✅ Full | Invite other users |
| `/cart` | ✅ Full | Shopping cart for service purchases |
| `/chat` | ✅ Full | Communication (if applicable) |
| `/my-gigs` | ❌ Blocked | Seller feature |
| `/create-gig` | ❌ Blocked | Seller feature |
| `/share-job-description` | ❌ Blocked | Buyer feature |

### Role Switching & Hybrid Accounts

**Buyer to Seller Conversion:**
- Buyers can access `/become-seller` to create a seller sub-profile
- Once converted, buyers gain seller role permissions alongside buyer permissions
- Can switch between roles using the `RelatedUsers` component in user menu

**Access Rights During Hybrid Mode:**
- Combined: All buyer pages + all seller pages
- Navigation updates dynamically based on current active role
- Service mega menu updates based on role context

---

## 🔄 System Workflows

### 🛠️ A. Service Lifecycle (Marketplace Flow)

This workflow governs how predefined services are created, reviewed, and published to the public marketplace.

#### 1. Creation & Submission

* **Seller Action:** The Seller completes the "Create Service" form, providing all necessary details including descriptions, pricing, and images.
* **Initial State:** Upon submission, the service is registered in the system with a `PENDING` status.

#### 2. Administrative Oversight

* **Notification:** The Admin is immediately notified of the new service entry for review.
* **Review & Modification:** The Admin has the authority to edit service details for quality control and must manually update the service status.
* **Status Definitions:**
* `PENDING`: Awaiting initial review.
* `ACTIVE`: Approved, public, and searchable.
* `DENIED`: Rejected by the admin (usually due to policy violations).
* `PAUSED`: Temporarily disabled and hidden from public view.



#### 3. Seller Interaction & Constraints

* **Notifications:** Sellers are automatically notified of any status changes made by the Admin regarding their services.
* **Immutability:** Sellers **cannot edit** a service once it has been submitted. They only retain the permissions to **View** the details or **Delete** the service entirely.

#### 4. Market Visibility

* **Discovery:** Only services marked as `ACTIVE` are indexed by the system. These are the only services visible on the public "Services" page and searchable by potential Buyers.

### 📢 B. Job Lifecycle (Marketplace Flow)
---
This workflow manages the "Buyer-to-Seller" request system, where clients post specific needs and freelancers bid for the work.

#### 1. Creation & Auto-Publication

* **Buyer Action:** The Buyer visits the "Post a Job" page and provides details such as budget, and requirements.
* **System Logic:** Upon submission, the job is **automatically accepted** and published by the system to ensure immediate visibility for sellers.


#### 2. Administrative Oversight

* **Notification:** The Admin is notified of the new job posting for monitoring and safety compliance.
* **Status Management:** While publication is automated, the Admin retains full authority to manually update job statuses to ensure platform quality.

#### 3. Job Status Definitions

* `PENDING`: The initial state upon submission (transitional).
* `PUBLISHED`: The job is live and visible on the public Job Board; Sellers can submit Proposals.
* `CLOSED`: The job is no longer accepting proposals (manually closed or expired).generated.

#### 4. Buyer Feedback

* **Notifications:** The Buyer receives real-time updates regarding any manual status changes performed by the Admin or when the system moves the job to a new phase (e.g., when a job is awarded).

#### 5. Market Visibility

* **Discovery:** Only jobs marked as `PUBLISHED` are indexed by the system. These are the only jobs visible on the public "jobs" page and searchable by potential Sellers.

### 💳 C. Order Creation & Payment Lifecycle
---
This section describes the dual path for generating a legal contract (Order) between a Buyer and a Seller and the subsequent financial processing.

#### 1. Path A: Purchasing a Service

* **Pre-requisites:** The Buyer browses active services and selects a gig.
* **Requirements Gathering:** The Buyer must answer service-specific questions (requirements) defined by the Seller before the order is initialized.
* **Initialization:** Upon submission, the order is created, and the Seller is immediately notified.
* **Billing & Checkout:** The Buyer is redirected to a secure payment page.
* **Data Entry:** Buyer provides billing information (captured for the invoice).
* **Standard Order:** Buyer pays `Service Price + Platform Fees`.
* **Pay on Delivery (POD) Order:** If the service supports POD, the Buyer **only pays the Platform Fees** online. A "Delivery Contract" is automatically generated for the offline balance.



#### 2. Path B: Job Proposal Acceptance (The "Bidding" Model)

* **Bidding:** Sellers submit detailed proposals for a job, specifying their own price, delivery days, and specific terms.
* **Selection:** The Buyer reviews all proposals. They can choose to **Accept** or **Reject** specific bids. Sellers are notified of the decision.
* **Checkout:** The Buyer is redirected to the payment page, where the total is calculated based on the **Seller’s proposed price + Platform Fees**.

### Shared Logic

Once the Buyer enters the payment flow, the system follows a unified financial logic:

* **Platform Fees:** Controlled by the Admin (Default: **10 SAR**). This amount is processed immediately upon success.
* **Escrow Handling:** * the order Price is held in the Platform Wallet (Escrow) until.
* For **POD**, the system only tracks the 10 SAR fee; the service price remains outside the platform's digital wallet.


* **Notifications:**
* **Success:** Buyer receives a "Payment Successful" notification; Seller receives an "Order Paid - Start Working" notification.
* **Failure:** Buyer is notified of the failure and prompted to try again.


* **System State:** The Order status moves from `PENDING` to `WAITING`(mean wait seller accept or reject order) after Payment Successful.


#### 1. Order Execution Flow

Once a payment is successful, the order follows this lifecycle:

* **Initial State (Post-Payment):** The order moves from `PENDING` to `WAITING`.
* **Seller Decision:** * **Reject:** The order is cancelled, and the refund process is triggered.
* **Accept:** The Seller acknowledges the order and starts work. The status moves to `IN_PROGRESS`.


* **Submission:** Upon finishing the task, the Seller uploads/submits their work. The Buyer is immediately notified for review.

#### 2. The Review & Modification Loop

Helhal provides a flexible review system to ensure quality:

* **Buyer Review:** The Buyer examines the submission and has two choices:
1. **Accept Submission:** The order is marked as `COMPLETED`. Funds are released from Escrow to the Seller's wallet.
2. **Request Modification:** The Buyer rejects the current version and asks for changes.


* **Unlimited Revisions:** There is no hard limit on modifications.
* After a modification request, the Seller must resubmit.
* The Buyer reviews the new submission.
* This loop continues until the Buyer is satisfied or a dispute is opened.



#### 3. Cancellation & Permissions

* **Buyer Permissions:** Can cancel the order only while the status is `PENDING` (pre-payment) or `WAITING` (post-payment, before seller acceptance).
* **Seller Permissions:** Can cancel/reject the order only while the status is `PENDING` or `WAITING`.

#### 4. Refund Logic (The Wallet System)

If an order is **Cancelled by the Buyer** or **Rejected by the Seller** after payment has been made:

* **Order Price:** Automatically returned to the **Buyer’s Platform Wallet**.
* **Withdrawal:** The Buyer can withdraw these funds to bank account at any time.
* **Non-Refundable Fees:** The **Platform Fees (10 SAR)** are strictly non-refundable and are retained by the platform to cover administrative and gateway costs.

### 🚀 D. Order Execution Flow
---
Once a payment is successful, the order follows this lifecycle:

#### 1. Initial State & Seller Decision

* **Initial State (Post-Payment):** The order moves from `PENDING` to `WAITING` (waiting for seller acceptance or rejection).
* **Seller Decision:**
  - **Reject:** The order is cancelled, and the refund process is triggered.
  - **Accept:** The Seller acknowledges the order and starts work. The status moves to `IN_PROGRESS`.

#### 2. The Review & Modification Loop

Helhal provides a flexible review system to ensure quality:

* **Buyer Review:** The Buyer examines the submission and has two choices:
  1. **Accept Submission:** The order is marked as `COMPLETED`. Funds are released from Escrow to the Seller's wallet minus seller platform fess which is by defualt (10%).
  2. **Request Modification:** The Buyer rejects the current version and asks for changes.

* **Unlimited Revisions:** There is no hard limit on modifications.
* After a modification request, the Seller must resubmit.
* The Buyer reviews the new submission.
* This loop continues until the Buyer is satisfied or a dispute is opened.

#### 3. Cancellation & Permissions

* **Buyer Permissions:** Can cancel the order only while the status is `PENDING` (pre-payment) or `WAITING` (post-payment, before seller acceptance).
* **Seller Permissions:** Can cancel/reject the order only while the status is `PENDING` or `WAITING`.

### 🔄 E. Review Workflow

---

The review system allows buyers and sellers to rate each other after order completion, building trust and reputation within the platform.

#### 1. Review Window & Eligibility

* **Completion Requirement:** Both parties can only submit reviews after the order status is `COMPLETED`.
* **Rating Period:** Reviews must be submitted within **14 days** of order completion. After this period expires, no new reviews can be added.
* **Privacy Protection:** Ratings remain private until both parties have rated or the 14-day window has expired.

#### 2. Buyer Reviews Seller

* **Rating Criteria (5-point scale):**
  - **Quality:** How well the service/deliverable met expectations.
  - **Communication:** Responsiveness and clarity of communication.
  - **Skills:** Technical proficiency and expertise demonstrated.
  - **Availability:** Reliability and adherence to timelines.
  - **Cooperation:** Willingness to work with feedback and revisions.

* **Review Text:** Optional detailed feedback about the seller's performance.
* **Calculation:** Average score = (Quality + Communication + Skills + Availability + Cooperation) / 5

#### 3. Seller Reviews Buyer

* **Rating Criteria (5-point scale):**
  - **Communication:** Clarity of requirements and responsiveness.
  - **Cooperation:** Flexibility and willingness to collaborate.
  - **Availability:** Responsiveness during order execution.
  - **Clarity:** Clear job description and requirements.
  - **Payment:** Timeliness and reliability of payment.

* **Review Text:** Optional detailed feedback about the buyer's experience.
* **Calculation:** Average score = (Communication + Cooperation + Availability + Clarity + Payment) / 5

#### 4. Rating Publication Logic

Ratings are automatically published when:
- **Both parties have rated** each other (Private → Public)
- **OR 14-day window has expired** with at least one rating submitted (Private → Public)

#### 5. Seller Level & Top-Rated Status

Based on published ratings, sellers can achieve:
* **Top Rated Badge:** Awarded when seller has ≥ 30 completed orders AND average rating ≥ 4.7
* **Seller Level:** Sellers with top-rated status are promoted to `LVL2`

#### 6. Service & User Stats Update

When a rating is published:
* **Seller Stats:** Average rating across all public reviews is calculated and displayed on seller profile.
* **Service Stats:** Average rating is calculated from all reviews on that specific service.
* **Buyer Stats:** Similar averaging is done for buyers based on seller reviews.

#### 7. Rating Immutability

* **Before Publication:** Ratings can be edited before the rating is marked as public.
* **After Publication:** Once a rating is public, it **cannot be edited** and becomes permanent.


### ⚖️ F. Dispute Resolution Workflow

---


The dispute system provides a formal mechanism for resolving conflicts between buyers and sellers when expectations are not met.

#### 1. Dispute Initiation

* **Who Can Raise:** Both Buyers and Sellers can initiate disputes on an order.
* **When:** Disputes can be opened at any point when there's a disagreement about order completion or fulfillment.
* **Subject & Reason:** The initiator provides:
  - **Subject:** Brief title of the dispute
  - **Reason:** Detailed explanation of the issue
  - **Type:** Category of dispute (e.g., quality issues, non-delivery, etc.)

#### 2. Admin Review Process

* **Notification:** Admin is immediately notified of the new dispute.
* **Status Flow:**
  - `OPEN`: Initial state, awaiting admin review
  - `IN_REVIEW`: Admin is actively investigating the dispute
  - `RESOLVED`: Admin has made a decision and payout processed
  - `REJECTED`: Admin determined the dispute is invalid
  - `CLOSED_NO_PAYOUT`: Dispute closed without financial payout changes and order completed normally

#### 3. Investigation Phase

* **Admin Actions:**
  - Review order details, invoice, and all communications
  - Examine work submission and buyer feedback
  - Review complete message thread and activity log
  - Request additional information if needed

* **Threaded Messages:** Both parties can communicate with the admin and each other within the dispute thread for clarification.

#### 4. Resolution & Financial Settlement

Admin determines the resolution by deciding:
* **Seller Payout Amount:** How much of the escrowed funds the seller receives
* **Buyer Refund Amount:** How much is refunded to the buyer's wallet
* **Constraint:** `Seller Amount + Buyer Refund = Order Subtotal` (the escrowed service price)

**Note:** Platform fees are never refunded and are retained by the system regardless of dispute outcome.

#### 5. Order Status After Resolution

Admin can close the dispute as:
* **Completed:** Order is treated as successfully delivered (despite the dispute)
* **Cancelled:** Order is marked as cancelled with appropriate financial adjustments

#### 6. Settlement & Notifications

Once resolved:
* **Seller:** Receives their designated amount in their platform wallet
* **Buyer:** Receives their refund in their platform wallet (if any)
* **Both Parties:** Receive notifications about the dispute outcome

#### 7. Dispute Statuses & Visibility

| Status | Visibility | Can Appeal |
|--------|------------|-----------|
| `OPEN` | Parties + Admin | Yes |
| `IN_REVIEW` | Parties + Admin | Yes |
| `RESOLVED` | Parties + Admin | No |
| `REJECTED` | Parties + Admin | No |
| `CLOSED_NO_PAYOUT` | Parties + Admin | No |

#### 8. Communication & Transparency

* **Activity Log:** All actions, status changes, and messages are permanently recorded and visible to both parties
* **Real-time Updates:** Parties receive notifications of any status changes or new messages in the dispute
* **Message Threading:** Supports nested responses for organized conversation
* **Audit Trail:** Complete history is maintained for platform records and accountability

---

## 📊 Quick Reference: Status Flows

### Service Status Flow
```
PENDING → ACTIVE (approved) or DENIED (rejected) or PAUSED (temporary hold)
```

### Job Status Flow
```
PENDING → PUBLISHED → CLOSED
```

### Order Status Flow
```
PENDING → WAITING → IN_PROGRESS → COMPLETED
       ↓        ↓
     CANCELLED (refund triggered)
```

### Dispute Status Flow
```
OPEN → IN_REVIEW → RESOLVED or REJECTED or CLOSED_NO_PAYOUT
```

### Rating Status Flow
```
PRIVATE (one or both rated, <14 days) → PUBLIC (both rated or 14 days expired)
```

---

## 📄 Pages & Testing Guide

This section provides a comprehensive overview of all pages in the system, their functionality, and what should be tested on each page.

### 🌐 Public Pages (Accessible by All Roles)

#### `/` - Home Page
**What This Page Does:**
- Displays the platform landing page
- Showcases featured services and categories
- Provides marketing content and platform overview
- Links to authentication pages for non-logged-in users

**Testing Checklist:**
-  [ ] Page loads without errors
-  [ ] All top categories that admin specify, display correctly
-  [ ] All featured services that admin specify,  display correctly
-  [ ] Navigation links work properly
-  [ ] Responsive design on mobile/tablet/desktop
-  [ ] Sign up and login links are visible for guests
-  [ ] Las CTA section change based on role

---

#### `/services` - Services Marketplace
**What This Page Does:**
- Browse all active services published by sellers
- Filter services by categories using mega menu
- Search services
- View service details including price, seller info, and ratings

**Testing Checklist:**
-  [ ] Services load and display correctly
-  [ ] Category mega menu filters work
-  [ ] Search functionality works for services
-  [ ] Pagination works correctly
-  [ ] Service cards show: title, lowest price, seller info,service rating, description

---

#### `/services/[category]` - Services by Category
**What This Page Does:**
- Filter and display services within a specific category

**Testing Checklist:**
-  [ ] Category page loads with correct services
-  [ ] Filters work
-  [ ] Sort options function correctly
-  [ ] No services from other categories appear

---

#### `/services/[category]/[service]` - Service Detail Page
**What This Page Does:**
- Display complete service details
- Show seller profile and reviews that related to this service
- Display service pricing and packages
- Answer service-specific questions before purchase
- Show related services

**Testing Checklist:**
-  [ ] Service details load correctly
-  [ ] Seller profile information displays
-  [ ] Reviews and ratings that relate to show properly
-  [ ] Service images/gallery displays
-  [ ] Requirements of service shown form renders
-  [ ] "Buy Now" button works and triggers checkout
-  [ ] Related services suggestions appear
-  [ ] Service status is "ACTIVE" only (not PENDING/DENIED)

---

#### `/auth?tab=login` - Login Page
**What This Page Does:**
- Authenticate existing users
- Support email/password login
- Support social login options
- Redirect to appropriate page after login

**Testing Checklist:**
-  [ ] Incorrect credentials show error message
-  [ ] Correct credentials log in successfully
-  [ ] Forgot password link works
-  [ ] Social login buttons present and work
-  [ ] Login with phone present and work
-  [ ] Tab switching between login/register works

---

#### `/auth?tab=register` - Registration Page
**What This Page Does:**
- Create new user accounts
- Support buyer and seller registration
- Email verification
- Initial profile setup

**Testing Checklist:**
-  [ ] Form validates all required fields
-  [ ] Email validation works
-  [ ] Buyer/Seller role selection works
-  [ ] Email verification is sent
-  [ ] Duplicate email shows error
-  [ ] Redirect to login after registration

---

#### `/freelance` - Become a Freelancer
**What This Page Does:**
- Educational content about becoming a seller
- Benefits and features for sellers
- Step-by-step guide to create services
- Eligibility requirements

**Testing Checklist:**
-  [ ] Page loads with all content sections
-  [ ] Responsive layout on all devices
-  [ ] FAQ that admin set appear correctly


---

#### `/profile/[id]` - Public Profile View
**What This Page Does:**
- View any user's public profile
- See seller's services and ratings
- View seller's reviews and experience
- Contact seller option

**Testing Checklist:**
-  [ ] User profile loads correctly
-  [ ] Seller badges (Top Rated, Level) display
-  [ ] Rating and review statistics show
-  [ ] Services list displays
-  [ ] Profile picture loads
-  [ ] Contact/message button works (if authenticated)
-  [ ] Invalid user ID shows 404 error
-  [ ] If profile related to seller the basic profile information not shown
-  [ ] If profile related to buyer the contact information not shown

---

### 👤 Buyer Pages

#### `/my-jobs` - My Jobs (Buyer)
**What This Page Does:**
- List all jobs created by the buyer
- Filter jobs by status (PENDING, PUBLISHED, CLOSED)
- Edit job details before publication
- View proposals received for jobs
- Close jobs manually

**Testing Checklist:**
-  [ ] All buyer's jobs load correctly
-  [ ] Jobs display with correct status
-  [ ] Filter by status works
-  [ ] Pagination works
-  [ ] Delete job confirmation appears
-  [ ] View proposals shows all bids
-  [ ] Sort options (newest, oldest) work
-  [ ] No jobs from other buyers appear

---

#### `/my-jobs/[id]/proposals` - Job Proposals
**What This Page Does:**
- View all proposals for a specific job
- Compare seller proposals (price, timeline, etc.)
- Accept or reject proposals
- Message sellers about proposals

**Testing Checklist:**
-  [ ] All proposals for the job display
-  [ ] Proposals show seller info, price, timeline, description
-  [ ] Accept proposal button triggers checkout
-  [ ] Reject proposal shows confirmation
-  [ ] Message seller opens chat
-  [ ] Only buyer of the job can view proposals
-  [ ] Seller profile links work

---

#### `/share-job-description` - Post a Job
**What This Page Does:**
- Create and publish new job postings
- Define job title, category, description
- Set budget and timeline
- Specify skills and requirements
- Attach files/documents
- Preview before publishing
- Auto-publishes upon submission
- Seller notifications sent automatically

**Job Form Fields:**
- **Title:** Job/project name (required)
- **Category:** Service category selection (required)
- **Description:** Detailed job description (required)
- **Budget:** Price range (required)
- **Timeline:** Delivery deadline (required)
- **Scope:** Specific requirements/deliverables
- **Skills Required:** Tags for needed skills
- **Attachments:** Upload reference files
- **Scope Level:** Entry/Intermediate/Expert

**Testing Checklist:**

#### **Step 1: Project Details (The "What")** 📝
Verify that red error messages appear if "Title," "Category," or "Description" are left blank.
Add multiple skills and confirm the "X" button correctly removes individual tags.
Attempt to add more than 15 skills to ensure the limit is enforced.
Select a country and confirm the "State/City" list updates to match that country.
Attach different file types (PDF, JPG) and verify they appear in the attachment list before proceeding.
Confirm the "Next" button remains disabled or prevents progress if validation errors exist.


#### **Step 2: Budget & Delivery (The "How Much")** 💰

Enter a budget and verify the system accepts only positive numbers.
Switch between "Fixed Price" and "Hourly Rate" to ensure the selection is highlighted.
Input "30" in delivery days and verify it is accepted as a valid duration.
Use the "Back" button to return to Step 1 and verify all previously entered data (Title, Skills, etc.) is still there.

#### **Step 3: Review & Final Submission (The "Final Look")** ✅

Verify that the summary page exactly matches the info entered in Steps 1 and 2.
Switch the site language to Arabic and verify that Category and Country names display in Arabic.
Click "Publish Job" and verify a "Success" toast notification appears.
Confirm the system automatically redirects you to the "My Jobs" page after a successful post.


#### **General Form Behavior (End-to-End)** 🔄

Fill half the form, refresh the browser, and verify your progress is not lost (Auto-save).
Try clicking Step 3 breadcrumb while still on Step 1 to ensure users can't skip required info.
Click the "Reset" button and verify the entire form is cleared and you are returned to the start.
Verify the "Publish" button shows a loading spinner to prevent double-clicking during submission.

#### `/my-orders` - My Orders (Buyer)
**What This Page Does:**
- View all orders/purchases made by buyer
- Filter by status (PENDING, WAITING, IN_PROGRESS, COMPLETED)
- Track order progress
- Submit or revise deliverables
- Accept or request modifications
- Leave reviews after completion
- Open disputes if needed

**Testing Checklist:**
-  [ ] All user's orders load correctly
-  [ ] Orders show status badges
-  [ ] Search and Filter by status works
-  [ ] Order detail view opens correctly
-  [ ] Buyer Can request modification in DEIVERED status
-  [ ] Buyer  Can accept submission in DEIVERED status
-  [ ] Buyer and seller Can rate after COMPLETED
-  [ ] Can open dispute button available
-  [ ] Chat with ather person works
-  [ ] Buyer Can cancel if order is PENDING OR WAITING
-  [ ] Seller Accept order button works
-  [ ] Seller Reject order shows confirmation
-  [ ] Seller can submit work normally and after new change request send from buyer
-  [ ] Review form available after completion
-  [ ] Seller Can open dispute
-  [ ] SellerChat with buyer works
---

#### `/my-disputes` - My Disputes (Buyer)
**What This Page Does:**
- View all disputes raised by or against the buyer
- Filter disputes by status
- View dispute details and communications
- Message admin and other party
- View resolution outcomes

**Testing Checklist:**
-  [ ] All disputes load correctly
-  [ ] Filter by status (OPEN, IN_REVIEW, RESOLVED, REJECTED) works
-  [ ] Dispute detail shows order info, communications
-  [ ] Threaded messages display correctly
-  [ ] Resolution details show payout amounts
-  [ ] Cannot modify closed disputes
-  [ ] Only buyer's disputes display
-  [ ] Can't chat after dispute is closed

---

#### `/my-billing` - My Billing (Buyer)
**What This Page Does:**
- View wallet balance and history
- See all transactions and invoices
- Request withdrawals to bank account
- View payment methods
- Download invoices

**Testing Checklist:**
-  [ ] Wallet balance displays correctly
-  [ ] Transaction history loads
-  [ ] Pagination works for transactions
-  [ ] Withdrawal form validates amount
-  [ ] Sufficient balance validation works
-  [ ] Bank account management works

---

#### `/cart` - Shopping Cart
**What This Page Does:**
- View all items added to cart
- Modify quantity (if applicable)
- Remove items from cart
- Review total price with fees
- Proceed to checkout

**Testing Checklist:**
-  [ ] All cart items display correctly
-  [ ] Remove item works
-  [ ] Empty cart shows appropriate message
-  [ ] Cart persists across sessions

---

#### `/profile` - My Profile (Buyer)
**What This Page Does:**
- Edit buyer profile information
- Upload profile picture
- Update contact information
- View account statistics
- Manage related seller profiles

**Testing Checklist:**
-  [ ] Profile information loads correctly
-  [ ] Profile updates save successfully
-  [ ] Account Verification work

---

#### `/become-seller` - Become a Seller
**What This Page Does:**
- Enable buyer to create seller profile with same basic information

**Testing Checklist:**
-  [ ] Seller profile creation works
-  [ ] Role successfully switches to seller

---

#### `/chat` - Messaging
**What This Page Does:**
- Real-time chat with sellers/buyers
- View all conversations
- Filter conversations
- Send and receive messages
- Show unread message count

**Testing Checklist:**
-  [ ] Conversation list loads
-  [ ] Unread count badge displays
-  [ ] Click conversation opens chat
-  [ ] Messages send successfully
-  [ ] Messages receive in real-time
-  [ ] Can attach files
-  [ ] Search conversations works
-  [ ] Archive/Pin conversation works
-  [ ] Contact with admin works

---

### 🏪 Seller Pages

#### `/my-gigs` - My Services (Seller)
**What This Page Does:**
- List all services published by seller
- Filter by status (PENDING, ACTIVE, DENIED, PAUSED)
- Edit service details
- Delete services
- View service analytics and orders

**Testing Checklist:**
-  [ ] All seller's services load
-  [ ] Services show correct status
-  [ ] Filter by status works
-  [ ] Search services works
-  [ ] Delete shows confirmation
-  [ ] Cannot edit published services
-  [ ] analytics shows as click (service views - one click for one user per day)
-  [ ] Only seller's services display

---

#### `/create-gig` - Create Service (Seller)
**What This Page Does:**
- Multi-step wizard for creating services (6 steps)
- Define service category, title, brief, tags, location
- Create service packages (Basic, Standard, Premium tiers)
- Add FAQs and service details
- Define buyer requirements/questions
- Upload images, video, and portfolio documents
- Review and submit service for admin approval

**Multi-Step Wizard Breakdown:**

**Step 1: Basic Information**
- Service title (5-100 characters)
- Brief description (10-500 characters)
- Category and subcategory selection
- Tags (1-5 tags required)
- Country and state/location
- Form saves to localStorage automatically

**Step 2: Service Packages**
- Create 1+ packages (Basic, Standard, Premium templates provided)
- Each package requires:
  - Title (max 60 characters)
  - Description (max 220 characters)
  - Delivery time (1-1200 days)
  - Revisions allowed (0-20)
  - Price (1-100000 SAR)
  - Features list (1-5 features, max 50 chars each)
- Options: Extra fast delivery, additional revisions, pay on delivery

**Step 3: FAQs**
- Add up to 12 FAQs
- Each FAQ: Question (max 200 chars) + Answer (max 1000 chars)
- Pre-populated FAQ templates available
- Can remove/edit FAQs

**Step 4: Requirements/Questions**
- Add up to 12 questions for buyers
- Question types: Text, Multiple choice, File upload
- Each question can be marked as required
- Multiple choice: 1-10 options per question
- Question text max 200 chars

**Step 5: Media Upload**
- Images: 1-3 required (max 10 MB each, PNG/JPG)
- Video: 0-1 optional (max 200 MB, MP4/WebM)
- Portfolio documents: 0-2 optional (max 25 MB each)
  - Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT
- Image preview gallery

**Step 6: Review & Submit**
- Review all entered information
- Final confirmation before submission
- Service created with PENDING status
- Seller receives confirmation
- Admin receives notification for review


---

#### `/jobs` - Browse Jobs (Seller)
**What This Page Does:**
- View all published job postings
- Filter jobs by category, price, timeline
- Search job descriptions
- View job details and requirements
- Submit proposals to jobs

**Testing Checklist:**
-  [ ] All published jobs load
-  [ ] Filter 
-  [ ] Submit proposal form works (only sumit if not has one)

---

#### `/jobs/proposals` - My Proposals (Seller)
**What This Page Does:**
- View all proposals submitted by seller
- Filter by status (PENDING, ACCEPTED, REJECTED)
- View proposal details
- Edit proposal if not yet accepted
- Withdraw proposal option

**Testing Checklist:**
-  [ ] All seller's proposals load
-  [ ] Filter by status works
-  [ ] Cannot edit accepted proposals

---

#### `/my-orders` - My Orders (Seller)
**What This Page Does:**
- View all orders received from buyers
- Filter by status (WAITING, IN_PROGRESS, COMPLETED)
- Accept or reject orders
- Upload/submit deliverables
- Receive buyer feedback
- Leave reviews after completion
- Open disputes if needed

**Testing Checklist:**
-  [ ] All seller's orders load
-  [ ] Filter by status works
-  [ ] Accept order button works
-  [ ] Reject order shows confirmation
-  [ ] File upload for deliverables works
-  [ ] Submit deliverables notification sent
-  [ ] Add feedback
-  [ ] Can submit work after complete and after new request chaneg send from buyer
-  [ ] Review form available after completion
-  [ ] Can open dispute
-  [ ] Chat with buyer works

---

#### `/my-disputes` - My Disputes (Seller)
**What This Page Does:**
- View all disputes for seller's orders
- Track dispute status and resolution
- Message admin and buyer
- View resolution and payouts

**Testing Checklist:**
-  [ ] All seller's disputes load
-  [ ] Filter by status works
-  [ ] Dispute details show
-  [ ] Message thread displays
-  [ ] Can add messages
-  [ ] Resolution details accurate

---

#### `/my-billing` - My Billing (Seller)
**What This Page Does:**
- View seller earnings
- Track completed orders revenue
- Request withdrawals
- View transaction history
- View invoices and tax info

**Testing Checklist:**
-  [ ] Earnings total calculated correctly
-  [ ] Transaction history loads
-  [ ] Filter transactions works
-  [ ] Sufficient balance validation
-  [ ] Bank account management works

---


---

### 👑 Admin Pages

#### `/dashboard` - Admin Dashboard
**What This Page Does:**
- Main admin control center
- Quick statistics overview
- Recent activity feed
- Quick access to admin functions
- System health indicators

**Testing Checklist:**
-  [ ] Dashboard loads without errors
-  [ ] Statistics display correctly
-  [ ] Recent activity shows correct data
-  [ ] Quick action buttons work
-  [ ] Charts and graphs render
-  [ ] Load time acceptable
-  [ ] Responsive layout
-  [ ] **Permission checks work**

---

#### `/dashboard/services` - Services Management
**What This Page Does:**
- Review all services (PENDING, ACTIVE, DENIED, PAUSED)
- Approve or deny services
- Edit service details
- Change service status
- View service analytics

**Testing Checklist:**
-  [ ] All services load
-  [ ] Filter by status works
-  [ ] Search services works
-  [ ] Approve/deny buttons work
-  [ ] Status change 
-  [ ] Can edit service details
-  [ ] Seller notifications sent on status change
-  [ ] Pagination works
-  [ ] Mark services as popular

---


#### `/dashboard/jobs` - Jobs Management
**What This Page Does:**
- Monitor all job postings
- Filter by status 
- View job details 
- Manage job visibility
- Close jobs if needed

**Testing Checklist:**
-  [ ] All jobs load
-  [ ] Filter
-  [ ] Job detail opens
-  [ ] Can chaneg job status
-  [ ] Pagination functions

---

#### `/dashboard/orders` - Orders Management
**What This Page Does:**
- Monitor all platform orders
- Filter by status and date
- View order details 
- Manage order issues

**Testing Checklist:**
-  [ ] All orders load
-  [ ] Filter
-  [ ] Order detail shows complete info
-  [ ] Payment status accurate
-  [ ] Can mark order as payed

---

#### `/dashboard/disputes` - Disputes Management (Admin)
**What This Page Does:**
- View all platform disputes
- Filter by status (OPEN, IN_REVIEW, RESOLVED, REJECTED)
- Review dispute details and communications
- Investigate disputes
- Propose resolutions with payment splits
- Finalize dispute resolution
- Process payouts

**Testing Checklist:**
-  [ ] All disputes load
-  [ ] Filter by status works
-  [ ] Dispute detail loads completely
-  [ ] Can mark as IN_REVIEW
-  [ ] Message interface works
-  [ ] Can add admin messages
-  [ ] Activity thread displays
-  [ ] Resolution form validates:
  -  [ ] Seller amount + Buyer refund = Order subtotal
  -  [ ] Amounts are non-negative
  -  [ ] Platform fees not included
-  [ ] Can close as RESOLVED or REJECTED
-  [ ] Payout processing works
-  [ ] Both parties notified
-  [ ] Cannot modify closed disputes

---

#### `/dashboard/users` - Users Management
**What This Page Does:**
- View all platform users
- Filter by role (Admin, Buyer, Seller)
- View user details
- Edit user information
- Manage user permissions
- Deactivate/ban users if needed

**Testing Checklist:**
-  [ ] All users load
-  [ ] Filter 
-  [ ] Permission settings visible
-  [ ] Can deactivate user
-  [ ] Pagination works

---

#### `/dashboard/invoices` - Financial Management
**What This Page Does:**
- View all platform invoices
- Track payments and commissions
- Generate financial reports
- Monitor wallet transactions
- View platform revenue

**Testing Checklist:**
-  [ ] Invoices load correctly
-  [ ] Filter 
-  [ ] Invoice details show
---

#### `/dashboard/categories` - Categories Management
**What This Page Does:**
- View all service categories
- Create new categories
- Edit category details
- Manage subcategories
- Set category status

**Testing Checklist:**
-  [ ] All categories load
-  [ ] Create category form works
-  [ ] Edit category works
-  [ ] Delete category (if no services or jobs related) works
-  [ ] Category icons/images upload
-  [ ] Sort categories works
-  [ ] Mark categories as top

---

#### `/dashboard/settings` - Platform Settings
**What This Page Does:**
- Configure global platform settings
- Manage commission and fee structure
- Upload platform logo and branding
- Configure contact information
- Manage social media links
- Upload legal documents (Terms, Privacy Policy)
- Create and manage FAQs for different pages
- Toggle job approval requirement
- Set platform currency

**Configuration Sections:**

**1. General Settings:**
- Site name
- Site logo upload (PNG/SVG recommended)
- Contact email
- Support phone
- Default currency selection
- Platform account user ID (for receiving fees)

**2. Financial Settings:**
- Platform commission percentage (default 10%)
- Seller service fee percentage (0-100%)
- Platform fees validation

**3. Features:**
- Jobs require approval toggle (auto-publish vs admin review)
- Toggle updates job behavior system-wide

**4. Legal Documents:**
- Privacy Policy (English & Arabic)
- Terms of Service (English & Arabic)
- Rich text editor for each
- Preview mode
- Character counter
- Save separately per language

**5. FAQs Management:**
- Freelance Page FAQs (English & Arabic)
- Invite Page FAQs (English & Arabic)
- Become Seller Page FAQs (English & Arabic)
- Tabbed editor interface
- Each FAQ: Question + Answer
- Add/remove FAQ items
- Up to 12 FAQs per section

**6. Social Media Links:**
- Facebook URL
- Twitter URL
- Instagram URL
- LinkedIn URL
- Pinterest URL
- TikTok URL

---

### 🔗 Shared Pages (Multiple Roles)

#### `/settings` - Account Settings
**What This Page Does:**
- Tabbed interface with 3 sections: Account, Security, Notifications
- Edit profile information (username, email)
- Change password with validation
- Manage two-factor authentication (2FA)
- View and manage active sessions
- Configure notification preferences
- Account deactivation with feedback

**Account Settings Tab:**
- Update username
- Pending email verification support
- Account deactivation with reason selection
- Deactivation consequences warning

**Security Settings Tab:**
- Change password:
  - Current password validation
  - New password (8-20 chars, letters/numbers/special chars)
  - Confirm password match
- Active sessions list:
  - Device name and IP
  - Last active timestamp
  - Revoke individual sessions
  - Revoke all other sessions option
- Session pagination (50 items per page)

**Notification Settings Tab:**
- Email notification toggles for:
  - New messages
  - Order updates
  - Service reviews
  - Disputes
  - Platform announcements
- In-app notification preferences
- Notification frequency settings

---

#### `/invite` - Invite Users
**What This Page Does:**
- Generate unique referral links with QR code
- Send email invitations to multiple people
- Social media sharing (LinkedIn, Facebook, Twitter, Pinterest, Gmail)
- Email customization (subject, message, sender name)
- Track invitation history and response rates
- FAQs about referral program
- Email validation and parsing

**Invitation Methods:**
1. **Email Invites:**
   - Paste multiple emails (comma/line separated)
   - Auto-validates email format
   - Shows valid/invalid email count
   - Customizable subject and message
   - Sender name auto-fills from user profile

2. **Referral Link:**
   - Unique link per user
   - One-click copy to clipboard
   - QR code generation
   - Shareable via social media

3. **Social Sharing:**
   - LinkedIn share button
   - Facebook share button
   - Twitter/X share button
   - Pinterest share button
   - Gmail direct integration
   - TikTok share support

---

#### `/chat` - Messaging (All Authenticated Users)
**What This Page Does:**
- Direct messaging with other users
- View conversation history
- Real-time notifications
- File sharing in chat

**Testing Checklist:**
-  [ ] Conversations load
-  [ ] Real-time messaging works
-  [ ] File upload works
-  [ ] Notifications trigger
-  [ ] Search conversations
-  [ ] Archive functionality

---

#### `/notifications` - Notifications Center
**What This Page Does:**
- View all platform notifications
- Filter by type
- Mark as read/unread

**Testing Checklist:**
-  [ ] Notifications load
-  [ ] Filter by type works
-  [ ] Mark as read works
-  [ ] Click notification navigates
-  [ ] Unread count updates
-  [ ] Old notifications paginate

---

### 💳 Payment Pages

#### `/payment/success` - Payment Success
**What This Page Does:**
- Confirm successful payment
- Show order confirmation
- Display order details
- Provide download/print options

**Testing Checklist:**
-  [ ] Success message displays
-  [ ] Order details show correctly
-  [ ] Can download invoice
-  [ ] Can view order
-  [ ] Seller notification sent

---

#### `/payment/fail` - Payment Failed
**What This Page Does:**
- Show payment failure reason
- Provide retry option
- Suggest troubleshooting steps

**Testing Checklist:**
-  [ ] Error message displays
-  [ ] Error reason shows
-  [ ] Retry button works

---

### 📚 Other Pages

#### `/profile/[id]` - User Public Profile
(Already covered above in Public Pages)

#### `/terms` - Terms of Service
**What This Page Does:**
- Display platform terms and conditions
- Provide legal information
- Explain user rights and responsibilities

**Testing Checklist:**
-  [ ] Page loads completely

---

#### `/privacy-policy` - Privacy Policy
**What This Page Does:**
- Display privacy policy
- Explain data handling
- GDPR compliance information

**Testing Checklist:**
-  [ ] Page loads completely

---

## 🔧 Background Services

These are automated tasks that run on a schedule to keep the system working. They handle important jobs like finalizing orders, publishing ratings, updating seller stats, and processing withdrawals.

### 1. Order Auto-Updater | Daily 12:00 AM

**What It Does:**
If an order takes too long, this service automatically finishes it. It marks old orders as COMPLETED (so seller gets paid) or CANCELLED (so buyer gets refund).

**Logic:**
- Checks orders that passed their delivery deadline
- If delivery time expired → Mark COMPLETED, release seller payment
- If too long waiting → Mark CANCELLED, refund buyer

**What To Test:**
-  [ ] Service runs at 12:00 AM (check logs)
-  [ ] Old orders become COMPLETED after deadline passes
-  [ ] Old orders become CANCELLED if they timeout
-  [ ] Seller wallet shows payment when order completes
-  [ ] Buyer wallet shows refund when order cancels
-  [ ] Both get notifications

---

### 2. Ratings Auto-Updater | Daily 12:00 AM

**What It Does:**
After 14 days of an order being done, private ratings automatically become public so everyone can see them.

**Logic:**
- Finds all ratings marked as private
- Checks if their order was completed 14+ days ago
- Changes them from private to public
- Updates seller/service ratings average

**What To Test:**
-  [ ] Service runs at 12:00 AM (check logs)
-  [ ] Private ratings older than 14 days → become public
-  [ ] Public ratings show up in seller profile
-  [ ] Seller average rating updates after publication
-  [ ] Service average rating updates
-  [ ] Both buyer and seller get notifications
-  [ ] Ratings from completed orders only are affected
-  [ ] 14-day date counts from order completion date
-  [ ] If seller gets enough ratings (30+) with 4.7+, they get "Top Rated" badge

---

### 3. Response Time Updater | Daily 2:00 AM

**What It Does:**
Calculates how quickly each seller replies to messages and updates their profile.

**Logic:**
- Looks at all messages from the last 60 days
- Calculates average time seller took to reply
- Updates seller's response time in profile

**What To Test:**
-  [ ] Service runs at 2:00 AM 
-  [ ] Seller response time gets updated
-  [ ] Response time shows correctly in seller profile
-  [ ] All sellers get updated
-  [ ] Response times show as days/hours/minutes (e.g., "2d 3h 15m")
-  [ ] No sellers are skipped

---

### 4. Withdrawal Cleanup | Every 15 Minutes

**What It Does:**
Checks if seller withdrawal requests are done processing but payment getway fail to notify our systme. If payment gateway confirms success, money releases. If failed, refund seller.

**Logic:**
- Finds all withdrawals waiting > 15 minutes
- Checks payment gateway for status (takes up to 50 at once)
- Marks as SUCCESS or FAILED
- If failed, refunds seller immediately

**What To Test:**
-  [ ] Service runs every 15 minutes (check logs)
-  [ ] Pending withdrawals are checked
-  [ ] Only withdrawals waiting > 15 minutes are checked
-  [ ] Status SUCCESS → transaction completed
-  [ ] Status FAILED → seller wallet refunded
-  [ ] Seller gets refund notification

---