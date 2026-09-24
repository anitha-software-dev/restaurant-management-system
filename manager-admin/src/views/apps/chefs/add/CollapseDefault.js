import { useEffect, useState } from 'react'
import { Row, Col, CustomInput, Button, Card } from 'reactstrap'
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  Timestamp,
  getDoc
} from 'firebase/firestore'
import { db } from '../../../../configs/firebaseConfig'
import { OpenNotification } from '@src/views/components/Helper'
import { useHistory, useParams, Link } from 'react-router-dom'
import AppCollapse from '@components/app-collapse'
import { defaultCollapse } from './CollapseSourceCode'

const CollapseDefault = () => {
  const [menusList, setMenusList] = useState([])
  const [itemsList, setItemsList] = useState([])
  const [selectedMenus, setSelectedMenus] = useState({})
  const [selectedItems, setSelectedItems] = useState({})
  const [chefDetails, setChefDetails] = useState({ name: '', chefCode: '' })

  const history = useHistory()
  const { id } = useParams() // chef doc id
  const token = localStorage.getItem('token')

  // Fetch menus
  const getMenusList = async () => {
    try {
      if (!token) {
        OpenNotification('error', 'Error', 'Please login again!')
        history.push('/login')
        return
      }
      const collectionRef = collection(db, 'menus')
      const baseQuery = query(collectionRef, where('restaurantId', '==', token))
      const querySnapshot = await getDocs(baseQuery)
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }))
      setMenusList(docs || [])
    } catch (error) {
      console.error('Error fetching menus:', error)
    }
  }

  // Fetch items
  const getItemsList = async () => {
    try {
      if (!token) {
        OpenNotification('error', 'Error', 'Please login again!')
        history.push('/login')
        return
      }
      const collectionRef = collection(db, 'items')
      const baseQuery = query(collectionRef, where('restaurantId', '==', token))
      const querySnapshot = await getDocs(baseQuery)
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }))
      setItemsList(docs || [])
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  // Fetch chef details + prefill selections
  const getChefDetails = async () => {
    try {
      if (!id) return
      const chefRef = doc(db, 'chefs', id)
      const chefSnap = await getDoc(chefRef)
      if (chefSnap.exists()) {
        const data = chefSnap.data()
        setChefDetails({
          name: data.name || '',
          chefCode: data.chefCode || ''
        })

        if (Array.isArray(data.expert)) {
          // Prefill selectedItems from flat array
          const items = {}
          data.expert.forEach(itemId => {
            items[itemId] = true
          })
          setSelectedItems(items)
          // No need to set selectedMenus here; useEffect will handle it
        }
      }
    } catch (error) {
      console.error('Error fetching chef details:', error)
    }
  }

  useEffect(() => {
    getMenusList()
    getItemsList()
    getChefDetails()
  }, [])

  // Recalculate selectedMenus when itemsList, menusList, or selectedItems change
  useEffect(() => {
    const menus = {}
    menusList.forEach(menu => {
      const relatedItems = itemsList.filter(item => item.type === menu.id)
      if (
        relatedItems.length > 0 &&
        relatedItems.every(item => selectedItems[item.id])
      ) {
        menus[menu.id] = true
      } else {
        menus[menu.id] = false
      }
    })
    setSelectedMenus(menus)
  }, [menusList, itemsList, selectedItems])

  // Handle menu toggle
  const handleMenuCheckbox = (menuId, checked, relatedItems) => {
    // Toggle all related items
    const updatedItems = { ...selectedItems }
    relatedItems.forEach(item => {
      updatedItems[item.id] = checked
    })
    setSelectedItems(updatedItems)
    // No need to track selectedMenus anymore for expert
    setSelectedMenus(prev => ({ ...prev, [menuId]: checked }))
  }

  // Handle item toggle
  const handleItemCheckbox = (menuId, itemId, checked, relatedItems) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: checked }))
    const allChecked = relatedItems.every(item => checked || selectedItems[item.id])
    setSelectedMenus(prev => ({ ...prev, [menuId]: allChecked }))
  }

  // Build expert structure
  const buildExpertData = () => {
    // Return a flat array of selected item IDs
    return Object.keys(selectedItems).filter(itemId => selectedItems[itemId])
  }

  // Save handler
  const handleSave = async () => {
    try {
      if (!id) {
        OpenNotification('error', 'Error', 'Chef ID not found!')
        return
      }
      const chefRef = doc(db, 'chefs', id)
      const expertData = buildExpertData()
      await updateDoc(chefRef, {
        expertise: expertData,
        updatedAt: Timestamp.now()
      })
      OpenNotification('success', 'Success', 'Expertise updated successfully!')
      history.push('/chefs')
    } catch (error) {
      console.error('Error saving selections:', error)
      OpenNotification('error', 'Error', 'Failed to save selections')
    }
  }

  // Accordion data
  const data = (menusList || []).map(menu => {
    const relatedItems = (itemsList || []).filter(item => item.type === menu.id)
    return {
      title: (
        <div className="d-flex align-items-center p-1">
          <CustomInput
            type="checkbox"
            id={`menu-${menu.id}`}
            checked={!!selectedMenus[menu.id]}
            onChange={e => handleMenuCheckbox(menu.id, e.target.checked, relatedItems)}
            style={{ accentColor: '#f9791d', cursor: 'pointer' }}
            className="mr-1"
          />
          <span>{menu.name}</span>
        </div>
      ),
      content: (
        <Row className="px-4">
          {relatedItems.map(item => (
            <Col md="4" key={item.id} className="mb-1">
              <CustomInput
                type="checkbox"
                id={`item-${item.id}`}
                checked={!!selectedItems[item.id]}
                onChange={e => handleItemCheckbox(menu.id, item.id, e.target.checked, relatedItems)
                }
                style={{ accentColor: '#f9791d', cursor: 'pointer' }}
                label={item.name}
              />
            </Col>
          ))}
        </Row>
      )
    }
  })

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="mb-0">Chef's Details</h2>

        <div className="text-right">
          <Button className="mr-1" color="primary" onClick={handleSave}>
            Save
          </Button>
          <Link to="/chefs">
            <Button outline color="secondary">
              Cancel
            </Button>
          </Link>
        </div>
      </div>

      <Row>
        <Col md="6">
          <Card className="p-2">
            <div style={{ fontSize: '16px' }}>
              Chef Name: <strong>{chefDetails?.name || '-'}</strong>
            </div>
          </Card>
        </Col>
        <Col md="6">
          <Card className="p-2">
            <div style={{ fontSize: '16px' }}>
              Chef Code: <strong>{chefDetails?.chefCode || '-'}</strong>
            </div>
          </Card>
        </Col>
      </Row>

      <h3 className="mb-2">Expert In</h3>
      <Row>
        <Col sm="12">
          <Card title="Collapse Default" code={defaultCollapse}>
            <AppCollapse data={data} />

            <div className="pl-2 py-2 border-top">
              <Button className="mr-1" color="primary" onClick={handleSave}>
                Save
              </Button>
              <Link to="/chefs">
                <Button outline color="secondary">
                  Cancel
                </Button>
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default CollapseDefault
