import { Ability } from '@casl/ability'
import { initialAbility } from './initialAbility'

//  Read ability from localStorage
// * Handles auto fetching previous abilities if already logged in user
// ? You can update this if you store user abilities to more secure place
// ! Anyone can update localStorage so be careful and please update this
//const userData = JSON.parse(localStorage.getItem('auth'))
//const existingAbility = userData ? userData.ability : null
let existingAbility = []

try {
    const userdata = JSON.parse(localStorage.getItem('auth'))
   
    if (userdata && userdata.role && userdata.role === 'superadmin') {
        existingAbility = [{ action: 'manage', subject: 'all' }]
    } else {
        existingAbility = [{ action: 'manage', subject: 'all' }]
    }
} catch {
    existingAbility = [{ action: 'manage', subject: 'all' }]
}

export default new Ability(existingAbility || initialAbility)
