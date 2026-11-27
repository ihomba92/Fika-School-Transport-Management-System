# Fika API contract

[`openapi.yaml`](openapi.yaml) is the agreement between the React front end
(`../frontend`) and the Flask back end (`../backend`, still to come). It has
one endpoint for every function in `frontend/src/services/`, with the exact
request body, response shape, error codes and error messages.

The front end's mock services already answer in these shapes, and
`frontend/src/services/contract.test.js` checks that they keep doing so. When
you change an answer, change the mock and this file together.

## Reading it

- **In the browser**: paste the file into [Swagger Editor](https://editor.swagger.io).
- **In VS Code**: the *OpenAPI (Swagger) Editor* extension gives a preview and
  checks the file as you type.
- **As a docs site**: `npx @redocly/cli preview-docs openapi.yaml`, then open
  the address it prints.
- **Check it after editing**: `npx @redocly/cli lint openapi.yaml`.

The top of the file explains the rules every endpoint follows: the `/api/v1`
base path, camelCase JSON, dates and times in Nairobi time, `[lat, lng]`
positions, whole shillings, `Authorization: Bearer` tokens, `Accept-Language`
for English or Kiswahili, and one error format. It also lists the rules in
`frontend/src/lib/` the server must port to Python, and the few places where
the front end changes when it switches from the mocks.

## Endpoints to build

73 endpoints. Tick them off as the Flask API answers each one; a good
order is the same as the screens were built: Auth, then Admin · Fleet (the
data everything else needs), Admin · Today, Parent, Driver, Payments and
M‑Pesa, Reports. *new* marks endpoints with no mock yet: the request
helper, M‑Pesa polling and Safaricom's callback.

### Auth (12)

Sign-up, sign-in and passwords (`auth-service.js`). Public.

| Done | Method | Path | Front end | What it does |
|---|---|---|---|---|
| ☐ | `POST` | `/auth/login` | `logIn` | Log in with email and password |
| ☐ | `POST` | `/auth/signup` | `signUp` | Create a parent account |
| ☐ | `GET` | `/auth/verify-email` | *new* | Open the link from the verification email |
| ☐ | `POST` | `/auth/resend-verification` | `resendVerificationEmail` | Send the verification email again |
| ☐ | `POST` | `/auth/google` | `continueWithGoogle` | Sign in or sign up with Google |
| ☐ | `POST` | `/auth/complete-profile` | `completeProfile` | Finish a Google sign-up |
| ☐ | `POST` | `/auth/forgot-password` | `requestPasswordReset` | Email a password-reset link |
| ☐ | `POST` | `/auth/reset-password` | `resetPassword` | Set a new password from the emailed link |
| ☐ | `POST` | `/auth/refresh` | *new* | Get a new access token |
| ☐ | `POST` | `/auth/logout` | *new* | Log out on this device |
| ☐ | `GET` | `/me` | *new* | The signed-in account |
| ☐ | `PATCH` | `/me` | *new* | Save the account's language |

### Parent (12)

The parent app (`parent-service.js`). Role `parent`.

| Done | Method | Path | Front end | What it does |
|---|---|---|---|---|
| ☐ | `GET` | `/parent/family` | `getFamily` | Everything the parent Home page needs |
| ☐ | `POST` | `/parent/children` | `saveChild(values)` | Add a child (an application) |
| ☐ | `GET` | `/parent/children/{childId}` | `getChild` | One of the parent's children |
| ☐ | `PUT` | `/parent/children/{childId}` | `saveChild(values, childId)` | Change a child's details |
| ☐ | `GET` | `/parent/term` | `getCurrentTerm` | The current term and its fee |
| ☐ | `GET` | `/parent/trip` | `getMorningTrip` | The pickup carrying this family's children, with the bus on the map |
| ☐ | `GET` | `/parent/trip/status` | `getTripStatus` | The same trip in a few hundred bytes, for Save data mode |
| ☐ | `GET` | `/parent/payments` | `getPayments` | This term's successful payments, newest first |
| ☐ | `POST` | `/parent/payments/mpesa` | `payWithMpesa` | Start an M-Pesa payment (STK push) |
| ☐ | `GET` | `/parent/payments/mpesa/{checkoutRequestId}` | *new* | How an M-Pesa payment ended |
| ☐ | `GET` | `/parent/notifications` | `getNotifications` | The parent's notifications, newest first |
| ☐ | `POST` | `/parent/notifications/read` | `markAllNotificationsRead` | Mark every notification read |

### Driver (11)

The driver app (`driver-service.js`). Role `driver`.

| Done | Method | Path | Front end | What it does |
|---|---|---|---|---|
| ☐ | `GET` | `/driver/day` | `getDriverDay` | Everything the driver's Today page needs |
| ☐ | `GET` | `/driver/trips/active` | `getActiveTrip` | The trip being driven now |
| ☐ | `POST` | `/driver/trips/{tripId}/start` | `startTrip` | Start a trip |
| ☐ | `PUT` | `/driver/trips/{tripId}/marks/{riderId}` | `markRider` | Mark a student picked up, dropped off or absent |
| ☐ | `DELETE` | `/driver/trips/{tripId}/marks/{riderId}` | `markRider(tripId, riderId, null)` | Undo a mark made by mistake |
| ☐ | `PUT` | `/driver/trips/{tripId}/boarding/{riderId}` | `markBoarding` | Boarding check at school, before a drop-off leaves |
| ☐ | `DELETE` | `/driver/trips/{tripId}/boarding/{riderId}` | `markBoarding(tripId, riderId, null)` | Undo a boarding mark |
| ☐ | `POST` | `/driver/trips/{tripId}/end` | `endTrip` | End a trip |
| ☐ | `POST` | `/driver/positions` | `sendPosition` | The bus's GPS position, every 10–15 seconds during a trip |
| ☐ | `GET` | `/driver/profile` | `getDriverProfile` | The driver's details and today's bus |
| ☐ | `PATCH` | `/driver/profile` | `updateDriverPhone` | Change the driver's own phone number |

### Admin · Today (10)

Dashboard, live map and students (`admin-service.js`). Role `admin`.

| Done | Method | Path | Front end | What it does |
|---|---|---|---|---|
| ☐ | `GET` | `/admin/live` | `getLiveBuses` | Every bus on the shift that is on now, with its live status |
| ☐ | `GET` | `/admin/overview` | `getAdminOverview` | Everything the dashboard needs |
| ☐ | `GET` | `/admin/students` | `listStudents` | Accepted students, searched and filtered |
| ☐ | `GET` | `/admin/students/{studentId}` | `getStudent` | One student's profile |
| ☐ | `PUT` | `/admin/students/{studentId}/assignment` | `assignStudent` | Put a student on a route and a bus for each run |
| ☐ | `POST` | `/admin/students/{studentId}/present` | `markStudentPresent` | Mark a student present again for the rest of today |
| ☐ | `GET` | `/admin/applications` | `listApplications` | Children parents added, waiting for a decision, and the declined ones |
| ☐ | `POST` | `/admin/applications/{studentId}/accept` | `acceptApplication` | Accept a child into Fika |
| ☐ | `POST` | `/admin/applications/{studentId}/decline` | `declineApplication` | Decline an application, with a reason the parent sees |
| ☐ | `POST` | `/admin/applications/{studentId}/reopen` | `reopenApplication` | Put a declined application back in the list |

### Admin · Fleet (18)

Buses, drivers, schedule, trip times, routes and placement (`fleet-service.js`). Role `admin`.

| Done | Method | Path | Front end | What it does |
|---|---|---|---|---|
| ☐ | `GET` | `/admin/fleet` | `getFleet` | Every bus and driver, with what each does on the shift on now |
| ☐ | `POST` | `/admin/buses` | `createBus` | Add a bus |
| ☐ | `POST` | `/admin/drivers` | `createDriver` | Create a driver account |
| ☐ | `GET` | `/admin/schedule` | `getSchedule` | A school week of shifts, and what the screen needs to check them |
| ☐ | `PUT` | `/admin/schedule/{date}/{tripId}` | `saveShift` | Save one shift (a trip time on a day) |
| ☐ | `POST` | `/admin/schedule/{date}/{tripId}/copy` | `copyShiftToRestOfWeek` | Copy a shift to the same trip time on the later days of its week |
| ☐ | `GET` | `/admin/trip-times` | `getTripTimes` | The school's trip times, pickups first |
| ☐ | `POST` | `/admin/trip-times` | `saveTripTime(null, values)` | Add a trip time |
| ☐ | `PUT` | `/admin/trip-times/{tripId}` | `saveTripTime(tripId, values)` | Change a trip time |
| ☐ | `DELETE` | `/admin/trip-times/{tripId}` | `deleteTripTime` | Remove a trip time and its shifts from today on |
| ☐ | `GET` | `/admin/routes` | `getRoutes` | Every route, with its buses on the shift on now and how well its students fit |
| ☐ | `POST` | `/admin/routes` | `saveRoute(null, values)` | Create a route |
| ☐ | `GET` | `/admin/routes/new` | `getNewRoute` | A blank route for the editor |
| ☐ | `GET` | `/admin/routes/{routeId}` | `getRoute` | One route for the editor |
| ☐ | `PUT` | `/admin/routes/{routeId}` | `saveRoute(routeId, values)` | Change a route |
| ☐ | `GET` | `/admin/placements` | `getWaitingGroups` | Accepted students who need a route, grouped by where they live |
| ☐ | `POST` | `/admin/placements/approve` | `approveGroup` | Place a group on a route, a bus and a stop |
| ☐ | `POST` | `/admin/placements/{groupId}/dismiss` | `dismissGroup` | Hide a group's suggestion |

### Admin · Payments (7)

Fees, reminders and term settings (`payments-service.js`). Role `admin`.

| Done | Method | Path | Front end | What it does |
|---|---|---|---|---|
| ☐ | `POST` | `/admin/students/{studentId}/remove-for-fees` | `removeForFees` | Take a flagged student off their buses for unpaid fees |
| ☐ | `GET` | `/admin/payments/overview` | `getPaymentsOverview` | This term's totals, the students behind on fees, and the latest payments |
| ☐ | `GET` | `/admin/payments` | `listTermPayments` | Every M-Pesa payment this term, oldest first, for "Export statement" |
| ☐ | `POST` | `/admin/payments/reminders` | `sendReminders` | Remind parents that a payment is overdue |
| ☐ | `GET` | `/admin/fee-settings` | `getFeeSettings` | The school year's terms, and the rules for every term |
| ☐ | `POST` | `/admin/terms/{termId}/preview` | `previewTermChange` | How many students would be overdue after a change |
| ☐ | `PUT` | `/admin/terms/{termId}` | `saveTerm` | Change a term's dates, fee and due dates |

### Admin · Reports (2)

Monthly reports (`reports-service.js`). Role `admin`.

| Done | Method | Path | Front end | What it does |
|---|---|---|---|---|
| ☐ | `GET` | `/admin/reports/months` | `getReportMonths` | The months that have trips recorded, latest first |
| ☐ | `GET` | `/admin/reports/{month}` | `getMonthlyReport` | One month's report |

### M-Pesa (1)

Called by Safaricom, not by the front end.

| Done | Method | Path | Front end | What it does |
|---|---|---|---|---|
| ☐ | `POST` | `/payments/mpesa/callback` | *new* | Safaricom's result for an STK push |
