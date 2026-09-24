// import React, { useEffect, useState } from 'react'
// import { useParams, useHistory } from 'react-router-dom'
// import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
// import { Row, Col, Card, CardBody, Table, Spinner, Button } from 'reactstrap'
// import { ArrowLeft } from 'react-feather'
// import { db } from '../../../../configs/firebaseConfig'
// import Config from '@src/configs/config.json'

// const ViewRestaurant = () => {
//   const { id } = useParams()
//   const history = useHistory()
//   const [restaurant, setRestaurant] = useState(null)
//   const [transactions, setTransactions] = useState([])
//   const [loading, setLoading] = useState(true)

//   // Fetch restaurant details
//   const fetchRestaurant = async () => {
//     try {
//       const docRef = doc(db, 'restaurants', id)
//       const docSnap = await getDoc(docRef)
//       if (docSnap.exists()) {
//         setRestaurant({ id: docSnap.id, ...docSnap.data() })
//       } else {
//         setRestaurant(null)
//       }
//     } catch (err) {
//       console.error('Error fetching restaurant:', err)
//       setRestaurant(null)
//     }
//   }
// console.log('restaurant', restaurant)
//   // Fetch wallet transactions
//   const fetchTransactions = async () => {
//     try {
//       const walletRef = collection(db, 'walletTransaction')
//       const q = query(walletRef, where('toId', '==', id))
//       const querySnapshot = await getDocs(q)

//       const list = querySnapshot.docs
//         .map(doc => ({ id: doc.id, ...doc.data() }))
//         .sort((a, b) => {
//           const aTime = a.createdAt?.seconds || a.updatedAt?.seconds || 0
//           const bTime = b.createdAt?.seconds || b.updatedAt?.seconds || 0
//           return bTime - aTime
//         })
//       setTransactions(list)
//     } catch (error) {
//       console.error('Error fetching transactions:', error)
//       setTransactions([])
//     }
//   }

//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true)
//       await Promise.all([fetchRestaurant(), fetchTransactions()])
//       setLoading(false)
//     }
//     if (id) loadData()
//   }, [id])

//   const formatDate = (timestamp) => {
//     if (!timestamp?.toDate) return '-'
//     return timestamp.toDate().toLocaleDateString('en-GB', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric'
//     })
//   }

//   if (loading) {
//     return (
//       <div className='text-center mt-5'>
//         <Spinner color='primary' />
//       </div>
//     )
//   }

//   if (!restaurant) {
//     return (
//       <div className='text-center mt-5 text-muted'>
//         No restaurant found.
//       </div>
//     )
//   }

//   const latestTransaction = transactions[0]
//   const firstTransaction = transactions[transactions.length - 1]

//   return (
//     <div className='p-0'>
//       {/* Header */}
//       <div className='d-flex justify-content-between align-items-center mb-4'>
//         <h3 className='fw-bold mb-0'>View Details</h3>
//         <Button color='dark' onClick={() => history.goBack()}>
//           <ArrowLeft size={15} className='me-50' /> Back
//         </Button>
//       </div>

//       {/* Restaurant Details */}
//       <Card className='shadow-sm border-0 mb-4'>
//         <CardBody>
//           <h5 className='fw-bold mb-2 text-dark'>Restaurant Informations</h5>
//           <Row className='gy-3'>
//             <Col md='4' className='mb-1'>
//               <strong>Restaurant Name</strong>
//               <div>{restaurant.name || '-'}</div>
//             </Col>
//             <Col md='4' className='mb-1'>
//               <strong>Contact Person Name</strong>
//               <div>{restaurant.contactName || '-'}</div>
//             </Col>
//             <Col md='4' className='mb-1'>
//               <strong>Restaurant Email</strong>
//               <div>{restaurant.email || '-'}</div>
//             </Col>
//             <Col md='4' className='mb-1'>
//               <strong>Phone Number</strong>
//               <div>{restaurant.contactNumber || '-'}</div>
//             </Col>

//             <Col md='4' className='mb-1'>
//               <strong>Currency</strong>
//               <div>{restaurant.currency?.symbol || '-'}</div>
//             </Col>
//             <Col md='4' className='mb-1'>
//               <strong>Restaurant Code</strong>
//               <div>{restaurant.restaurantCode || '-'}</div>
//             </Col>
//             <Col md='4' className='mb-1'>
//               <strong>Wallet Balance</strong>
//               <div>
//                 {restaurant.walletBalance !== undefined ? `${restaurant.currency?.symbol || ''} ${restaurant.walletBalance.toFixed(2)}`  : '-'}
//               </div>
//             </Col>
//             <Col md='4' className='mb-1'>
//               <strong>Address</strong>
//               <div>{restaurant.address || '-'}</div>
//             </Col>

//             <Col md='4' className='mb-1'>
//               <strong>Restaurant Logo</strong>
//               <div>
//                 {restaurant.logo ? (
//                   <img
//                     src={`${Config.MEDIA_URL}${restaurant.logo}?alt=media`}
//                     alt='Logo'
//                     style={{ width: '100px' }}
//                   />
//                 ) : (
//                   '-'
//                 )}
//               </div>
//             </Col>
//           </Row>
//         </CardBody>
//       </Card>

//       {/* Transactions Summary */}
//       <Card className='shadow-sm border-0 mb-4'>
//         <CardBody>
//           <h5 className='fw-bold mb-2 text-dark'>Transaction Summary</h5>
//           <Row>
//             <Col md='3'>
//   <strong>From</strong>
//   <div className='text-capitalize'>{latestTransaction?.from || '-'}</div>
// </Col>
// <Col md='3'>
//   <strong>To</strong>
//   <div className='text-capitalize'>{latestTransaction?.toName || restaurant.name}</div>
// </Col>

//             <Col md='3'>
//               <strong>First Transaction</strong>
//               <div>{formatDate(firstTransaction?.createdAt || firstTransaction?.updatedAt)}</div>
//             </Col>
//             <Col md='3'>
//               <strong>Last Transaction</strong>
//               <div>{formatDate(latestTransaction?.createdAt || latestTransaction?.updatedAt)}</div>
//             </Col>
//           </Row>
//         </CardBody>
//       </Card>

//       {/* Transactions History Table */}
//       <h5 className='fw-bold mb-2 text-dark'>Transactions History</h5>
//       <Card className='shadow-sm border-0'>
//         <CardBody>
//           {transactions.length === 0 ? (
//             <div className='text-center text-muted'>No transactions found.</div>
//           ) : (
//             <Table bordered responsive hover className='mb-0 align-middle'>
//               <thead className='table-light'>
//                 <tr>
//                   <th>#</th>
//                   <th>Date</th>
//                   <th>Type</th>
//                   <th>Amount</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {transactions.map((row, index) => {
//                   const formattedDate = formatDate(row.createdAt || row.updatedAt)
//                   return (
//                     <tr key={row.id}>
//                       <td>{index + 1}</td>
//                       <td>{formattedDate}</td>
//                       <td className='text-capitalize'>{row.type || 'Added'}</td>
//                       <td style={{ color: 'green', fontWeight: 'bold' }}>
//                         {row.currency?.symbol || ''}{row.amount?.toFixed(2)}
//                       </td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </Table>
//           )}
//         </CardBody>
//       </Card>
//     </div>
//   )
// }

// export default ViewRestaurant

import React, { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { Row, Col, Card, CardBody, Table, Spinner, Button } from 'reactstrap'
import { ArrowLeft } from 'react-feather'
import { db } from '../../../../configs/firebaseConfig'
import Config from '@src/configs/config.json'

const ViewRestaurant = () => {
  const { id } = useParams()
  const history = useHistory()
  const [restaurant, setRestaurant] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch restaurant details
  const fetchRestaurant = async () => {
    try {
      const docRef = doc(db, 'restaurants', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setRestaurant({ id: docSnap.id, ...docSnap.data() })
      } else {
        setRestaurant(null)
      }
    } catch (err) {
      console.error('Error fetching restaurant:', err)
      setRestaurant(null)
    }
  }

  // Fetch wallet transactions
  const fetchTransactions = async () => {
    try {
      const walletRef = collection(db, 'walletTransaction')
      const q = query(walletRef, where('toId', '==', id))
      const querySnapshot = await getDocs(q)

      const list = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || a.updatedAt?.seconds || 0
          const bTime = b.createdAt?.seconds || b.updatedAt?.seconds || 0
          return bTime - aTime
        })
      setTransactions(list)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchRestaurant(), fetchTransactions()])
      setLoading(false)
    }
    if (id) loadData()
  }, [id])

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '-'
    return timestamp.toDate().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className='text-center mt-5'>
        <Spinner color='primary' />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className='text-center mt-5 text-muted'>
        No restaurant found.
      </div>
    )
  }

  const latestTransaction = transactions[0]
  const firstTransaction = transactions[transactions.length - 1]
  const isRestaurant = restaurant?.isRestaurant
  const entityLabel = isRestaurant ? 'Restaurant' : 'Partner'

  return (
    <div className='p-0'>
      {/* Header */}
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h3 className='fw-bold mb-0'>View {entityLabel} Details</h3>
        <Button color='dark' onClick={() => history.goBack()}>
          <ArrowLeft size={15} className='me-50' /> Back
        </Button>
      </div>

      {/* Restaurant Details */}
      <Card className='shadow-sm border-0 mb-4'>
        <CardBody>
          <h5 className='fw-bold mb-2 text-dark'>{entityLabel} Informations</h5>
          <Row className='gy-3'>
            <Col md='4' className='mb-1'>
              <strong>{entityLabel} Name</strong>
              <div>{restaurant.name || '-'}</div>
            </Col>
            {isRestaurant && (
              <Col md='4' className='mb-1'>
                <strong>Contact Person Name</strong>
                <div>{restaurant.contactName || '-'}</div>
              </Col>
            )}
            <Col md='4' className='mb-1'>
              <strong>{entityLabel} Email</strong>
              <div>{restaurant.email || '-'}</div>
            </Col>
            <Col md='4' className='mb-1'>
              <strong>Phone Number</strong>
              <div>{restaurant.contactNumber || '-'}</div>
            </Col>

            <Col md='4' className='mb-1'>
              <strong>Currency</strong>
              <div>{restaurant.currency?.symbol || '-'}</div>
            </Col>
            <Col md='4' className='mb-1'>
              <strong>{entityLabel} Code</strong>
              <div>{restaurant.restaurantCode || '-'}</div>
            </Col>
            <Col md='4' className='mb-1'>
              <strong>Wallet Balance</strong>
              <div>
                {restaurant.walletBalance !== undefined ? `${restaurant.currency?.symbol || ''} ${restaurant.walletBalance.toFixed(2)}` : '-'}
              </div>
            </Col>
            <Col md='4' className='mb-1'>
              <strong>Address</strong>
              <div>{restaurant.address || '-'}</div>
            </Col>

            <Col md='4' className='mb-1'>
              <strong>{entityLabel} Logo</strong>
              <div>
                {restaurant.logo ? (
                  <img
                    src={`${Config.MEDIA_URL}${restaurant.logo}?alt=media`}
                    alt='Logo'
                    style={{ width: '100px' }}
                  />
                ) : (
                  '-'
                )}
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Transactions Summary */}
      {/* <Card className='shadow-sm border-0 mb-4'>
        <CardBody>
          <h5 className='fw-bold mb-2 text-dark'>Transaction Summary</h5>
          <Row>
            <Col md='3'>
              <strong>From</strong>
              <div className='text-capitalize'>{latestTransaction?.from || '-'}</div>
            </Col>
            <Col md='3'>
              <strong>To</strong>
              <div className='text-capitalize'>{latestTransaction?.toName || restaurant.name}</div>
            </Col>
            <Col md='3'>
              <strong>First Transaction</strong>
              <div>{formatDate(firstTransaction?.createdAt || firstTransaction?.updatedAt)}</div>
            </Col>
            <Col md='3'>
              <strong>Last Transaction</strong>
              <div>{formatDate(latestTransaction?.createdAt || latestTransaction?.updatedAt)}</div>
            </Col>
          </Row>
        </CardBody>
      </Card> */}

      {/* Transactions History Table */}
      {/* <h5 className='fw-bold mb-2 text-dark'>Transactions History</h5>
      <Card className='shadow-sm border-0'>
        <CardBody>
          {transactions.length === 0 ? (
            <div className='text-center text-muted'>No transactions found.</div>
          ) : (
            <Table bordered responsive hover className='mb-0 align-middle'>
              <thead className='table-light'>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((row, index) => {
                  const formattedDate = formatDate(row.createdAt || row.updatedAt)
                  return (
                    <tr key={row.id}>
                      <td>{index + 1}</td>
                      <td>{formattedDate}</td>
                      <td className='text-capitalize'>{row.type || 'Added'}</td>
                      <td style={{ color: 'green', fontWeight: 'bold' }}>
                        {row.currency?.symbol || ''}{row.amount?.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card> */}
       <h5 className='fw-bold mb-2 text-dark'>Transactions History</h5>
<Card className='shadow-sm border-0'>
  <CardBody>
    {transactions.length === 0 ? (
      <div className='text-center text-muted'>No transactions found.</div>
    ) : (
      <Table bordered responsive hover className='mb-0 align-middle'>
        <thead className='table-light'>
          <tr>
            <th>S.No</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Transferred From</th>
            <th>Transaction Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((row, index) => {
            const formattedDate = formatDate(row.createdAt || row.updatedAt)
            return (
              <tr key={row.id}>
                <td>{index + 1}</td>
                <td style={{ color: 'green', fontWeight: 'bold' }}>
                  {row.currency?.symbol || ''}{row.amount?.toFixed(2)}
                </td>
                <td className='text-capitalize'>Credited</td>
                <td className='text-capitalize'>{row.from || '-'}</td>
                <td>{formattedDate}</td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    )}
  </CardBody>
</Card>

    </div>
  )
}

export default ViewRestaurant
