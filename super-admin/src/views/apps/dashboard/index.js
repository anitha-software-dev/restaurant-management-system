import React from 'react'
import {
    Container,
    Row,
    Col,
    Card,
    CardBody} from 'reactstrap'
import Breadcrumbs from '@components/breadcrumbs'

const Dashboard = () => {
   
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
        </Container >
    )
}

export default Dashboard
