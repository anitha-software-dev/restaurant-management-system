import React, { useEffect, useState } from 'react'
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Progress,
    Button,
    ButtonGroup,
    ButtonToggle
} from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'

import { FaCoffee, FaDollarSign, FaClipboardList, FaUsers } from 'react-icons/fa'

import { Line, Bar } from 'react-chartjs-2'

import 'react-circular-progressbar/dist/styles.css'

import {
    Chart as ChartJS,
    LineElement,
    BarElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend
} from 'chart.js'
import { BiSolidCategory } from 'react-icons/bi'
import { collection, getDocs, query } from 'firebase/firestore'
import { db } from '../../../configs/firebaseConfig'

ChartJS.register(
    LineElement,
    BarElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend
)


const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
        {
            label: 'Revenue',
            data: [30, 50, 70, 40, 80, 60],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: '#000',
            borderWidth: 2,
            tension: 0.4
        }
    ]
}

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('Monthly')
    const [totalMenus, setTotalMenus] = useState(0)
    const [totalCategories, setTotalCategories] = useState(0)

    const getTotalList = async () => {

        try {
            const collectionRef = collection(db, 'categories')
            const baseQuery = query(collectionRef)
            const querySnapshot = await getDocs(baseQuery)
            setTotalCategories(querySnapshot.size)

            const menusRef = collection(db, 'menus')
            const menusQuery = query(menusRef)
            const menusSnapshot = await getDocs(menusQuery)
            setTotalMenus(menusSnapshot.size)
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {

        }
    }

    useEffect(() => {
        getTotalList()
    }, [])

    const data = [
        {
            title: 'MENUS',
            value: totalMenus,
            icon: <FaCoffee size={40} />
        },
        {
            title: 'REVENUE',
            value: 0,
            icon: <FaDollarSign size={40} />
        },
        {
            title: 'ORDERS',
            value: 0,
            icon: <FaClipboardList size={40} />
        },
        {
            title: 'CATEGORIES',
            value: totalCategories,
            icon: <BiSolidCategory size={40} />
        }
    ]

    const toggleTab = (tab) => {
        setActiveTab(tab)
    }

    return (
        <Container fluid>
            <Breadcrumbs breadCrumbTitle='Manage Dashboard' breadCrumbParent='Dashboard' />

            <Row>
                <Col md="12" className="my-2">
                    <Card>
                        <CardBody className="d-flex align-items-center justify-content-center">
                            <h3 className='pt-2 pb-2 mt-2'>Coming Soon...</h3>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* <Row>
                {data.map((item, idx) => (
                    <Col md="3" key={idx} className="mb-4">
                        <Card>
                            <CardBody className="d-flex align-items-center justify-content-between">

                                <div style={{
                                    marginRight: '15px',
                                    padding: '25px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f8f9fa',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'

                                }}>
                                    {item.icon}
                                </div>

                                <div className='mt-1'>
                                    <h3 className="text-dark m-0" style={{ fontSize: 40, fontWeight: 800 }}>{item.value}</h3>
                                    <CardTitle tag="p" className="mb-2" style={{ fontSize: 13 }}>{item.title}</CardTitle>

                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                ))}
            </Row> */}

            {/* <Row>

                <Col md="6" className="mb-4">
                    <Card style={{ padding: 30 }}>
                        <div>
                            <Row className='' style={{ paddingInline: 30 }}>
                                <div>
                                    <CardTitle tag="h5" className='text-dark'>Orders Summary</CardTitle>
                                    <p>Lorem ipsum dolor sit amet, consectetur</p>
                                </div>


                                <ButtonGroup style={{ justifyContent: 'space-around' }} className="mb-3 mt-2">
                                    <ButtonToggle
                                        color="secondary"

                                        active={activeTab === 'Monthly'}
                                        onClick={() => toggleTab('Monthly')}
                                    >
                                        Monthly
                                    </ButtonToggle>
                                    <ButtonToggle
                                        color="secondary"

                                        active={activeTab === 'Weekly'}
                                        onClick={() => toggleTab('Weekly')}
                                    >
                                        Weekly
                                    </ButtonToggle>
                                    <ButtonToggle
                                        color="secondary"

                                        active={activeTab === 'Today'}
                                        onClick={() => toggleTab('Today')}
                                    >
                                        Today
                                    </ButtonToggle>
                                </ButtonGroup>

                            </Row>

                            <div className='d-flex justify-content-between align-items-center mb-3' style={{ backgroundColor: '#f8f9fa', padding: 10 }}>
                                <h3 style={{ paddingInline: 40, paddingBlock: 10, backgroundColor: '#000', borderRadius: 10, color: '#fff' }}>25</h3>
                                <p className='mb-0' style={{ fontSize: 18 }}>New Orders</p>
                                <p className='mb-0' style={{ fontSize: 18 }}>Manage orders</p>
                            </div>


                            <Row>
                                <Col md="4" className="mb-4">
                                    <div className="d-flex align-items-center justify-content-center" style={{ height: '100px', border: '1px solid #dedede', borderRadius: 15 }}>
                                        <CardBody className="text-left">
                                            <h3 className="text-dark mt-2" style={{ fontSize: 35, fontWeight: 800 }}>25</h3>
                                            <CardTitle tag="p" className="mb-2" style={{ fontSize: 15 }}>On Delivery</CardTitle>
                                        </CardBody>
                                    </div>
                                </Col>
                                <Col md="4" className="mb-4">
                                    <div className="d-flex align-items-center justify-content-center" style={{ height: '100px', border: '1px solid #dedede', borderRadius: 15 }}>
                                        <CardBody className="text-left">
                                            <h3 className="text-dark m-0" style={{ fontSize: 35, fontWeight: 800 }}>60</h3>
                                            <CardTitle tag="p" className="mb-2" style={{ fontSize: 15 }}>Delivered</CardTitle>
                                        </CardBody>
                                    </div>
                                </Col>
                                <Col md="4" className="mb-4">
                                    <div className="d-flex align-items-center justify-content-center" style={{ height: '100px', border: '1px solid #dedede', borderRadius: 15 }}>
                                        <CardBody className="text-left">
                                            <h3 className="text-dark m-0" style={{ fontSize: 35, fontWeight: 800 }}>7</h3>
                                            <CardTitle tag="p" className="mb-2" style={{ fontSize: 15 }}>Canceled</CardTitle>
                                        </CardBody>
                                    </div>
                                </Col>
                            </Row>

                        </div>
                    </Card>
                </Col>

                <Col md="6" className="mb-4">
                    <Card style={{ padding: 30 }}>
                        <CardBody>
                            <CardTitle tag="h5" className='text-dark'>Revenue </CardTitle>
                            <p>Lorem Ipsum is simply dummy text of the printing</p>
                            <div className='d-flex justify-content-end my-3'>
                                <div >
                                    <p>Income</p>
                                    <p>$41,512k</p>
                                </div>

                                <div className='ml-3'>
                                    <p>Expense</p>
                                    <p>$41,512k</p>
                                </div>

                            </div>

                            <Line data={revenueData} />
                        </CardBody>
                    </Card>
                </Col>

            </Row> */}

        </Container >
    )
}

export default Dashboard
