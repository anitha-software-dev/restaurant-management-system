import React, { useState } from 'react'
import imageOne from '@src/assets/images/reviews/image-1.png'
import imageTwo from '@src/assets/images/reviews/image-2.jpg'
import imageThree from '@src/assets/images/reviews/image-3.jpg'
import Breadcrumbs from '@components/breadcrumbs'

import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    CardText,
    Button,
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalHeader,
    ModalBody,
    Form,
    FormGroup,
    Label,
    Input,
    ModalFooter
} from 'reactstrap'
import { useForm } from 'react-hook-form'

const Reviews = () => {

    const { handleSubmit } = useForm()
    const [replyModal, setReplyModal] = useState(false)
    const [reviews, setReviews] = useState([
        {
            id: 1,
            name: 'James Sukardi',
            country: 'USA',
            count: '48 followers, 68 reviews',
            review: 'We recently had dinner with friends at Dimas Can Zheng and we all walked away with a great experience. Good food, pleasant environment, personal attention through all the evening. thanks to the team and we will back!',
            rating: 3,
            date: '25/05/2023',
            image: imageThree
        },
        {
            id: 2,
            name: 'James Sitepu',
            country: 'USA',
            count: '45 followers, 68 reviews',
            review: 'We recently had dinner with friends at Dimas Can Zheng and we all walked away with a great experience. Good food, pleasant environment, personal attention through all the evening. thanks to the team and we will back!',
            rating: 4,
            date: '25/05/2023',
            image: imageTwo
        },
        {
            id: 3,
            name: 'Elijah James',
            country: 'Australia',
            count: '55 followers, 39 reviews',
            review: 'We recently had dinner with friends at Dimas Can Zheng and we all walked away with a great experience. Good food, pleasant environment, personal attention through all the evening. thanks to the team and we will back!',
            rating: 5,
            date: '25/05/2023',
            image: imageThree
        }
    ])

    const [dropdownOpen, setDropdownOpen] = useState(null)

    const toggleDropdown = (id) => {
        setDropdownOpen(dropdownOpen === id ? null : id)
    }

    const handleReply = () => {
        setReplyModal(!replyModal)
    }

    return (
        <Container>
            <Breadcrumbs breadCrumbTitle='Manage Reviews' breadCrumbParent='Reviews' breadCrumbActive='List' />
            <Row>
                {reviews.map((review) => (
                    <Card key={review.id} className="mb-3 w-100">
                        <CardBody>
                            <Row>

                                <Col md="4" className="d-flex align-items-start pt-2">
                                    <img
                                        src={review.image}
                                        alt={`${review.name}`}
                                        className="img-fluid "
                                        style={{ width: '80px', height: '80px', marginRight: '15px', borderRadius: '10px' }}
                                    />
                                    <div>
                                        <h5>{review.name}</h5>
                                        <p className="mb-1 " style={{ fontWeight: 'bold', color: '#000' }}>{review.country}</p>

                                        <p className="mb-0">{review.count}</p>
                                    </div>
                                </Col>

                                <Col md="8">
                                    <div className="d-flex justify-content-between align-items-center pt-2  ">
                                        <div>
                                            <span className="text-warning" style={{ fontSize: 20 }}>
                                                {'★'.repeat(review.rating)}
                                                {'☆'.repeat(5 - review.rating)}
                                            </span>
                                            <small className="ms-3 ml-2">{review.date}</small>
                                        </div>

                                        <Dropdown className='' isOpen={dropdownOpen === review.id} toggle={() => toggleDropdown(review.id)}>
                                            <DropdownToggle tag="button" className="btn btn-link p-0 text-dark">
                                                <i className="bi bi-three-dots"></i>
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <DropdownItem>Report</DropdownItem>
                                                <DropdownItem>Edit</DropdownItem>
                                                <DropdownItem>Delete</DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                    <CardText className="mt-2 mr-5 pr-3">{review.review}</CardText>

                                    <div className="mt-2 d-flex justify-content-between pb-1">
                                        <div>
                                            <Button color="primary" size="md" className="me-2 mr-2">
                                                Public Comment
                                            </Button>
                                            <Button color="primary" size="md">
                                                Direct Message
                                            </Button>
                                        </div>

                                        <div>
                                            <Button onClick={() => setReplyModal(!replyModal)} color="success" size="md">
                                                Reply
                                            </Button>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                ))}
            </Row>

            {/* Reply Message */}
            <Modal isOpen={replyModal} toggle={() => setReplyModal(!replyModal)} size={'sm'}>
                <ModalHeader toggle={() => setReplyModal(!replyModal)}> Reply Message</ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSubmit(handleReply)}>
                        <FormGroup>
                            <Label for='name'>Reply Message</Label>
                            <Input
                                id='name'
                                type='textarea'
                                name='name'
                                placeholder='Enter Reply Message'
                            />
                        </FormGroup>

                        <ModalFooter>
                            <Button color='primary'>
                                Save
                            </Button>
                            <Button color='secondary' onClick={() => setReplyModal(!replyModal)}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </Form>
                </ModalBody>
            </Modal>
        </Container>
    )
}

export default Reviews
