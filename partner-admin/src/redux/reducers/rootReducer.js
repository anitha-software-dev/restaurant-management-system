// ** Redux Imports
import { combineReducers } from 'redux'

// ** Reducers Imports
import auth from './auth'
import navbar from './navbar'
import layout from './layout'
import common from './common'

const rootReducer = combineReducers({
  auth,
  navbar,
  layout,
  common
})

export default rootReducer
