
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

  return (
    <div className='p-3 animate-fade-in'>
      {/* Header */}
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h3 className='fw-bolder mb-0' style={{ color: '#557EE6' }}>Transaction History</h3>
        <Button color='secondary' className='shadow-sm' onClick={() => history.goBack()}>
          <ArrowLeft size={16} className='me-50' /> Back
        </Button>
      </div>

      {loading ? (
        <div className='d-flex justify-content-center align-items-center mt-5' style={{ minHeight: '300px' }}>
          <Spinner color='primary' type='grow' style={{ width: '3rem', height: '3rem' }} />
        </div>
      ) : (
        <>
          {/* Table */}
          <Card className='border-0 mt-2 card'>
            <CardBody className='p-0'>
              {transactions.length === 0 ? (
                <div className='text-center text-muted py-5 mt-2 d-flex flex-column align-items-center'>
                  <div className='mb-3 p-3 rounded-circle' style={{ background: 'rgba(85, 126, 230, 0.1)' }}>
                    <ArrowLeft size={30} style={{ color: '#557EE6' }} />
                  </div>
                  <h5 className='fw-bold'>No Transactions Found!</h5>
                  <p className='text-muted small'>There are currently no transactions for this account.</p>
                </div>
              ) : (
                <div className='table-responsive p-2'>
                  <Table borderless hover className='mb-0 align-middle'>
                    <thead className='table-light'>
                      <tr>
                        <th className='ps-4'>S.No</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th className='text-end pe-4'>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((row, index) => {
                        const formattedDate = formatDate(row.createdAt || row.updatedAt)
                        return (
                          <tr key={row.id}>
                            <td className='ps-4 text-muted fw-bold'>#{index + 1}</td>
                            <td>
                              <span className='fw-bolder text-dark'>{formattedDate}</span>
                            </td>
                            <td>
                              <span className='badge badge-light-success text-capitalize px-3 py-2 rounded-pill shadow-sm'>
                                Added
                              </span>
                            </td>
                            <td className='text-end pe-4 fs-5' style={{ color: '#10b981', fontWeight: '800' }}>
                              + {row.currency?.symbol || ''}{row.amount?.toFixed(2)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}

export default Transactions
