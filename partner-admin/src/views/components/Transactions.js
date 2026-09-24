// import React, { useEffect, useState } from 'react'
// import { useParams, useHistory } from 'react-router-dom'
// import { collection, getDocs, query, where } from 'firebase/firestore'
// import { Button, Table, Spinner, Card, CardBody } from 'reactstrap'
// import { ArrowLeft } from 'react-feather'
// import { db } from '../../configs/firebaseConfig'

// const Transactions = () => {
//   const { id } = useParams()
//   const history = useHistory()

//   const [transactions, setTransactions] = useState([])
//   const [loading, setLoading] = useState(true)

//   const fetchTransactions = async () => {
//     try {
//       setLoading(true)
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
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     if (id) fetchTransactions()
//   }, [id])

//   const formatDate = (timestamp) => {
//     if (!timestamp?.toDate) return '-'
//     return timestamp.toDate().toLocaleDateString('en-GB', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric'
//     })
//   }

//   const latestTransaction = transactions[0]
//   const firstTransaction = transactions[transactions.length - 1]

//   return (
//     <div className='p-3'>
//       {/* Header */}
//       <div className='d-flex justify-content-between align-items-center mb-3'>
//         <h4 className='fw-bold mb-0'>Transaction Details</h4>
//         <Button color='secondary' onClick={() => history.goBack()}>
//           <ArrowLeft size={15} className='me-50' /> Back
//         </Button>
//       </div>

//       {loading ? (
//         <div className='text-center mt-4'>
//           <Spinner color='primary' />
//         </div>
//       ) : transactions.length === 0 ? (
//         <div className='text-center mt-4 text-muted'>
//           No transactions found.
//         </div>
//       ) : (
//         <>
//           {/* Inline Details */}
//           <Card className='shadow-sm border-0 mb-4'>
//             <CardBody>
//               <div className='d-flex flex-column gap-2'>
//                 <div className='d-flex'>
//                   <div style={{ width: 180, color: '#6c757d' }}>From</div>
//                   <div className='text-capitalize fw-semibold'>: {latestTransaction?.from || '-'}</div>
//                 </div>
//                 <div className='d-flex'>
//                   <div style={{ width: 180, color: '#6c757d' }}>To</div>
//                   <div className='text-capitalize fw-semibold'>: {latestTransaction?.toName || '-'}</div>
//                 </div>
//                 <div className='d-flex'>
//                   <div style={{ width: 180, color: '#6c757d' }}>First transaction</div>
//                   <div className='fw-semibold'>: {formatDate(firstTransaction?.createdAt || firstTransaction?.updatedAt)}</div>
//                 </div>
//                 <div className='d-flex'>
//                   <div style={{ width: 180, color: '#6c757d' }}>Last transaction</div>
//                   <div className='fw-semibold'>: {formatDate(latestTransaction?.createdAt || latestTransaction?.updatedAt)}</div>
//                 </div>
//               </div>
//             </CardBody>
//           </Card>

//           {/* Table */}
//           <h5 className='fw-bold mb-3'>Transactions History</h5>
//           <Card className='shadow-sm border-0'>
//             <CardBody>
//               <Table bordered responsive hover className='mb-0 align-middle'>
//                 <thead className='table-light'>
//                   <tr>
//                     <th>#</th>
//                     <th>Date</th>
//                     <th>Type</th>
//                     <th>Amount</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {transactions.map((row, index) => {
//                     const formattedDate = formatDate(row.createdAt || row.updatedAt)
//                     return (
//                       <tr key={row.id}>
//                         <td>{index + 1}</td>
//                         <td>{formattedDate}</td>
//                         <td className='text-capitalize'>{ 'Added'}</td>
//                         <td style={{ color: 'green', fontWeight: 'bold' }}>
//                           {row.currency?.symbol || ''}{row.amount?.toFixed(2)}
//                         </td>
//                       </tr>
//                     )
//                   })}
//                 </tbody>
//               </Table>
//             </CardBody>
//           </Card>
//         </>
//       )}
//     </div>
//   )
// }

// export default Transactions

import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Button, Table, Spinner, Card, CardBody } from 'reactstrap'
import { ArrowLeft } from 'react-feather'
import { db } from '../../configs/firebaseConfig'

const Transactions = () => {
  const history = useHistory()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      // ✅ Get user ID (token) from localStorage instead of URL params
      const token = localStorage.getItem('token')

      if (!token) {
        console.warn('No token found in localStorage.')
        setTransactions([])
        setLoading(false)
        return
      }

      const walletRef = collection(db, 'walletTransaction')
      const q = query(walletRef, where('toId', '==', token))
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '-'
    return timestamp.toDate().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const latestTransaction = transactions[0]
  const firstTransaction = transactions[transactions.length - 1]

  return (
    <div className='p-3'>
      {/* Header */}
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h4 className='fw-bold mb-0'>Transaction Details</h4>
        <Button color='secondary' onClick={() => history.goBack()}>
          <ArrowLeft size={15} className='me-50' /> Back
        </Button>
      </div>

      {loading ? (
        <div className='text-center mt-4'>
          <Spinner color='primary' />
        </div>
      ) : transactions.length === 0 ? (
        <div className='text-center mt-4 text-muted'>
          No transactions found.
        </div>
      ) : (
        <>
          {/* Inline Details */}
          <Card className='shadow-sm border-0 mb-4'>
            <CardBody>
              <div className='d-flex flex-column gap-2'>
                <div className='d-flex'>
                  <div style={{ width: 180, color: '#6c757d' }}>From</div>
                  <div className='text-capitalize fw-semibold'>: {latestTransaction?.from || '-'}</div>
                </div>
                <div className='d-flex'>
                  <div style={{ width: 180, color: '#6c757d' }}>To</div>
                  <div className='text-capitalize fw-semibold'>: {latestTransaction?.toName || '-'}</div>
                </div>
                <div className='d-flex'>
                  <div style={{ width: 180, color: '#6c757d' }}>First transaction</div>
                  <div className='fw-semibold'>: {formatDate(firstTransaction?.createdAt || firstTransaction?.updatedAt)}</div>
                </div>
                <div className='d-flex'>
                  <div style={{ width: 180, color: '#6c757d' }}>Last transaction</div>
                  <div className='fw-semibold'>: {formatDate(latestTransaction?.createdAt || latestTransaction?.updatedAt)}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Table */}
          <h5 className='fw-bold mb-3'>Transactions History</h5>
          <Card className='shadow-sm border-0'>
            <CardBody>
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
                        <td className='text-capitalize'>Added</td>
                        <td style={{ color: 'green', fontWeight: 'bold' }}>
                          {row.currency?.symbol || ''}{row.amount?.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}

export default Transactions
