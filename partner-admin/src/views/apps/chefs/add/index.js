import { Fragment, useEffect, useState } from 'react'
import { Row, Col, CardText, Card, Button } from 'reactstrap'
import CollapseDefault from './CollapseDefault'
import {
  defaultCollapse
} from './CollapseSourceCode'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../../configs/firebaseConfig'

const Collapse = () => {

  const { id } = useParams()
  const [chefDetails, setChefDetails] = useState({ name: "", chefCode: "" })

  useEffect(() => {
    const getChefDetails = async () => {
      try {
        if (!id) return
        const chefRef = doc(db, "chefs", id)
        const chefSnap = await getDoc(chefRef)

        if (chefSnap.exists()) {
          const data = chefSnap.data()
          setChefDetails({
            name: data.name || "",
            chefCode: data.chefCode || ""
          })
        }
      } catch (error) {
        console.error("Error fetching chef details:", error)
      }
    }

    getChefDetails()
  }, [id])
  console.log('chefDetails', chefDetails)
  return (
    <Fragment>
      <CollapseDefault />
    </Fragment>
  )
}
export default Collapse
