// ** React Imports
import { Fragment, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { format } from "date-fns"

// ** Third Party Components
import {
  Card,
  CardBody,
  Button,
  CustomInput,
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  ModalFooter,
  FormGroup,
  Spinner,
  Badge,
  Label,
  Row,
  Col,
  Table
} from "reactstrap"
import { Timestamp, updateDoc, doc, getDoc } from "firebase/firestore"
import { useParams } from "react-router-dom"
import Breadcrumbs from "@components/breadcrumbs"
import { OpenNotification } from "@src/views/components/Helper"
import { db } from "../../../../configs/firebaseConfig"
import Config from "@src/configs/config.json"
import { Edit } from "react-feather"

// ** Styles
import "@styles/base/pages/app-invoice.scss"

const ViewOrder = () => {
  const { id } = useParams()
  const { register, errors, handleSubmit, trigger, setValue } = useForm()
  const [data, setData] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [orderStatus, setOrderStatus] = useState("")
  const [orderStatusModal, setOrderStatusModal] = useState(false)

  const getOrderDetail = async () => {
    try {
      const docRef = doc(db, "orders", id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const res = docSnap.data()

        const { password, ...rest } = res

        const createdAtTimestamp = res.createdAt
        const createdAtDate = createdAtTimestamp?.toDate?.() || new Date()
        const createdAtFormatted = format(createdAtDate, "dd/MM/yyyy hh:mm a")

        setData({
          ...rest,
          id: docSnap.id,
          createdAtDate,
          createdAtFormatted
        })
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error)
    }
  }

  useEffect(() => {
    if (id) {
      getOrderDetail()
    }
  }, [])

  const getOrderBadgeColor = (status) => {
    switch (status) {
      case 0:
        return "warning"
      case 1:
        return "success"
      case 2:
        return "info"
      case 3:
        return "danger"
      case 4:
        return "secondary"
      default:
        return ""
    }
  }

  const getOrderBadgeName = (status) => {
    switch (status) {
      case 0:
        return "PENDING"
      case 1:
        return "ACCEPTED"
      case 2:
        return "DELIVERED"
      case 3:
        return "CANCELLED"
      case 4:
        return "CLEARED"
      default:
        return "-"
    }
  }

  const handleOrderStatus = async (data) => {
    try {
      setSubmitting(true)
      const itemRef = doc(db, "orders", id)

      await updateDoc(itemRef, {
        orderStatus: Number(data.orderStatus),
        updatedAt: Timestamp.now()
      })
      setSubmitting(false)
      setOrderStatusModal(false)
      getOrderDetail()
      OpenNotification(
        "success",
        "Success!",
        "Order Status updated successfully"
      )
    } catch (error) {
      setSubmitting(false)
      console.error("Error updating order status:", error)
      OpenNotification("error", "Error", "Failed to update the order status.")
    }
  }

  return (
    <Fragment>
      <Breadcrumbs
        breadCrumbTitle="View Order Detail"
        breadCrumbParent="Order"
        breadCrumbActive="Detail"
      />
      <div className="invoice-preview-wrapper">
        <Row className="invoice-preview">
          <Col xl={12}>
            <Card
              style={{
                borderRadius: "16px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                border: "1px solid rgba(85, 126, 230, 0.1)"
              }}
            >
              <CardBody className="p-3">
                <Row>
                  {/* Left Column: Order Details */}
                  <Col md={8}>
                    <div
                      className="d-flex flex-wrap"
                      style={{
                        gap: "3rem",
                        rowGap: "1.5rem",
                        marginBottom: "1rem"
                      }}
                    >
                      <div className="d-flex flex-column">
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            marginBottom: "4px"
                          }}
                        >
                          ORDER ID
                        </span>
                        <strong
                          style={{
                            color: "#1e293b",
                            fontSize: "1.05rem",
                            fontWeight: 700
                          }}
                        >
                          {data?.transactionId || "-"}
                        </strong>
                      </div>
                      <div className="d-flex flex-column">
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            marginBottom: "4px"
                          }}
                        >
                          ORDER NUMBER
                        </span>
                        <strong
                          style={{
                            color: "#1e293b",
                            fontSize: "1.05rem",
                            fontWeight: 700
                          }}
                        >
                          {data?.orderNumber || "-"}
                        </strong>
                      </div>
                      <div className="d-flex flex-column">
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            marginBottom: "4px"
                          }}
                        >
                          ORDER DATE
                        </span>
                        <strong
                          style={{
                            color: "#1e293b",
                            fontSize: "1.05rem",
                            fontWeight: 700
                          }}
                        >
                          {data?.createdAtFormatted || "-"}
                        </strong>
                      </div>
                      <div className="d-flex flex-column">
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            marginBottom: "4px"
                          }}
                        >
                          ORDER FOR
                        </span>
                        <strong
                          style={{
                            color: "#1e293b",
                            fontSize: "1.05rem",
                            fontWeight: 700
                          }}
                        >{`${data?.qrType || "-"} - ${data?.qrNumber || "-"}`}</strong>
                      </div>
                      <div className="d-flex flex-column">
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            marginBottom: "4px"
                          }}
                        >
                          ORDER TYPE
                        </span>
                        <strong
                          style={{
                            color: "#1e293b",
                            fontSize: "1.05rem",
                            fontWeight: 700
                          }}
                        >
                          {data?.type || "-"}
                        </strong>
                      </div>
                    </div>
                  </Col>

                  {/* Right Column: Status Banner */}
                  <Col
                    md={4}
                    className="d-flex justify-content-md-end justify-content-start mt-2 mt-md-0"
                  >
                    <div
                      style={{
                        background: "rgba(248, 250, 252, 0.8)",
                        borderRadius: "12px",
                        padding: "1.25rem 2rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        border: "1px solid rgba(226, 232, 240, 0.8)",
                        minWidth: "220px",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
                      }}
                    >
                      <div className="d-flex align-items-center mb-1 w-100 justify-content-center">
                        <h6
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            color: "#475569",
                            letterSpacing: "0.5px",
                            fontSize: "0.85rem"
                          }}
                        >
                          ORDER STATUS
                        </h6>
                        <div
                          className="ml-50 cursor-pointer"
                          style={{
                            color: "#557EE6"
                          }}
                          onClick={() => {
                            setOrderStatus(data?.orderStatus)
                            setOrderStatusModal(!orderStatusModal)
                          }}
                        >
                          <Edit size={14} />
                        </div>
                      </div>
                      <Badge
                        color={`light-${getOrderBadgeColor(
                          data?.orderStatus
                        ).replace("light-", "")}`}
                        style={{
                          padding: "0.5rem 2rem",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          borderRadius: "4px",
                          width: "100%"
                        }}
                        className="text-center"
                      >
                        {getOrderBadgeName(data?.orderStatus)}
                      </Badge>
                    </div>
                  </Col>
                </Row>
              </CardBody>

              <Table
                responsive
                className="mb-0 border-0"
                style={{ borderCollapse: "separate", borderSpacing: "0" }}
              >
                <thead
                  style={{
                    background: "rgba(248, 250, 252, 0.9)",
                    borderTop: "1px solid rgba(226, 232, 240, 0.8)",
                    borderBottom: "1px solid rgba(226, 232, 240, 0.8)"
                  }}
                >
                  <tr>
                    <th
                      className="py-2 border-top-0 border-bottom-0"
                      style={{
                        color: "#557EE6",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        fontSize: "0.75rem"
                      }}
                    >
                      ITEM
                    </th>
                    <th
                      className="py-2 text-right border-top-0 border-bottom-0"
                      style={{
                        color: "#557EE6",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        fontSize: "0.75rem"
                      }}
                    >
                      RATE
                    </th>
                    <th
                      className="py-2 text-center border-top-0 border-bottom-0"
                      style={{
                        color: "#557EE6",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        fontSize: "0.75rem"
                      }}
                    >
                      QUANTITY
                    </th>
                    <th
                      className="py-2 text-right border-top-0 border-bottom-0"
                      style={{
                        color: "#557EE6",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        fontSize: "0.75rem"
                      }}
                    >
                      TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items || []).map((item, index) => {
                    const sideChoices = (item.additional_info || []).filter(
                      (info) => info.include_price
                    )
                    const sidePriceTotal = sideChoices.reduce(
                      (sum, info) => sum + (parseFloat(info.price) || 0),
                      0
                    )
                    const itemTotal =
                      (parseFloat(item.base_price) + sidePriceTotal) *
                      item.quantity

                    return (
                      <tr key={index}>
                        {/* Item column: Dish name + side choices with subheading */}
                        <td
                          className="py-3 align-top border-bottom-1"
                          style={{ borderColor: "rgba(226, 232, 240, 0.8)" }}
                        >
                          <div className="d-flex align-items-start">
                            <img
                              src={ item.images && item.images.length > 0 ? `${Config.MEDIA_URL}${item.images[0]}?alt=media` : "https://via.placeholder.com/72"}
                              alt={item.name}
                              style={{
                                width: "72px",
                                height: "72px",
                                borderRadius: "10px",
                                objectFit: "cover",
                                border: "1px solid rgba(226, 232, 240, 0.8)"
                              }}
                            />
                            <div className="ml-1">
                              {/* Dish name bold + larger text */}
                              <div
                                className="font-weight-bold"
                                style={{
                                  fontSize: "0.95rem",
                                  color: "#334155"
                                }}
                              >
                                {item.name}{" "}
                                {item.portion ? `(${item.portion})` : ""}
                              </div>

                              {/* Side choices with key as subheading */}
                              {sideChoices.length > 0 && (
                                <div className="mt-50">
                                  <div
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "#1e293b",
                                      fontWeight: 600
                                    }}
                                  >
                                    side choices:
                                  </div>
                                  {sideChoices.map((info, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        marginTop: "0.1rem",
                                        fontWeight: "normal",
                                        fontSize: "0.8rem",
                                        color: "#64748b"
                                      }}
                                    >
                                      <span
                                        style={{
                                          display: "inline-block",
                                          width: "4px",
                                          height: "4px",
                                          borderRadius: "50%",
                                          background: "#64748b",
                                          margin: "0 6px 2px 10px"
                                        }}
                                      ></span>
                                      {info.value}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Rate column: dish price bold + larger text, side choice prices normal */}
                        <td
                          className="py-3 text-right align-top border-bottom-1"
                          style={{ borderColor: "rgba(226, 232, 240, 0.8)" }}
                        >
                          <div
                            className="font-weight-bold"
                            style={{ fontSize: "0.95rem", color: "#334155" }}
                          >
                            {data?.currencySymbol}
                            {parseFloat(item.base_price).toFixed(2)}
                          </div>
                          {sideChoices.map((info, i) => (
                            <div
                              key={i}
                              style={{
                                marginTop: "0.25rem",
                                fontSize: "0.85rem",
                                color: "#64748b"
                              }}
                            >
                              {data?.currencySymbol}
                              {parseFloat(info.price).toFixed(2)}
                            </div>
                          ))}
                        </td>

                        {/* Quantity */}
                        <td
                          className="py-3 text-center align-top border-bottom-1"
                          style={{ borderColor: "rgba(226, 232, 240, 0.8)" }}
                        >
                          <span
                            className="font-weight-bold"
                            style={{ fontSize: "0.95rem", color: "#334155" }}
                          >
                            {item.quantity}
                          </span>
                        </td>

                        {/* Total = (dish + side prices) * quantity */}
                        <td
                          className="py-3 text-right align-top border-bottom-1"
                          style={{ borderColor: "rgba(226, 232, 240, 0.8)" }}
                        >
                          <span
                            style={{ fontSize: "0.95rem", color: "#557EE6" }}
                          >
                            {data?.currencySymbol}
                            {itemTotal.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>

              <CardBody
                className="p-4 rounded-bottom"
                style={{ backgroundColor: "#f1f5f9" }}
              >
                <Row className="align-items-start">
                  <Col md="6" className="mb-2 mb-md-0">
                    <div
                      style={{
                        background: "#ffffff",
                        padding: "1.5rem",
                        borderRadius: "8px",
                        width: "fit-content",
                        border: "none",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
                      }}
                    >
                      <h6
                        style={{
                          fontWeight: 700,
                          color: "#475569",
                          letterSpacing: "0.5px",
                          marginBottom: "0.5rem",
                          fontSize: "0.8rem"
                        }}
                      >
                        PAYMENT MODE
                      </h6>
                      <p
                        style={{
                          color: "#1e293b",
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          margin: 0
                        }}
                      >
                        {data?.paymentMode || "Cash"}
                      </p>
                    </div>
                  </Col>
                  <Col md="6" className="d-flex justify-content-md-end">
                    <div
                      style={{
                        background: "#ffffff",
                        padding: "1.5rem",
                        borderRadius: "8px",
                        border: "none",
                        width: "100%",
                        maxWidth: "300px",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
                      }}
                    >
                      {data?.taxBreakdown && data?.taxBreakdown.length > 0 ? (
                        <>
                          <div className="d-flex justify-content-between mb-1">
                            <span
                              style={{
                                color: "#64748b",
                                fontWeight: 600,
                                fontSize: "0.85rem"
                              }}
                            >
                              SUB TOTAL:
                            </span>
                            <strong style={{ color: "#1e293b" }}>
                              {data?.currencySymbol}
                              {data?.subTotal?.toFixed(2) || "-"}
                            </strong>
                          </div>
                          {data?.taxBreakdown.map((t, idx) => (
                            <div
                              key={idx}
                              className="d-flex justify-content-between mb-1"
                            >
                              <span
                                style={{
                                  color: "#64748b",
                                  fontWeight: 600,
                                  fontSize: "0.85rem"
                                }}
                              >
                                {t.taxName}:
                              </span>
                              <strong style={{ color: "#1e293b" }}>
                                {data?.currencySymbol}
                                {t.taxAmount.toFixed(2)}
                              </strong>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="d-flex justify-content-between mb-1">
                          <span
                            style={{
                              color: "#64748b",
                              fontWeight: 600,
                              fontSize: "0.85rem"
                            }}
                          >
                            SUB TOTAL:
                          </span>
                          <strong style={{ color: "#1e293b" }}>
                            {data?.currencySymbol}
                            {data?.subTotal?.toFixed(2) || "-"}
                          </strong>
                        </div>
                      )}

                      <hr
                        style={{
                          margin: "1rem 0",
                          borderColor: "rgba(226, 232, 240, 1)"
                        }}
                      />

                      <div className="d-flex justify-content-between align-items-center">
                        <span
                          style={{
                            color: "#1e293b",
                            fontWeight: 800,
                            fontSize: "0.95rem"
                          }}
                        >
                          GRAND TOTAL:
                        </span>
                        <strong
                          style={{
                            color: "#557EE6",
                            fontSize: "1.65rem",
                            fontWeight: 700
                          }}
                        >
                          {data?.currencySymbol}
                          {data?.grandTotal?.toFixed(2) ?? "-"}
                        </strong>
                      </div>
                    </div>
                  </Col>
                </Row>
              </CardBody>

              <CardBody className="px-4 pt-2 pb-2">
                <Row>
                  <Col sm="12">
                    <span
                      className="font-weight-bold"
                      style={{ fontSize: "0.9rem", color: "#475569" }}
                    >
                      Instructions:{" "}
                    </span>
                    <span style={{ fontSize: "0.9rem", color: "#1e293b" }}>
                      {data?.instructions || "None"}
                    </span>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>

      {/* {Order Status} */}
      <Modal
        isOpen={orderStatusModal}
        toggle={() => setOrderStatusModal(!orderStatusModal)}
        size={"md"}
      >
        <ModalHeader toggle={() => setOrderStatusModal(!orderStatusModal)}>
          Order Status
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit(handleOrderStatus)}>
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="orderStatus">
                    Order <span className="text-danger">*</span>
                  </Label>
                  <CustomInput
                    className="form-control"
                    type="select"
                    id="orderStatus"
                    name="orderStatus"
                    value={orderStatus}
                    onChange={(e) => {
                      setOrderStatus(e.target.value)
                      setValue("orderStatus", e.target.value)
                    }}
                    innerRef={register({ required: true })}
                    invalid={errors.orderStatus && true}
                  >
                    <option value="">Select</option>
                    <option value="0">Pending</option>
                    <option value="1">Accepted</option>
                    <option value="2">Delivered</option>
                    <option value="3">Cancelled</option>
                    <option value="4">Cleared</option>
                  </CustomInput>
                </FormGroup>
              </Col>
            </Row>
            <ModalFooter>
              <Button disabled={submitting} color="primary">
                {submitting ? (
                  <>
                    {" "}
                    <Spinner color="white" size="sm" />{" "}
                  </>
                ) : (
                  "Save"
                )}
              </Button>
              <Button
                color="secondary"
                onClick={() => setOrderStatusModal(!orderStatusModal)}
              >
                Cancel
              </Button>
            </ModalFooter>
          </Form>
        </ModalBody>
      </Modal>
    </Fragment>
  )
}

export default ViewOrder
