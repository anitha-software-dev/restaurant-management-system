// ** Routes Imports
import PagesRoutes from './Pages'
import DashboardRoutes from './Dashboards'

// ** Document title
const TemplateTitle = '%s - Partner Restaurant App'

const userData = (localStorage.getItem('auth')) ? JSON.parse(localStorage.getItem('auth')) : null

// ** Default Route
const DefaultRoute = '/restaurants'

// ** Merge Routes
const Routes = [
  ...DashboardRoutes,
  ...PagesRoutes
]

export { DefaultRoute, TemplateTitle, Routes }
