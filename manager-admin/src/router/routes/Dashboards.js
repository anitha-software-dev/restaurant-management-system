import { lazy } from 'react'

const DashboardRoutes = [
  // Dashboards
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
    path: '/categories',
    component: lazy(() => import('../../views/apps/categories/list')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'categories'
    }
  },
  {
    path: '/subCategories',
    component: lazy(() => import('../../views/apps/subCategories/list')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'subCategories'
    }
  },
  {
    path: '/menu',
    component: lazy(() => import('../../views/apps/menu/list')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'menu'
    }
  },
  {
    path: '/order/view/:id',
    component: lazy(() => import('../../views/apps/orders/view')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'orders'
    }
  },
  {
    path: '/orders',
    component: lazy(() => import('../../views/apps/orders/list')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'orders'
    }
  },
  {
    path: '/items',
    component: lazy(() => import('../../views/apps/items/list')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'items'
    }
  },
  {
    path: '/item/add',
    component: lazy(() => import('../../views/apps/items/add')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'items'
    }
  },
  {
    path: '/item/edit/:id',
    component: lazy(() => import('../../views/apps/items/add')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'items'
    }
  },
  {
    path: '/tables',
    component: lazy(() => import('../../views/apps/tables/list')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'tables'
    }
  },
  {
    path: '/waiters',
    component: lazy(() => import('../../views/apps/waiters/list')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'waiters'
    }
  },
  {
    path: '/chefs',
    component: lazy(() => import('../../views/apps/chefs/list')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'chefs'
    }
  },
  {
    path: '/chef/:id',
    component: lazy(() => import('../../views/apps/chefs/add')),
    exact: true,
    meta: {
      action: 'manage',
      resource: 'chefView'
    }
  }

]

export default DashboardRoutes
