import React, { useLayoutEffect, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { hooks } from '../hooks';
import { actions } from '../store/actions';
import { components } from '../components';
import { Loader } from '../components/Loader';
import menu from '../assets/images/menu.png';
import close from '../assets/images/close.png';
import food from '../assets/images/food-placeholder.jpg';
import { FiArrowRightCircle, FiShoppingCart, FiArrowRight, FiSearch } from 'react-icons/fi';
import { getCollectionById, getCollectionByRestaurant } from '../services';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../configs/firebaseConfig';
import { getDocs, collection, where, query, onSnapshot } from 'firebase/firestore';
import Gallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import moment from "moment";
import { Menu, Cart, Items, AvailabilitySlot, AdditionalInfo } from '../types/shopType';
import ItemModal from '../components/modals/ItemModal';
import DetailModal from '../components/modals/DetailModal';
import OffersModal from "../components/modals/OffersModal";
import UnavailableContent from '../components/UnavailableContent';
import ItemCard from '../components/ItemCard';
import MenuModal from '../components/MenuModal';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../configs/theme';
import { getItemGalleryImages } from '../utils/imageUtils';

const { useCart, useRestaurantConfig, useActiveOrder, useWindowSize, useSelector } = hooks;

export const Shop: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const nav = useNavigate();
  const location = useLocation();
  const { id }: any = useParams();
  const { isSmallMobile } = useWindowSize();
  const [itemCount, setItemCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [offersModalOpen, setOffersModalOpen] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [allItems, setAllItems] = useState<Items[]>([]);
  const [items, setItems] = useState<Items[]>([]);
  const [filteredItems, setFilteredItems] = useState<Items[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [validId, setValidId] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [isGreenToggled, setIsGreenToggled] = useState(false);
  const [isRedToggled, setIsRedToggled] = useState(false);
  const [isOtherToggled, setIsOtherToggled] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<'takeaway' | 'dine-in' | null>(null);
  const [checkedActiveOrder, setCheckedActiveOrder] = useState(location.state?.skipActiveOrderCheck || false);
  const [currentTime, setCurrentTime] = useState(moment());
  const [selectedAdditionalInfo, setSelectedAdditionalInfo] = useState<{ [key: number]: string | string[] }>({});
  const [selectedItem, setSelectedItem] = useState<Items | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<string>('full');

  const { currency, walletBalance, platformFee, isLoading } = useRestaurantConfig();
  const { cart, setCart, handleItemCountChange } = useCart();
  const { order: activeOrder, fetching: activeOrderFetching } = useActiveOrder();
  const cachedMenuData = useSelector((state) => state.menuSlice);

  hooks.useThemeColor(theme.colors.background);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(theme.colors.background));
  }, []);

  // Detect order type from route if landing directly on Shop
  useLayoutEffect(() => {
    if (location.pathname.includes('/takeaway/')) {
      localStorage.setItem("orderType", "takeaway");
      setOrderType("takeaway");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!restaurantId || offers.length === 0) return;

    const hasSeenOffers = localStorage.getItem("hasSeenOffers");
    if (!hasSeenOffers) {
      setOffersModalOpen(true);
      setActiveModal("offers");
    }
  }, [restaurantId, offers]);

  const closeOffersModal = useCallback(() => {
    localStorage.setItem("hasSeenOffers", "true");
    setOffersModalOpen(false);
    setActiveModal(null);
  }, []);

  const galleryImages = getItemGalleryImages(selectedItem, food);

  const handleThumbnailClick = (image: string) => {
    const images = selectedItem?.images || [];
    const newSelectedItem: Items = {
      ...selectedItem!,
      images: [image, ...images.filter((img) => img !== image)],
    };
    setSelectedItem(newSelectedItem);
  };

  useEffect(() => {
    const storedRestaurant = localStorage.getItem("restaurant");
    const storedToken = localStorage.getItem("token");
    const storedOrderType = localStorage.getItem("orderType");

    if (storedRestaurant) {
      const restaurantData = JSON.parse(storedRestaurant);
      setRestaurantId(restaurantData.id);
      setIsValid(true);
      setIsRestaurant(true);
    }

    if (storedToken) {
      setValidId(storedToken);
    }

    if (storedOrderType) {
      setOrderType(storedOrderType as 'takeaway' | 'dine-in');
      if (storedOrderType === 'takeaway') {
        getSessionId();
      }
    }

    setLoading(false);
  }, []);

  const getSessionId = () => {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  const getOffersByRestaurant = async (restaurantId: string) => {
    try {
      const q = query(
        collection(db, "offers"),
        where("restaurantId", "==", restaurantId),
        where("status", "==", true)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return [];
      }

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      return data;
    } catch (error) {
      console.error("Error fetching offers:", error);
      return [];
    }
  };

  useEffect(() => {
    if (!restaurantId) return;

    const fetchOffers = async () => {
      const data = await getOffersByRestaurant(restaurantId);
      setOffers(data);
    };

    fetchOffers();
  }, [restaurantId]);

  // Real-time listener for Items
  useEffect(() => {
    if (!restaurantId || !serviceAvailable) return;

    // Listen to Items collection
    const itemsQuery = query(collection(db, "items"), where("restaurantId", "==", restaurantId));

    const isDataCached = cachedMenuData.allItems.length > 0;
    if (!isDataCached) {
      setIsFetching(true);
    }

    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter only active items (status === 1)
      const activeItems = JSON.parse(JSON.stringify(itemsData.filter((item: any) => item.status === 1)));
      setAllItems(activeItems);
      dispatch(actions.setAllItems(activeItems));
      setIsFetching(false);
      setHasLoaded(true);
    }, (error) => {
      console.error("Error listening to items:", error);
      setIsFetching(false);
    });

    return () => unsubscribeItems();
  }, [restaurantId, serviceAvailable]);

  // Initial local state from Redux cache
  useEffect(() => {
    if (cachedMenuData.menus.length > 0 && menus.length === 0) {
      setMenus(cachedMenuData.menus);
    }
    if (cachedMenuData.allItems.length > 0 && allItems.length === 0) {
      setAllItems(cachedMenuData.allItems);
      setHasLoaded(true);
    }
  }, [cachedMenuData]);


  // Removed manual getActiveOrder function as it's handled by useActiveOrder hook

  useEffect(() => {
    if (activeOrderFetching || !isValid) return;

    // Check if we already have an active order and should redirect
    if (activeOrder?.id && !location.state?.skipActiveOrderCheck) {
      nav("/order-details/", { state: { skipActiveOrderCheck: true } });
    } else {
      setCheckedActiveOrder(true);
    }
  }, [activeOrder, activeOrderFetching, isValid, location.state]);

  useEffect(() => {
    if (walletBalance == null || platformFee == null) {
      setServiceAvailable(null);
      return;
    }
    const fee = parseFloat(platformFee?.value || "0");
    const available = walletBalance >= fee;
    setServiceAvailable(available);
  }, [walletBalance, platformFee]);

  useEffect(() => {
    if (!checkedActiveOrder || !restaurantId || !serviceAvailable) return;

    const isMenuCached = cachedMenuData.menus.length > 0;
    if (!isMenuCached) {
      setLoading(true);
    }

    // Initial Menu Load (can also be real-time if menus change often, but usually static)
    getCollectionByRestaurant('menus', restaurantId).then((data: any) => {
      if (data?.length > 0) {
        setMenus(data);
        dispatch(actions.setMenus(data));
        const isSuggested = location.state?.selectedOptions ? true : false;
        const existing = data.findIndex((obj: any) =>
          obj.name === (isSuggested ? "Suggested" : "Main Course")
        );
        setCurrentSection(existing >= 0 ? existing : 0);
      } else {
        setMenus([]);
        setCurrentSection(0);
      }
      setLoading(false);
    });

  }, [restaurantId, serviceAvailable, checkedActiveOrder]);

  // Pre-fetch taxes for the cart screen (OrderHistory)
  useEffect(() => {
    if (!restaurantId || !serviceAvailable) return;

    if (cachedMenuData.taxes.length === 0) {
      getCollectionByRestaurant('taxes', restaurantId).then((data: any) => {
        if (data?.length > 0) {
          dispatch(actions.setTaxes(data));
        }
      });
    }
  }, [restaurantId, serviceAvailable]);

  useEffect(() => {
    if (allItems.length && menus.length && menus[currentSection]) {
      const filtered = allItems.filter((obj: any) => obj.type === menus[currentSection].id);
      setItems(filtered);
    } else {
      setItems([]);
    }
  }, [allItems, currentSection, menus]);

  function isItemAvailable(availability: AvailabilitySlot[] | null | undefined, currentDate: moment.Moment): boolean {
    if (!availability || availability.length === 0) return true;
    const currentDay = currentDate.format("dddd").toLowerCase();

    return availability.some((slot: any) => {
      const slotDay = slot.day?.toLowerCase();
      if (slotDay !== "all" && slotDay !== currentDay) return false;

      const startTime = moment.isDate(slot.start) ? moment(slot.start).format("HH:mm") : slot.start;
      const endTime = moment.isDate(slot.end) ? moment(slot.end).format("HH:mm") : slot.end;

      const start = moment(currentDate.format("YYYY-MM-DD") + " " + startTime, "YYYY-MM-DD HH:mm");
      const end = moment(currentDate.format("YYYY-MM-DD") + " " + endTime, "YYYY-MM-DD HH:mm");

      return currentDate.isBetween(start, end, null, "[]");
    });
  }

  const filterItems = (
    items: any[],
    now: moment.Moment,
    isGreenToggled: boolean,
    isRedToggled: boolean,
    isOtherToggled: boolean
  ) => {
    if (!isGreenToggled && !isRedToggled && !isOtherToggled) {
      return items;
    }

    return items.filter((item) => {
      const isVeg = item.veg_type === "Veg";
      const isNonVeg = item.veg_type === "Non Veg";
      const isOther = item.veg_type === "Other";
      return (isGreenToggled && isVeg) || (isRedToggled && isNonVeg) || (isOtherToggled && isOther);
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(moment());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (items?.length) {
      setFilteredItems(filterItems(items, currentTime, isGreenToggled, isRedToggled, isOtherToggled));
    } else {
      setFilteredItems([]);
    }
  }, [items, isGreenToggled, isRedToggled, isOtherToggled, currentTime]);

  useEffect(() => {
    if (cart && cart.length > 0) {
      const sum = cart.reduce((accumulator, current) => accumulator + current.quantity, 0);
      setItemCount(sum);
    } else {
      setItemCount(0);
    }
  }, [cart]);

  const handleAddCart = () => {
    if (!selectedItem) {
      closeModal();
      return;
    }

    const data = [...cart];
    const selectedAdditionalInfoArray = selectedItem.additional_info
      ?.map((info, index) => {
        const selected = selectedAdditionalInfo[index];
        if (!selected || (Array.isArray(selected) && selected.length === 0)) {
          return null;
        }
        const selectedOptions = Array.isArray(selected) ? selected : [selected];
        return selectedOptions.map((label: string) => {
          const matched = info.options.find((opt: any) => {
            const optLabel = typeof opt === "string" ? opt : opt.option;
            return optLabel === label;
          });
          const isSideChoice = info.title?.toLowerCase() === "side choices";
          return {
            key: info.title ?? label,
            value: matched?.option ?? label,
            price: matched?.price ?? null,
            include_price: isSideChoice,
          };
        });
      })
      .filter(Boolean)
      .flat();

    const newItem = {
      ...selectedItem,
      chefId: selectedItem?.chefId || null,
      quantity: 1,
      portion: selectedPortion || "full",
      additional_info: selectedAdditionalInfoArray,
    };

    data.push(newItem);
    setCart(data);
    localStorage.setItem("cart", JSON.stringify(data));
    closeModal();
  };

  const handleAdd = useCallback((data: any) => {
    if (!data) return;
    const availablePortions = [
      data.is_full_portion ? "full" : null,
      data.is_half_portion ? "half" : null,
      data.is_quarter_portion ? "quarter" : null,
    ].filter(Boolean);

    if (availablePortions.length > 1) {
      setSelectedItem(data);
      setSelectedPortion(availablePortions[0] as string);
      openModal("portionSelection");
      return;
    }

    if (availablePortions.length === 1) {
      const portion = availablePortions[0] as string;
      const hasValidAdditionalInfo = (data.additional_info || []).some(
        (info: any) => {
          if (!info || !info.title || !Array.isArray(info.options)) return false;
          return info.options.some((opt: any) => {
            const label = typeof opt === "string" ? opt : opt?.option;
            return label && label.toString().trim() !== "";
          });
        }
      );

      if (hasValidAdditionalInfo) {
        setSelectedItem(data);
        setSelectedPortion(portion);
        openModal("additionalInfo");
        return;
      }
      handleItemCountChange({ ...data, portion }, "decrement");
      return;
    }
    handleItemCountChange(data, "decrement");
  }, [handleItemCountChange]);

  const IsCartAdded = useCallback((id: string) => {
    const result = cart.filter(c => c.id === id);
    if (result && result.length > 0) {
      return true;
    }
    return false;
  }, [cart]);

  const getItemQuantity = useCallback((id: string) => {
    const result: any = cart.filter(c => c.id === id);
    if (result && result.length > 0) {
      return result[0].quantity;
    }
    return false;
  }, [cart]);

  const openModal = (modalName: string) => {
    setIsModalOpen(true);
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveModal(null);
    setSelectedItem(null);
  };

  const handleMenuClick = () => {
    setIsMenuModalOpen(true);
  };

  const handleMenuClose = () => {
    setIsMenuModalOpen(false);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setActiveModal(null);
  };

  const handleDetail = useCallback((data: any) => {
    setDetailModalOpen(true);
    setActiveModal('detail');
    setSelectedItem(data);
  }, []);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showBurger={true}
        showButton={true}
        showSwitch={true}
        headerStyle={{
          backgroundColor: theme.colors.background,
          zIndex: 1001,
        }}
        setIsGreenToggled={setIsGreenToggled}
        setIsRedToggled={setIsRedToggled}
        setIsOtherToggled={setIsOtherToggled}
        isBlurred={isModalOpen || detailModalOpen || offersModalOpen}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    const smallScreen = window.innerWidth === 320 && window.innerHeight === 568;

    const handleNavigation = (direction: 'left' | 'right') => {
      setCurrentSection((prevSection) => {
        if (direction === 'left') {
          return prevSection === 0 ? menus.length - 1 : prevSection - 1;
        } else {
          return prevSection === menus.length - 1 ? 0 : prevSection + 1;
        }
      });
    };

    return (
      <main className="scrollable"
        style={{
          overflowY: activeModal === 'portionSelection' || activeModal === 'detail' ? 'hidden' : 'auto',
          height: '100%',
          background: "linear-gradient(135deg, #fdfbf7 0%, #fff7ed 100%)",
        }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Modern Menu Navigation with Arrows */}
          <div className="container"
            style={{
              width: '100%',
              background: "#F2F4F5",
              paddingBlock: "16px",
              position: 'sticky',
              top: 0,
              zIndex: 100,
              marginBottom: theme.spacing.lg,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingInline: "16px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)",
              borderBottom: "1px solid #E5E7EB"
            }}
          >
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => handleNavigation('left')}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                outline: "none",
              }}
            >
              <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 9L14 0V18L0 9Z" fill="#0A685D" />
              </svg>
            </motion.button>

            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "28px",
                overflow: "hidden"
              }}
            >
              {(() => {
                if (menus.length === 0) return null;
                const prevIndex = currentSection === 0 ? menus.length - 1 : currentSection - 1;
                const nextIndex = currentSection === menus.length - 1 ? 0 : currentSection + 1;

                const itemsToShow = [];
                if (menus.length === 1) {
                  itemsToShow.push({ index: currentSection, menu: menus[currentSection], type: 'active' });
                } else if (menus.length === 2) {
                  itemsToShow.push({ index: prevIndex, menu: menus[prevIndex], type: 'prev' });
                  itemsToShow.push({ index: currentSection, menu: menus[currentSection], type: 'active' });
                } else {
                  itemsToShow.push({ index: prevIndex, menu: menus[prevIndex], type: 'prev' });
                  itemsToShow.push({ index: currentSection, menu: menus[currentSection], type: 'active' });
                  itemsToShow.push({ index: nextIndex, menu: menus[nextIndex], type: 'next' });
                }

                return itemsToShow.map(({ index, menu, type }) => {
                  const isActive = type === 'active';
                  return (
                    <motion.div
                      key={`${menu.name}-${index}-${type}`}
                      onClick={() => setCurrentSection(index)}
                      animate={{
                        scale: isActive ? 1.05 : 0.95,
                        opacity: isActive ? 1 : 0.6
                      }}
                      style={{
                        cursor: "pointer",
                        color: isActive ? "#000" : "#A3A3A3",
                        fontSize: isActive ? "16px" : "14px",
                        fontWeight: isActive ? 800 : 700,
                        whiteSpace: "nowrap",
                        fontFamily: "'Poppins', sans-serif"
                      }}
                    >
                      {menu.name}
                    </motion.div>
                  );
                });
              })()}
            </div>

            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => handleNavigation('right')}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                outline: "none",
              }}
            >
              <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 9L0 0V18L14 9Z" fill="#0A685D" />
              </svg>
            </motion.button>
          </div>

          <div
            className="content"
            style={{
              paddingBottom: itemCount > 0 ? "110px" : "90px",
              paddingTop: "10px",
              flex: 1,
              paddingInline: "16px"
            }}
          >
            {(menus.length === 0 && (isLoading || isFetching)) ? (
              <Loader text="Loading..." />
            ) : (
              <>
                <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                  {filteredItems && filteredItems.length > 0 ? (
                    <AnimatePresence mode='wait'>
                      <motion.div
                        key={currentSection}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {filteredItems.map((item: any) => {
                          const available = isItemAvailable(item.availability, currentTime);

                          return (
                            <ItemCard
                              key={item.id}
                              item={item}
                              available={available}
                              currency={currency}
                              onAdd={() => available && handleAdd(item)}
                              onDetail={() => handleDetail(item)}
                              onImageClick={() => available && handleAdd(item)}
                              handleItemCountChange={handleItemCountChange}
                              IsCartAdded={IsCartAdded}
                              getItemQuantity={getItemQuantity}
                            />
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  ) : (menus.length > 0 && checkedActiveOrder) ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="container"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 80,
                        padding: '40px 20px',
                        background: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: 24,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(0,0,0,0.05)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{
                        width: 80, height: 80, borderRadius: '35%',
                        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 20,
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        <FiSearch size={32} color="#CBD5E1" />
                      </div>
                      <h3 style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: theme.colors.text.primary,
                        textAlign: 'center',
                        marginBottom: 8,
                        fontFamily: "'Poppins', sans-serif"
                      }}>
                        No items available right now
                      </h3>
                      <p style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: theme.colors.text.secondary,
                        textAlign: 'center',
                        maxWidth: '260px',
                        lineHeight: 1.5,
                        marginBottom: 32
                      }}>
                        We don’t have any {isGreenToggled ? "Veg" : isRedToggled ? "Non Veg" : isOtherToggled ? "Other" : ""} items available for <b>{menus[currentSection]?.name}</b> at the moment.
                      </p>

                    </motion.div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>

        {(!isModalOpen && !isMenuModalOpen) && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMenuClick}
            style={{
              position: 'fixed',
              bottom: itemCount > 0 ? '100px' : '30px',
              right: '20px',
              zIndex: 1000,
              cursor: "pointer",
              background: "transparent",
              backdropFilter: "blur(0px)", // Removed blur as well if "no background" means completely clean
              color: "#fff",
              borderRadius: '50%',
              boxShadow: "none",
              padding: 0,
              width: 50,
              height: 50,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src={menu} alt="menu" style={{ width: '50px', height: '50px' }} />
          </motion.button>
        )}

        {(!isModalOpen && isMenuModalOpen) && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: itemCount > 0 ? '100px' : '30px',
              right: '20px',
              zIndex: 2000,
              cursor: "pointer",
              backgroundColor: "transparent", // Removed white background
              borderRadius: '50%',
              boxShadow: "none", // Removed shadow
              padding: 0,
              width: 50,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={handleMenuClose}
          >
            <img src={close} alt="close" style={{ width: '50px', height: '50px' }} />
          </motion.div>
        )}

        <MenuModal
          menus={menus}
          isOpen={isMenuModalOpen}
          onClose={handleMenuClose}
          setCurrentSection={setCurrentSection}
          smallScreen={smallScreen}
          hasCartItems={itemCount > 0}
        />

        <AnimatePresence>
          {(itemCount > 0) &&

            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className='container'
              style={{
                background: "#1F2937", // Dark background
                height: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: "space-between",
                position: "sticky",
                bottom: 20,
                margin: '0 auto',
                width: 'calc(100% - 32px)',
                maxWidth: '480px',
                zIndex: 200,
                padding: '0 16px',
                borderRadius: 16,
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer"
              }}
              onClick={() => nav('/orders')}
              whileTap={{ scale: 0.98 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiShoppingCart size={20} color="#fff" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1 }}>
                    {itemCount} {itemCount > 1 ? "Items" : "Item"}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 }}>
                    In your cart
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>Checkout</span>
                <FiArrowRight size={18} color="#fff" />
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </main>
    );
  };

  const activeOrderCheckDone = checkedActiveOrder === true;

  if (serviceAvailable === null) return <Loader text="Loading..." />;
  if (!serviceAvailable) return <UnavailableContent />;
  if (!activeOrderCheckDone) return <Loader text="Checking active orders..." />;

  // Only show loader if we are strictly waiting for menus/items initially and don't have them
  if (loading || !hasLoaded) return <Loader text="Loading menus..." />;

  return (
    <>
      {renderHeader()}
      {renderContent()}

      <ItemModal
        open={isModalOpen}
        item={selectedItem}
        selectedPortion={selectedPortion}
        setSelectedPortion={setSelectedPortion}
        onClose={() => {
          closeModal();
          setSelectedAdditionalInfo({});
        }}
        onAdd={handleAddCart}
        currency={currency}
        selectedAdditionalInfo={selectedAdditionalInfo}
        setSelectedAdditionalInfo={setSelectedAdditionalInfo}
      />

      <DetailModal
        open={detailModalOpen}
        item={selectedItem}
        onClose={closeDetailModal}
        galleryImages={galleryImages}
        onThumbnailClick={handleThumbnailClick}
      />

      <OffersModal
        open={offersModalOpen && activeModal === "offers"}
        offers={offers}
        onClose={closeOffersModal}
      />
    </>
  );
};