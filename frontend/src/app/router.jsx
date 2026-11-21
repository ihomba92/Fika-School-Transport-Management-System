import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthLayout } from '@/components/layout/auth-layout'
import { LandingPage } from '@/pages/public/landing-page'
import { NotFoundPage } from '@/pages/public/not-found-page'
import { LoginPage } from '@/pages/auth/login-page'
import { SignUpPage } from '@/pages/auth/sign-up-page'
import { CheckEmailPage } from '@/pages/auth/check-email-page'
import { LinkExpiredPage } from '@/pages/auth/link-expired-page'
import { AdminDashboardPage } from '@/pages/admin/dashboard-page'
import { AdminLiveMapPage } from '@/pages/admin/live-map-page'
import { AdminRoutesPage } from '@/pages/admin/routes-page'
import { AdminStudentsPage } from '@/pages/admin/students-page'
import { AdminPaymentsPage } from '@/pages/admin/payments-page'
import { AdminFeeSettingsPage } from '@/pages/admin/fee-settings-page'
import { ParentHomePage } from '@/pages/parent/home-page'
import { ParentTrackPage } from '@/pages/parent/track-page'
import { ParentChildrenPage } from '@/pages/parent/children-page'
import { ParentPaymentsPage } from '@/pages/parent/payments-page'
import { DriverTodayPage } from '@/pages/driver/today-page'
import { DriverTripPage } from '@/pages/driver/trip-page'

// Every web address in the app. Pages for each role sit inside that role's layout.
// Access control (who may open which section) is added in Module 1.
export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignUpPage /> },
      { path: 'check-email', element: <CheckEmailPage /> },
      { path: 'link-expired', element: <LinkExpiredPage /> },
    ],
  },
  {
    path: 'admin',
    element: <AppLayout role="admin" />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'live-map', element: <AdminLiveMapPage /> },
      { path: 'routes', element: <AdminRoutesPage /> },
      { path: 'students', element: <AdminStudentsPage /> },
      { path: 'payments', element: <AdminPaymentsPage /> },
      { path: 'payments/settings', element: <AdminFeeSettingsPage /> },
    ],
  },
  {
    path: 'parent',
    element: <AppLayout role="parent" />,
    children: [
      { index: true, element: <ParentHomePage /> },
      { path: 'track', element: <ParentTrackPage /> },
      { path: 'children', element: <ParentChildrenPage /> },
      { path: 'payments', element: <ParentPaymentsPage /> },
    ],
  },
  {
    path: 'driver',
    element: <AppLayout role="driver" />,
    children: [
      { index: true, element: <DriverTodayPage /> },
      { path: 'trip', element: <DriverTripPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
