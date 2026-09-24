import { Fragment, useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Spinner } from 'reactstrap'
import { useForm } from 'react-hook-form'
import classnames from 'classnames'
import InputPasswordToggle from '@components/input-password-toggle'
import { OpenNotification } from '@src/views/components/Helper'
import CryptoJS from "crypto-js"
import { collection, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../configs/firebaseConfig'

const ResetPasswordModal = ({ resetPasswordModal, setResetPasswordModal, editInfo }) => {
    const { register, handleSubmit, errors, watch } = useForm()
    const [submitting, setSubmitting] = useState(false)

    const onSubmit = async (data) => {
        setSubmitting(true)

        try {
            if (!editInfo) {
                OpenNotification('error', 'Oops!', 'No restaurant selected to reset password.')
                return
            }

            const hashedPassword = CryptoJS.MD5(data.password).toString()
            const collectionRef = collection(db, 'restaurants')
            const docRef = doc(collectionRef, editInfo.id)

            await updateDoc(docRef, {
                password: hashedPassword
            })

            OpenNotification('success', 'Success', 'Password reset successfully!')
            setResetPasswordModal(false)
        } catch (error) {
            console.error('Failed to reset password:', error)
            OpenNotification('error', 'Oops!', 'Failed to reset password')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Fragment>
            <Modal isOpen={resetPasswordModal} toggle={() => setResetPasswordModal(false)} size="md">
                <ModalHeader toggle={() => setResetPasswordModal(false)}>Reset Password</ModalHeader>
                <ModalBody>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <FormGroup>
                            <Label for="password">New Password <span className="text-danger">*</span></Label>
                            <InputPasswordToggle
                                id="password"
                                name="password"
                                classNames="input-group-merge"
                                innerRef={register({ required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                                className={classnames({ 'is-invalid': errors.password })}
                            />
                            {errors.password && <small className="text-danger">{errors.password.message}</small>}
                        </FormGroup>

                        <FormGroup>
                            <Label for="confirmPassword">Confirm Password <span className="text-danger">*</span></Label>
                            <InputPasswordToggle
                                id="confirmPassword"
                                name="confirmPassword"
                                classNames="input-group-merge"
                                innerRef={register({
                                    required: 'Confirm password is required',
                                    validate: value => value === watch('password') || 'Passwords do not match'
                                })}
                                className={classnames({ 'is-invalid': errors.confirmPassword })}
                            />
                            {errors.confirmPassword && <small className="text-danger">{errors.confirmPassword.message}</small>}
                        </FormGroup>

                        <ModalFooter>
                            <Button type="submit" color="primary" disabled={submitting}>
                                {submitting ? <><Spinner size="sm" color="white" /></> : 'Submit'}
                            </Button>
                            <Button color="secondary" onClick={() => setResetPasswordModal(false)}>Cancel</Button>
                        </ModalFooter>
                    </Form>
                </ModalBody>
            </Modal>
        </Fragment>
    )
}

export default ResetPasswordModal
