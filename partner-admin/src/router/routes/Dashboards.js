import { lazy } from 'react'

const DashboardRoutes = [
  {
    path: '/configurations',
    component: lazy(() => import('../../views/pages/account-settings')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'configurations'
    }
  },
  {
    path: '/restaurants',
    component: lazy(() => import('../../views/apps/restaurants/list/index')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'restaurants'
    }
  }

]

export default DashboardRoutes
