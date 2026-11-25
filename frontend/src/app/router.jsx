import { createBrowserRouter } from 'react-router'
import { RequireRole } from '@/auth/require-role'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthLayout } from '@/components/layout/auth-layout'
import { NotFoundPage } from '@/pages/public/not-found-page'

// Loads a page's code only when someone opens it, so phones download less up front.
// `load` imports the page's file; `name` is the component it exports.
function lazyPage(load, name) {
  return async () => ({ Component: (await load())[name] })
}

// Every web address in the app. Pages for each role sit inside that role's layout.
// RequireRole keeps each role's pages for that role; the back end checks too.
export const router = createBrowserRouter([
  {
    path: '/',
    lazy: lazyPage(() => import('@/pages/public/landing-page'), 'LandingPage'),
  },
  {
    path: 'terms',
    lazy: async () => {
      const { LegalPage } = await import('@/pages/public/legal-page')
      return { Component: () => <LegalPage title="Terms of use" /> }
    },
  },
  {
    path: 'privacy',
    lazy: async () => {
      const { LegalPage } = await import('@/pages/public/legal-page')
      return { Component: () => <LegalPage title="Privacy notice" /> }
    },
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        lazy: lazyPage(() => import('@/pages/auth/login-page'), 'LoginPage'),
      },
      {
        path: 'signup',
        lazy: lazyPage(() => import('@/pages/auth/sign-up-page'), 'SignUpPage'),
      },
      {
        path: 'check-email',
        lazy: lazyPage(
          () => import('@/pages/auth/check-email-page'),
          'CheckEmailPage',
        ),
      },
      {
        path: 'link-expired',
        lazy: lazyPage(
          () => import('@/pages/auth/link-expired-page'),
          'LinkExpiredPage',
        ),
      },
      {
        path: 'complete-profile',
        lazy: lazyPage(
          () => import('@/pages/auth/complete-profile-page'),
          'CompleteProfilePage',
        ),
      },
      {
        path: 'forgot-password',
        lazy: lazyPage(
          () => import('@/pages/auth/forgot-password-page'),
          'ForgotPasswordPage',
        ),
      },
      {
        path: 'reset-password',
        lazy: lazyPage(
          () => import('@/pages/auth/reset-password-page'),
          'ResetPasswordPage',
        ),
      },
    ],
  },
  {
    path: 'admin',
    element: (
      <RequireRole role="admin">
        <AppLayout role="admin" />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        lazy: lazyPage(
          () => import('@/pages/admin/dashboard-page'),
          'AdminDashboardPage',
        ),
      },
      {
        path: 'live-map',
        lazy: lazyPage(
          () => import('@/pages/admin/live-map-page'),
          'AdminLiveMapPage',
        ),
      },
      {
        path: 'schedule',
        lazy: lazyPage(
          () => import('@/pages/admin/schedule-page'),
          'AdminSchedulePage',
        ),
      },
      {
        path: 'routes/new',
        lazy: lazyPage(
          () => import('@/pages/admin/route-form-page'),
          'AdminRouteFormPage',
        ),
      },
      {
        path: 'routes/:routeId/edit',
        lazy: lazyPage(
          () => import('@/pages/admin/route-form-page'),
          'AdminRouteFormPage',
        ),
      },
      {
        path: 'routes',
        lazy: lazyPage(
          () => import('@/pages/admin/routes-page'),
          'AdminRoutesPage',
        ),
      },
      {
        path: 'students',
        lazy: lazyPage(
          () => import('@/pages/admin/students-page'),
          'AdminStudentsPage',
        ),
      },
      {
        path: 'students/:studentId',
        lazy: lazyPage(
          () => import('@/pages/admin/student-profile-page'),
          'AdminStudentProfilePage',
        ),
      },
      {
        path: 'drivers',
        lazy: lazyPage(
          () => import('@/pages/admin/drivers-page'),
          'AdminDriversPage',
        ),
      },
      {
        path: 'drivers/new',
        lazy: lazyPage(
          () => import('@/pages/admin/new-driver-page'),
          'AdminNewDriverPage',
        ),
      },
      {
        path: 'drivers/buses/new',
        lazy: lazyPage(
          () => import('@/pages/admin/new-bus-page'),
          'AdminNewBusPage',
        ),
      },
      {
        path: 'payments',
        lazy: lazyPage(
          () => import('@/pages/admin/payments-page'),
          'AdminPaymentsPage',
        ),
      },
      {
        path: 'payments/settings',
        lazy: lazyPage(
          () => import('@/pages/admin/fee-settings-page'),
          'AdminFeeSettingsPage',
        ),
      },
    ],
  },
  {
    path: 'parent',
    element: (
      <RequireRole role="parent">
        <AppLayout role="parent" />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        lazy: lazyPage(
          () => import('@/pages/parent/home-page'),
          'ParentHomePage',
        ),
      },
      {
        path: 'track',
        lazy: lazyPage(
          () => import('@/pages/parent/track-page'),
          'ParentTrackPage',
        ),
      },
      {
        path: 'children',
        lazy: lazyPage(
          () => import('@/pages/parent/children-page'),
          'ParentChildrenPage',
        ),
      },
      {
        path: 'children/new',
        lazy: lazyPage(
          () => import('@/pages/parent/child-form-page'),
          'ParentChildFormPage',
        ),
      },
      {
        path: 'children/:childId/edit',
        lazy: lazyPage(
          () => import('@/pages/parent/child-form-page'),
          'ParentChildFormPage',
        ),
      },
      {
        path: 'payments',
        lazy: lazyPage(
          () => import('@/pages/parent/payments-page'),
          'ParentPaymentsPage',
        ),
      },
      {
        path: 'notifications',
        lazy: lazyPage(
          () => import('@/pages/parent/notifications-page'),
          'ParentNotificationsPage',
        ),
      },
    ],
  },
  {
    path: 'driver',
    element: (
      <RequireRole role="driver">
        <AppLayout role="driver" />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        lazy: lazyPage(
          () => import('@/pages/driver/today-page'),
          'DriverTodayPage',
        ),
      },
      {
        path: 'trip',
        lazy: lazyPage(
          () => import('@/pages/driver/trip-page'),
          'DriverTripPage',
        ),
      },
      {
        path: 'profile',
        lazy: lazyPage(
          () => import('@/pages/driver/profile-page'),
          'DriverProfilePage',
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
