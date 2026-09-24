import { lazy } from 'react'

const DashboardRoutes = [
  // Dashboards
  {
    path: '/settings',
    component: lazy(() => import('../../views/pages/account-settings')),
    exact: true
  },
  {
    path: '/partners',
    component: lazy(() => import('../../views/apps/partners/list')),
    exact: true
  },
  {
    path: '/restaurants',
    component: lazy(() => import('../../views/apps/restaurants/list')),
    exact: true
  },
  {
    path: '/dashboard',
    component: lazy(() => import('../../views/apps/dashboard/index')),
    exact: true
  }
]

export default DashboardRoutes
