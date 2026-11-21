import {
  Bus,
  LayoutGrid,
  Map as MapIcon,
  Navigation,
  Route,
  Users,
  Wallet,
} from 'lucide-react'

// One menu per role. Each item points to a route defined in app/router.jsx.
// `end: true` marks a home page, so it is only highlighted on its exact URL.
export const NAVIGATION = {
  admin: {
    label: 'Transport admin',
    sections: [
      {
        title: 'Operations',
        items: [
          { to: '/admin', label: 'Dashboard', icon: LayoutGrid, end: true },
          { to: '/admin/live-map', label: 'Live map', icon: MapIcon },
          { to: '/admin/routes', label: 'Routes & assignment', icon: Route },
        ],
      },
      {
        title: 'People',
        items: [{ to: '/admin/students', label: 'Students', icon: Users }],
      },
      {
        title: 'Finance',
        items: [{ to: '/admin/payments', label: 'Payments', icon: Wallet }],
      },
    ],
  },
  parent: {
    label: 'Parent',
    sections: [
      {
        title: 'My family',
        items: [
          { to: '/parent', label: 'Home', icon: LayoutGrid, end: true },
          { to: '/parent/track', label: 'Track the bus', icon: MapIcon },
          { to: '/parent/children', label: 'Children', icon: Users },
        ],
      },
      {
        title: 'Fees',
        items: [{ to: '/parent/payments', label: 'Payments', icon: Wallet }],
      },
    ],
  },
  driver: {
    label: 'Driver',
    sections: [
      {
        title: 'Driving',
        items: [
          { to: '/driver', label: 'Today', icon: Bus, end: true },
          { to: '/driver/trip', label: 'Active trip', icon: Navigation },
        ],
      },
    ],
  },
}
