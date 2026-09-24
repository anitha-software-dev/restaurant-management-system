import React, { useLayoutEffect, useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { hooks } from '../hooks';
import { actions } from '../store/actions';
import { components } from '../components';
import { Loader } from '../components/Loader'
import green from '../assets/images/veg.png';
import red from '../assets/images/non-veg.png';
import yellow from '../assets/images/other_icon.png'
import menu from '../assets/images/menu.png';
import close from '../assets/images/close.png';
import food from '../assets/images/food-placeholder.jpg'
import Config from '../configs/config.json';
import thumbnail from '../assets/images/fsr-placeholder.png'
import { FaTimes } from 'react-icons/fa';
import { FiArrowRightCircle } from 'react-icons/fi'
import { FiMinus, FiPlus } from "react-icons/fi";
import { getCollectionById, getCollectionByRestaurant } from '../services';
import { v4 as uuidv4 } from 'uuid'
// import { BeatLoader } from 'react-spinners'
import { db } from '../configs/firebaseConfig'
import { getDocs, collection, where, query } from 'firebase/firestore'
import Gallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import moment from "moment";
import { Menu, Cart, Items, AvailabilitySlot } from '../types/shopType';


const { useCart, useRestaurantConfig } = hooks;

export const Shop: React.FC = () => {

  const dispatch = hooks.useDispatch();

  const nav = useNavigate()
  const location = useLocation();
  const { id }: any = useParams();
  const [itemCount, setItemCount] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restaurantInvalid, setRestaurantInvalid] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [selectedPortion, setSelectedPortion] = useState<string>('full')
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [allItems, setAllItems] = useState<Items[]>([]);
  const [items, setItems] = useState<Items[]>([]);
  const [filteredItems, setFilteredItems] = useState<Items[]>([]);
  const [currentSection, setCurrentSection] = useState(0)
  const [validId, setValidId] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Items | null>(null);
  const [isGreenToggled, setIsGreenToggled] = useState(false)
  const [isRedToggled, setIsRedToggled] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const [serviceAvailable, setServiceAvailable] = useState<boolean>(true);
  const [serviceChecked, setServiceChecked] = useState<boolean>(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<'takeaway' | 'dine-in' | null>(null);
  const [checkedActiveOrder, setCheckedActiveOrder] = useState(false);
  const [currentTime, setCurrentTime] = useState(moment());

  const [currency, setCurrency] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  
  const { platformFee, isLoading } = useRestaurantConfig();
  const { cart, setCart, handleItemCountChange } = useCart();

  hooks.useThemeColor('#fff');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#fff'));
  }, []);

  // Prepare image gallery for the selected item
  const galleryImages = selectedItem && selectedItem.images && selectedItem.images.length > 0
    ? selectedItem.images.map((image) => ({
      original: `${Config.MEDIA_URL}${image}?alt=media`,
      thumbnail: `${Config.MEDIA_URL}${image}?alt=media`,
      originalHeight: 300
    }))
    : [
      {
        original: food,
        thumbnail: thumbnail,
        originalHeight: 300
      },
    ]

  const handleThumbnailClick = (image: string) => {
    const images = selectedItem?.images || [];
    const newSelectedItem: Items = {
      ...selectedItem!,
      images: [image, ...images.filter((img) => img !== image)],
    };
    setSelectedItem(newSelectedItem);
  };

  // Generate or get a persistent sessionId
  const getSessionId = () => {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }


  // Validate or initialize "validId" from props or localStorage
  useEffect(() => {
    if (id) {
      setValidId(id);
    } else {
      const token = localStorage.getItem('token');
      if (token && token !== "") {
        setValidId(token);
      }
    }
  }, [id]);

  // Detect order type (dine-in or takeaway) based on route
  useLayoutEffect(() => {
    setOrderType(null);

    const isTakeawayRoute = location.pathname.startsWith('/takeaway');
    if (isTakeawayRoute) {
      setOrderType('takeaway');
      localStorage.setItem('orderType', 'takeaway');
    } else {
      setOrderType('dine-in');
      localStorage.setItem('orderType', 'dine-in');
    }
    // Validate QR id
    if (!id || typeof id !== 'string' || id.trim() === '') {
      setIsValid(false);
      return;
    }
    setValidId(id);
  }, [id, location.pathname]);

  // // Fetch takeaway by QR Id
  async function getTakeawayByQrId(qrId: string) {
    const q = query(collection(db, "takeaways"), where("qrcode", "==", qrId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }

  // Validate takeaway or dine-in QR codes
  useEffect(() => {

    if (!validId || !orderType) return;

    // Clear if switching restaurants
    const existingToken = localStorage.getItem('token')
    if (existingToken && existingToken !== validId) {
      localStorage.clear()
      localStorage.setItem("orderType", orderType);
    }

    setLoading(true);
    setErrorMsg(null);
    setRestaurantInvalid(false); // reset on new validation

    const handleInvalid = (msg: string) => {
      setErrorMsg(msg);
      setIsValid(false);
      setIsRestaurant(false);
      setRestaurantId(null);
      setRestaurantInvalid(true); // mark as invalid
      setLoading(false);
    };

    if (orderType === "takeaway") {
      // Handle takeaway validation
      // setLoading(true);

      getTakeawayByQrId(validId).then((takeawayData: any) => {

        if (!takeawayData || !takeawayData.restaurantId) {
          handleInvalid("Not a valid takeaway id!");
          return;
        }
        // Fetch restaurant for takeaway
        getCollectionById("restaurants", takeawayData.restaurantId).then(
          (restaurantData: any) => {
            if (!restaurantData) {
              handleInvalid("Not a valid restaurant for this takeaway!");
              return;
            }

            setIsValid(true);
            setIsRestaurant(true);
            setRestaurantId(restaurantData.id);
            localStorage.setItem("takeaway", JSON.stringify(takeawayData));
            localStorage.setItem("restaurant", JSON.stringify(restaurantData));
            localStorage.setItem("token", validId);
            setLoading(false);
          }
        );
      });
    } else if (orderType === "dine-in") {
      // Fetch restaurant for takeaway
      setLoading(true);

      getCollectionById("partnerqrs", validId).then((tableData: any) => {

        if (!tableData || !tableData.restaurantId) {
          handleInvalid("Not a valid dine-in id!");
          return;
        }
        // Fetch restaurant for dine-in
        getCollectionById("restaurants", tableData.restaurantId).then(
          (restaurantData: any) => {
            if (!restaurantData) {
              handleInvalid("Not a valid restaurant for this table!");
              return;
            }

            setIsValid(true);
            setIsRestaurant(true);
            setRestaurantId(restaurantData.id);
            localStorage.setItem("table", JSON.stringify(tableData));
            localStorage.setItem("restaurant", JSON.stringify(restaurantData));
            localStorage.setItem("token", validId);
            setLoading(false);
          }
        );
      });
    }
  }, [validId, orderType]);

  // Fetch menu items by category/subCategory
  const getMenuItems = async (categoryMap: any) => {
    setIsFetching(true);

    const collectionRef = collection(db, "items");

    const queries = Object.keys(categoryMap).map((categoryId) => {
      const baseQuery = query(collectionRef, where("category", "==", categoryId), where("status", "==", 1));

      if (categoryMap[categoryId].length > 0) {
        return query(baseQuery, where("subCategory", "in", categoryMap[categoryId]));
      }

      return baseQuery;
    });

    try {
      const querySnapshots = await Promise.all(queries.map((q) => getDocs(q)));

      const documents: Items[] = querySnapshots.flatMap((snapshot) =>
        snapshot.docs.map((doc) => {
          const data = doc.data() as Items;
          return { ...data, id: doc.id };
        })
      );

      setAllItems(documents);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch active order if exists (for dine-in/takeaway QR)
  const getActiveOrder = async (tableId: string) => {
    const q = query(
      collection(db, 'orders'),
      where('qrId', '==', tableId),
      where('orderStatus', 'in', [0, 1, 2]) 
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
  };

  // Check if there is an active order for this table/takeaway
  useEffect(() => {
    if (!isValid || !isRestaurant || !validId || !orderType) return;

    if (location.state?.skipActiveOrderCheck) {
      setCheckedActiveOrder(true);
      return;
    }
    setLoading(true);

    getActiveOrder(validId).then((orderDoc: any) => {
      if (orderDoc?.id) {
        // Redirect user to active order details page
        nav("/order-details/");
        return;
      } else {
        setCheckedActiveOrder(true);
      }
    }).catch((error) => {
      console.error("Error fetching order:", error);
      setCheckedActiveOrder(true);
      setLoading(false);
    });
  }, [isValid, isRestaurant, validId, orderType, location.state]);

  // Filter items for selected menu section
  useEffect(() => {
    if (allItems.length && menus.length && menus[currentSection]) {
      const filtered = allItems.filter((obj: any) => obj.type === menus[currentSection].id)
      setItems(filtered)
    } else {
      setItems([])
    }
  }, [allItems, currentSection, menus])


  // Check item availability based on configured day & time slots
  function isItemAvailable(availability: AvailabilitySlot[] | null | undefined, currentDate: moment.Moment): boolean {

    // always available
    if (!availability || availability.length === 0) return true;

    const currentDay = currentDate.format("dddd").toLowerCase();

    return availability.some((slot: any) => {
      const slotDay = slot.day?.toLowerCase();

      // applies every day
      if (slotDay !== "all" && slotDay !== currentDay) return false;

      const startTime = moment.isDate(slot.start)
        ? moment(slot.start).format("HH:mm")
        : slot.start;

      const endTime = moment.isDate(slot.end)
        ? moment(slot.end).format("HH:mm")
        : slot.end;

      const start = moment(currentDate.format("YYYY-MM-DD") + " " + startTime, "YYYY-MM-DD HH:mm");
      const end = moment(currentDate.format("YYYY-MM-DD") + " " + endTime, "YYYY-MM-DD HH:mm");

      return currentDate.isBetween(start, end, null, "[]");
    });
  }

  // Filter items by veg/non-veg toggle
  const filterItems = (
    items: any[],
    now: moment.Moment,
    isGreenToggled: boolean,
    isRedToggled: boolean
  ) => {
    return items.filter((item) => {
      // time - based filtering
      // const available = isItemAvailable(item.availability, now);

      // if (!available) return false;

      if (isGreenToggled && !isRedToggled) return item.veg_type === "Veg";
      if (!isGreenToggled && isRedToggled) return item.veg_type === "Non Veg";

      return true;
    });
  };

  // Update current time every 1 minute (to re-check availability)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(moment());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Apply filters whenever items or toggles change
  useEffect(() => {
    if (items?.length) {
      setFilteredItems(filterItems(items, currentTime, isGreenToggled, isRedToggled));
    } else {
      setFilteredItems([]);
    }
  }, [items, isGreenToggled, isRedToggled, currentTime]);

  // Reset all dependent state when switching restaurants
  useEffect(() => {
    if (!restaurantId) return;

    // Clear previous restaurant state
    setMenus([]);
    setAllItems([]);
    setItems([]);
    setFilteredItems([]);
    setHasLoaded(false);
    setLoading(false);
    setIsFetching(false);

    // Reset service availability flags
    setServiceAvailable(false);
    setServiceChecked(false);

  }, [restaurantId]);
  
  useEffect(() => {
    const restaurant = localStorage.getItem("restaurant");
    const res = restaurant ? JSON.parse(restaurant) : null;

    if (res?.currency) {
      setCurrency(res.currency.symbol ?? null);
    } else {
      setCurrency(null);
    }
    if (typeof res?.walletBalance === "number") {
      setWalletBalance(res.walletBalance);
    } else {
      setWalletBalance(null);
    }
  }, [restaurantId]);

  // Check service availability based on wallet balance vs platform fee
  useEffect(() => {
    const fee = parseFloat(platformFee?.value || "0");
    const available = walletBalance != null && walletBalance > 0 && walletBalance >= fee;

    setServiceAvailable(available);
    setServiceChecked(true); 
  }, [walletBalance, platformFee]);

  useEffect(() => {
    if (!serviceAvailable) {
      setLoading(false);
      setIsFetching(false);
      setHasLoaded(false);
    }
  }, [serviceAvailable]);

  // Fetch menus and items after validation
  useEffect(() => {
    if (!checkedActiveOrder || !restaurantId || !serviceAvailable) return;

    setIsFetching(true);
    setLoading(true);

    let menusLoaded = false;
    let itemsLoaded = false;

    const stopLoadingIfReady = () => {
      if (menusLoaded && itemsLoaded) {
        setIsFetching(false);
        setLoading(false);
        setHasLoaded(true);
      }
    };

    // GET MENUS
    getCollectionByRestaurant('menus', restaurantId).then((data: any) => {
      if (data?.length > 0) {
        setMenus(data);
        const isSuggested = location.state?.selectedOptions ? true : false;
        const existing = data.findIndex((obj: any) =>
          obj.name === (isSuggested ? "Suggested" : "Main Course")
        );
        setCurrentSection(existing >= 0 ? existing : 0);
      } else {
        setMenus([]);
        setCurrentSection(0);
      }
    }).finally(() => {
      menusLoaded = true;
      stopLoadingIfReady();
    });

    // GET MENU ITEMS
    if (location.state?.selectedOptions) {
      getMenuItems(location.state.selectedOptions).finally(() => {
        itemsLoaded = true;
        stopLoadingIfReady();
      });
    } else {
      getCollectionByRestaurant('items', restaurantId).then((data: any) => {
        if (data?.length > 0) {
          const filteredItems = data.filter((item: Items) => item.status === 1);
          setAllItems(filteredItems);
          console.log("Fetched all items:", filteredItems);
        } else {
          setAllItems([]);
        }
      }).finally(() => {
        itemsLoaded = true;
        stopLoadingIfReady();
      });
    }
  }, [restaurantId, serviceAvailable, checkedActiveOrder]);


  const openModal = (modalName: string) => {
    setIsModalOpen(true)
    setActiveModal(modalName)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setActiveModal(null)
    setSelectedItem(null)
  }

  const handleMenuClick = () => {
    setIsMenuModalOpen(true)
  }

  const handleMenuClose = () => {
    setIsMenuModalOpen(false)
  }

  const closeDetailModal = () => {
    setDetailModalOpen(false)
    setActiveModal(null)
  }

  const handleDetail = (data: any) => {
    setDetailModalOpen(true)
    setActiveModal('detail')
    setSelectedItem(data)
  }

  // Renders the header component with filters (Veg / Non-Veg toggles)
  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showBurger={true}
        showButton={true}
        showSwitch={true}
        headerStyle={{
          backgroundColor: 'transparent',
        }}
        setIsGreenToggled={setIsGreenToggled}
        setIsRedToggled={setIsRedToggled}
      />
    );
  };

  // ---- Cart Handling ----

  // Updates total item count whenever cart changes
  useEffect(() => {
    if (cart && cart.length > 0) {
      const sum = cart.reduce((accumulator, current) => accumulator + current.quantity, 0)
      setItemCount(sum)
    } else {
      setItemCount(0)
    }
  }, [cart])

  //add new item from modal
  const handleAddCart = () => {
    if (!selectedItem) {
      closeModal()
      return
    }
    const data = [...cart]

    data.push({
      ...selectedItem,
      chefId: selectedItem?.chefId || null,
      quantity: 1,
      portion: selectedPortion || 'full'
    })

    setCart(data)
    localStorage.setItem('cart', JSON.stringify(data))
    closeModal()
  }

  const handleAdd = (data: any) => {
    if (data) {
      const portions = [
        data.is_full_portion,
        data.is_half_portion,
        data.is_quarter_portion,
      ]
      const truePortionCount = portions.filter(Boolean).length

      // If multiple portions exist → show portion selection modal
      if (truePortionCount > 1) {
        openModal('portionSelection')
        setSelectedItem(data)
        setSelectedPortion(
          data.is_full_portion
            ? 'full'
            : data.is_half_portion
              ? 'half'
              : 'quarter'
        )
        return false
      }
    }
    // Otherwise → decrement quantity directly
    handleItemCountChange(data, 'decrement')
  }

  // Check if an item is already in the cart
  const IsCartAdded = (id: string) => {
    const result = cart.filter(c => c.id === id)
    if (result && result.length > 0) {
      return true
    }
    return false
  }

  // Get the quantity of an item in the cart
  const getItemQuantity = (id: string) => {
    const result: any = cart.filter(c => c.id === id)
    if (result && result.length > 0) {
      return result[0].quantity
    }
    return false
  }

  // --- Modal for portion selection ---
  const renderModal = (): JSX.Element | null => {

    if (!isModalOpen) return null

    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '130px',
          bottom: (itemCount > 0) ? '70px' : '0px',
          // zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'

        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: 20,
            borderRadius: 2,
            position: 'relative',
            width: '100%',
            height: "100%",
            maxWidth: '425px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={closeModal}
            style={{
              position: 'absolute',
              top: 10,
              right: 20,
              background: '#fff',
              borderRadius: '50%',
              border: '1px solid #dedede',
              padding: 2,
              fontSize: '20px',
              color: '#000',
            }}
          >
            <FaTimes />
          </button>

          {/* Portion selection content */}
          {activeModal === 'portionSelection' && (

            <div style={{ marginTop: '15%', borderRadius: 10, border: "1px solid #dedede", padding: "10px", backgroundColor: '#fff', }}>
              <h4 style={{ textAlign: 'left', fontWeight: 500, marginBottom: 20, marginLeft: 18, fontSize: "14px" }}>
                Portion
              </h4>

              {/* Full Portion Option */}
              {selectedItem?.is_full_portion && (
                <div
                  className='container row-center-space-between'
                  style={{ marginBottom: 21 }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins',
                    }}
                  >
                    Full
                  </span>

                  <div style={{ display: 'flex', gap: 20 }}>
                    <span style={{ fontFamily: "Poppins", fontSize: 14, }}> {currency ? currency : ""} {Number(selectedItem?.full_price).toFixed(2)} </span>
                    <label style={{ display: 'flex', alignItems: 'center', }}>
                      <input
                        type="radio"
                        name="portion"
                        value="full"
                        checked={selectedPortion === 'full'}
                        onChange={() => setSelectedPortion('full')}
                        style={{
                          accentColor: '#f9791d',
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Half Portion Option */}
              {selectedItem?.is_half_portion && (
                <div
                  className='container row-center-space-between'
                  style={{ marginBottom: 21 }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins',
                    }}
                  >
                    Half
                  </span>

                  <div style={{ display: 'flex', gap: 20 }}>
                    <span style={{ fontFamily: "Poppins", fontSize: 14, }}>  {currency ? currency : ""} {Number(selectedItem?.half_price).toFixed(2)} </span>
                    <label style={{ display: 'flex', alignItems: 'center', }}>
                      <input
                        type="radio"
                        name="portion"
                        value="half"
                        checked={selectedPortion === 'half'}
                        onChange={() => setSelectedPortion('half')}
                        style={{
                          accentColor: '#f9791d',
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Half Portion Option */}
              {selectedItem?.is_quarter_portion && (
                <div
                  className='container row-center-space-between'
                  style={{ marginBottom: 21 }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins',
                    }}
                  >
                    Quarter
                  </span>

                  <div style={{ display: 'flex', gap: 20 }}>
                    <span style={{ fontFamily: 'Poppins', fontSize: 14 }}>
                      {currency ? currency : ""} {Number(selectedItem?.quarter_price).toFixed(2)}
                    </span>

                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="radio"
                        name="portion"
                        value="quarter"
                        checked={selectedPortion === 'quarter'}
                        onChange={() => setSelectedPortion('quarter')}
                        style={{
                          accentColor: '#f9791d',
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: 25, }}>
            <components.Button
              text="Add Item"
              variant='inverse'
              onClick={() => handleAddCart()}
            />
          </div>

        </div>
      </div>
    )
  }

  // --- Modal for item details (images, description, etc.) ---
  const renderDetailModal = (): JSX.Element | null => {
    if (!detailModalOpen) return null

    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '130px',
          bottom: (itemCount > 0) ? '70px' : '0px',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'

        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: 20,
            borderRadius: 2,
            position: 'relative',
            width: '100%',
            height: "100%",
            maxWidth: '425px'
          }}
        >
          <button
            onClick={closeDetailModal}
            style={{
              position: 'absolute',
              top: 10,
              right: 20,
              background: '#fff',
              borderRadius: '50%',
              border: '1px solid #dedede',
              padding: 2,
              fontSize: '20px',
              color: '#000',
            }}
          >
            <FaTimes />
          </button>

          {/* Show image gallery + description */}
          {activeModal === 'detail' && selectedItem && (
            <div style={{ height: '100%', overflowY: 'auto' }}>

              <div style={{ marginTop: '7%', borderRadius: 10 }}>

                <Gallery
                  items={galleryImages}
                  thumbnailPosition="bottom"
                  showThumbnails={true}
                  showFullscreenButton={false}
                  showPlayButton={false}
                  autoPlay={false}
                  onThumbnailClick={(event: React.MouseEvent, index: number) => handleThumbnailClick(selectedItem?.images[index])}
                />
              </div>

              <div style={{ marginTop: 30, marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins',
                    lineHeight: 1.5,
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {selectedItem.description}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    )
  }

  const renderContent = (): JSX.Element => {

    const smallScreen = window.innerWidth === 320 && window.innerHeight === 568;

    const smallScreenTwo = window.innerWidth === 360 && window.innerHeight === 640;

    const smallScreenThree = window.innerWidth === 375 && window.innerHeight === 667;

    // Handle navigation between menu sections
    const handleNavigation = (direction: 'left' | 'right') => {
      setCurrentSection((prevSection) => {
        if (direction === 'left') {
          return prevSection === 0 ? menus.length - 1 : prevSection - 1;
        } else {
          return prevSection === menus.length - 1 ? 0 : prevSection + 1;
        }
      });
    };

    // Titles for previous and next menu section (for navigation UI)
    const prevTitle = currentSection === 0 ? menus[menus.length - 1]?.name : menus[currentSection - 1]?.name
    const nextTitle = currentSection === menus.length - 1 ? menus[0]?.name : menus[currentSection + 1]?.name

    return (
      <main className="scrollable"
        // Disable scrolling when modals are open
        style={{ overflowY: activeModal === 'portionSelection' || activeModal === 'detail' ? 'hidden' : 'auto', height: '100%' }}>
        <div
          style={{
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div className="container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              background: "#f2f4f4",
              paddingBlock: "20px",
              position: 'absolute',
              top: '69px',
              zIndex: 1000

            }}
          >
            <button
              onClick={() => handleNavigation('left')}
              style={{
                position: 'absolute',
                left: '10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: '20px',
                height: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: '15px solid transparent',
                  borderBottom: '15px solid transparent',
                  borderRight: '20px solid #0c6a69',
                }}
              />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <div
                style={{
                  textAlign: 'center',
                  opacity: 0.1,
                  transform: 'translateX(10%)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 60

                }}
              >
                <p style={{ fontWeight: 600, fontSize: 13, fontFamily: "Poppins" }}>{prevTitle}</p>
              </div>

              <div className='' style={{ textAlign: 'center', height: '100%' }}>
                <h5
                  style={{
                    fontWeight: 800,
                    textTransform: 'capitalize',
                    color: '#000',
                    textWrap: 'nowrap',
                    height: '20%',
                    fontSize: smallScreen ? 14 : 16,
                    paddingInline: smallScreen ? 10 : 20,
                  }}
                >
                  {menus[currentSection]?.name || "No Menus Found"}
                </h5>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  opacity: 0.1,
                  transform: 'translateX(-10%)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 60
                }}
              >
                <p style={{ fontWeight: 600, fontSize: 13, fontFamily: "Poppins" }}>{nextTitle}</p>
              </div>
            </div>

            <button
              onClick={() => handleNavigation('right')}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: '20px',
                height: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: '15px solid transparent',
                  borderBottom: '15px solid transparent',
                  borderLeft: '20px solid #0c6a69',
                }}
              />
            </button>
          </div>

          {/* Items List */}
          <div
            className="content"
            style={{
              marginTop: smallScreen ? "25%" : "20%",
              marginBottom: itemCount > 0 ? "25%" : "5%",
            }}
          >
            {isLoading || isFetching ? (
              <Loader text="Loading..." />
            ) : (
              <>
                <div>
                  {checkedActiveOrder && filteredItems && filteredItems.length > 0 ? (
                    <>
                      {filteredItems.map((item: any) => {
                        const available = isItemAvailable(item.availability, currentTime);

                        return (
                          <div
                            className="container"
                            style={{ borderBottom: "2px solid #d3d3d3" }}
                            key={item.id}
                          >
                            {/* Item Info  */}
                            <div
                              style={{
                                gap: 6,
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                marginTop: 16,
                                position: "relative",
                              }}
                            >
                              <div>
                                <h5
                                  style={{
                                    textAlign: "left",
                                    marginBottom: 2,
                                    textTransform: "capitalize",
                                    fontWeight: 500,
                                    fontSize: smallScreen ? "13px" : "14px",
                                  }}
                                >
                                  {item.name}
                                </h5>
                                <p
                                  className="t18"
                                  style={{
                                    textAlign: "left",
                                    marginBottom: 10,
                                    lineHeight: 1.5,
                                    fontSize: smallScreen ? "11px" : "12px",
                                  }}
                                >
                                  {item.description.length > 58
                                    ? item.description.substring(0, 58) + "..."
                                    : item.description}
                                  <span
                                    style={{
                                      textTransform: "uppercase",
                                      fontWeight: 700,
                                      fontSize: smallScreen ? "11px" : "12px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => handleDetail(item)}
                                  >
                                    &nbsp;more
                                  </span>
                                </p>

                                {/* If item already in cart -> show quantity controls */}
                                {IsCartAdded(item.id) ? (
                                  <div
                                    className="container"
                                    style={{ marginBottom: 21, paddingLeft: 0 }}
                                  >
                                    <div
                                      style={{
                                        padding: "10px",
                                        borderRadius: 10,
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        width: "90%",
                                        backgroundColor: available ? "#252525" : "#aaa",
                                        marginRight: 10,
                                        height: "50px",
                                        opacity: available ? 1 : 0.6,
                                        pointerEvents: available ? "auto" : "none",
                                      }}
                                    >
                                      <button
                                        disabled={!available}
                                        onClick={() =>
                                          handleItemCountChange(item, "decrement")
                                        }
                                      >
                                        <FiMinus
                                          color="#fff"
                                          size={18}
                                          style={{ marginLeft: 7 }}
                                        />
                                      </button>
                                      <span
                                        style={{
                                          marginTop: 2,
                                          fontSize: 14,
                                          color: "white",
                                          fontFamily: "Poppins",
                                        }}
                                      >
                                        {getItemQuantity(item.id)}
                                      </span>
                                      <button
                                        disabled={!available}
                                        onClick={() =>
                                          handleItemCountChange(item, "increment")
                                        }
                                      >
                                        <FiPlus color="#fff" size={18} />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  // If not in cart -> show Add button
                                  <div
                                    style={{
                                      position: "relative",
                                      marginBottom: 20,
                                      marginRight: 30,
                                    }}
                                  >
                                    <div style={{ fontWeight: 500 }}>
                                      <components.Button
                                        text="ADD"
                                        colorScheme="secondary"
                                        disabled={!available}
                                        onClick={() => available && handleAdd(item)}
                                      />
                                    </div>
                                    {available ? (
                                      <span
                                        style={{
                                          position: "absolute",
                                          top: 13,
                                          right: 13,
                                          transform: "translate(50%, -50%)",
                                          color: "#000",
                                          width: 16,
                                          height: 16,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: 22,
                                          fontWeight: "bold",
                                          cursor: "pointer",
                                        }}
                                        onClick={() => available && handleAdd(item)}
                                      >
                                        +
                                      </span>
                                    ) : null}
                                  </div>
                                )}
                              </div>

                              {/* Item Image with veg/non-veg icon and price */}
                              <div style={{ position: "relative" }}>
                                <img
                                  src={
                                    item.images && item.images.length > 0
                                      ? `${Config.MEDIA_URL}${item.images[0]}?alt=media`
                                      : food
                                  }
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "75%",
                                    backgroundColor: "#d6d1ce",
                                    filter: available ? "none" : "grayscale(100%)",
                                  }}
                                  onClick={() => available && handleAdd(item)}
                                />
                                <img
                                  src={
                                    item.veg_type === "Veg" ? green : item.veg_type === "Non Veg" ? red : yellow
                                  }
                                  alt={item.veg_type === "Veg" ? green : item.veg_type === "Non Veg" ? red : yellow}
                                  style={{
                                    position: "absolute",
                                    top: "7px",
                                    left: "7px",
                                    width: "17px",
                                    height: "17px",
                                  }}
                                />

                                {/* Item Price */}
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: "20px",
                                    padding: "4px 34px",
                                    left: "49%",
                                    transform: "translateX(-49%)",
                                    backgroundColor: "#d6d1ce",
                                    borderRadius: "10px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    fontFamily: "Poppins",
                                    color: "#000000",
                                    border: "2px solid #d6d1ce",
                                    borderTopLeftRadius: 0,
                                    borderTopRightRadius: 0,
                                    borderBottomLeftRadius: 10,
                                    borderBottomRightRadius: 10,
                                    width: "100%",
                                    textWrap: "nowrap",
                                    textAlign: "center",
                                    opacity: available ? 1 : 0.6,
                                  }}
                                >
                                  {currency ? currency : ""}{" "}
                                  {item.is_full_portion &&
                                    !isNaN(Number(item.full_price))
                                    ? Number(item.full_price).toFixed(2)
                                    : item.is_half_portion &&
                                      !isNaN(Number(item.half_price))
                                      ? Number(item.half_price).toFixed(2)
                                      : item.is_quarter_portion &&
                                        !isNaN(Number(item.quarter_price))
                                        ? Number(item.quarter_price).toFixed(2)
                                        : "0.00"}{" "}
                                  {item.taxes && item.taxes.length > 0 ? " + Tax" : ""}
                                </div>

                                {/* Not available overlay */}
                                {!available && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 20,
                                      backgroundColor: "rgba(0,0,0,0.5)",
                                      color: "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: "bold",
                                      fontSize: "14px",
                                      borderRadius: "10px",
                                    }}
                                  >
                                    Not available
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : checkedActiveOrder ? (
                    <>
                      <div className="container">
                        <p
                          className="t18"
                          style={{
                            textAlign: "center",
                            marginTop: 50,
                            marginBottom: 10,
                            fontSize: 16,
                            opacity: 0.25,
                          }}
                        >
                          Oops! It looks like our{" "}
                          <b>{menus[currentSection]?.name}</b> items are all empty right
                          now.
                        </p>
                        <p
                          className="t18"
                          style={{ textAlign: "center", opacity: 0.25 }}
                        >
                          No items are available right now (
                          <b>{currentTime.format("dddd HH:mm")}</b>).<br />
                          "Please check back later for something delicious!"
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Floating Menu Button (Menu / Close) */}
        {(!isMenuModalOpen) ? (
          <img
            src={menu}
            alt="menu"
            style={{
              position: 'absolute',
              bottom: itemCount > 0 || smallScreen || smallScreenTwo ? '80px' : '30px',
              right: '5px',
              width: '45px',
              height: '45px',
              zIndex: 1000,
              cursor: "pointer"
            }}
            onClick={handleMenuClick}
          />
        ) : (
          <img
            src={close}
            alt="close"
            style={{
              position: 'absolute',
              bottom: itemCount > 0 || smallScreen || smallScreenTwo ? '80px' : '30px',
              right: '5px',
              width: '45px',
              height: '45px',
              zIndex: 1000,
              cursor: "pointer"
            }}
            onClick={handleMenuClose}
          />
        )
        }

        {/* Menu Modal */}
        {isMenuModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: smallScreen || smallScreenTwo
                ? (menus.length < 5 ? '10%' : '0')
                : smallScreenThree
                  ? (menus.length < 5 ? '21%' : '10%')
                  : (menus.length < 5 ? '27%' : '20%'),
              right: 20,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'end',
              alignItems: 'center',
              zIndex: 2000
            }}
            onClick={handleMenuClose}
          >
            <div
              style={{
                width: smallScreen ? '200px' : '220px',
                backgroundColor: '#000',
                color: '#fff',
                borderRadius: '15px',
                padding: '10px',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
                maxHeight: menus.length > 5 ? '300px' : 'auto',
                overflowY: menus.length > 5 ? 'auto' : 'visible',
                textAlign: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {menus.length > 1 ? (
                <ul
                  style={{
                    listStyleType: 'none',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {menus.map((item: any, index: any) => (
                    <li
                      key={item.id}
                      style={{
                        padding: smallScreen ? '8px 0' : '10px 0',
                        borderBottom: '1px solid #3D3D3D',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontFamily: "Poppins",
                        fontSize: smallScreen ? 12 : 14
                      }}
                      onClick={() => {
                        setCurrentSection(index)
                        handleMenuClose()
                      }}
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontFamily: "Poppins", fontSize: smallScreen ? 12 : 14 }}>
                  No Menus Found
                </p>
              )}
            </div>
          </div>
        )}

        {/* Cart Footer (if items added) */}
        {(itemCount > 0) &&
          <div className='container' style={{
            backgroundColor: "#000",
            height: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: "space-around",
            position: "absolute",
            bottom: 0

          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p
                className='t18'
                style={{
                  textAlign: 'left', color: "#fff", display: "flex",
                  alignItems: "center",
                  marginRight: 5
                }}
              >
                {itemCount} {(itemCount > 1) ? 'Items' : 'Item'} Added
              </p>
              <FiArrowRightCircle size={18} color="#fff" />
            </div>
            <div >
              <components.Button
                text='Place Order'
                colorScheme='orange'
                to='/orders'
                containerStyle={{
                  padding: '5px 15px',
                  height: '42px',
                  fontSize: '12px',
                  width: '100%'
                }}
              />
            </div>
          </div>
        }
      </main>
    );
  };

  // Render content when restaurant data is invalid (restaurant not found or invalid QR)
  const renderInvalidContent = (): JSX.Element => {
    return (
      <main className='scrollable center' style={{ zIndex: 1 }}>
        <div className='container' style={{ display: 'flex', alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: 0.9 }}>
          <div>
            <img
              src={food}
              alt=""
              style={{
                width: '200px',
                maxWidth: '400px',
                height: '200px',
                margin: 'auto',
                display: 'block',
              }}
            />
          </div>
          <p className='t18' style={{ textAlign: 'center', fontSize: 18, fontWeight: 800 }}>
            {errorMsg || 'No Restaurant Found!'}
          </p>
        </div>
      </main>
    );
  };

  // Render content when service is unavailable (restaurant temporarily closed or disabled)
  const renderUnavailableContent = () => (
    <main className='scrollable center'>
      <div className='container' style={{ display: 'flex', alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: 0.9 }}>
        <div>
          <img
            src={food}
            alt=""
            style={{
              width: '200px',
              maxWidth: '400px',
              height: '200px',
              margin: 'auto',
              display: 'block',
            }}
          />
        </div>
        <p className='t18' style={{ textAlign: 'center', fontSize: 18, fontWeight: 800 }}>
          Service unavailable.
        </p>
        <p className='t18' style={{ textAlign: 'center', fontSize: 18, fontWeight: 800 }}>
          Please contact the restaurant.
        </p>
      </div>
    </main>
  );

  // checkedActiveOrder should be true when the active-order check has completed
  const activeOrderCheckDone = checkedActiveOrder === true;

  // menus/data are considered loaded when hasLoaded is true and no fetch flags are active
  const menusFetched = hasLoaded === true && !loading && !isFetching;

  if (restaurantInvalid) return renderInvalidContent();

  if (!serviceChecked) return <Loader text="Loading..." />;
  if (!serviceAvailable) return renderUnavailableContent();

  if (loading) return <Loader text="Loading..." />;

  if (!activeOrderCheckDone) return <Loader text="Loading..." />;
  if (!menusFetched) return <Loader text="Loading menus..." />;

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderModal()}
      {renderDetailModal()}
    </>
  );
}
