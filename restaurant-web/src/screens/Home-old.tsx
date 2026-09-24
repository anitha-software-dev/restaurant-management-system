import { Action } from 'redux';
import React, { useEffect, useState } from 'react';
import { ThunkDispatch } from 'redux-thunk';
import { useDispatch } from 'react-redux';

import { hooks } from '../hooks';
import { RootState } from '../store';
import { components } from '../components';
import { actions } from '../store/actions';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import { FiMinus, FiPlus } from "react-icons/fi";
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getCollection, getCollectionById, getCollectionByRestaurant } from '../services';
import { BeatLoader, PropagateLoader } from 'react-spinners'

import food from '../assets/images/food.png'
import Config from '../configs/config.json';

interface Category {
  id: string;
  categoryName: string;
  restaurantId: string;
}

export const HomeOld: React.FC = () => {
  const dispatch = useDispatch<ThunkDispatch<RootState, void, Action>>();

  const { id }: any = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubModal, setIsSubModal] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [filteredList, setFilteredList] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [guestCounts, setGuestCounts] = useState({ adults: 0, kids: 0 });

  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string[] }>({});

  hooks.useThemeColor('#f2f4f4');

  useEffect(() => {
    setIsLoading(true)
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#f2f4f4'));
  }, []);

  const getDataList = (param: string) => {
    // GET CATEGORIES
    getCollectionByRestaurant('categories', param)
      .then((data: any) => {
        // console.log('categories', data);
        if (data) {
          setCategories(data);
        }
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
      });

    // GET SUB CATEGORIES
    getCollectionByRestaurant('subcategories', param).then((data: any) => {
      // console.log('subcategories', data)
      if (data) {
        setSubCategories(data);
      }
    });
  }

  useEffect(() => {
    console.log('id', id)
    if (id) {
      // FETCH TABLE
      setIsLoading(true)
      getCollectionById('tables', id).then((data: any) => {
        console.log('data', data)

        if (data) {
          setIsValid(true)
          // FETCH RESTAURANT
          getCollectionById('restaurants', data.restaurantId).then((result: any) => {

            if (result) {
              const res = result
              delete res.password

              localStorage.setItem('table', JSON.stringify(data))
              localStorage.setItem('restaurant', JSON.stringify(res))
              localStorage.setItem('token', id)

              getDataList(result.id)
              setIsRestaurant(true)
            } else {
              setIsRestaurant(false)
            }

            setTimeout(() => {
              setIsLoading(false)
            }, 800)
          });
        } else {
          setIsLoading(false)
          setIsValid(false)
        }
      });
    }
  }, [id]);

  //FILTER SUB CATEGORIES
  useEffect(() => {
    if (selectedCategory) {
      const filtered = subCategories.filter((item: any) => item.categoryId === (selectedCategory as { id: string }).id);
      if (filtered && filtered.length > 0) {
        setFilteredList(filtered);
      } else {
        setFilteredList([])
      }
    } else {
      setFilteredList([])
    }

  }, [selectedCategory]);


  const openModal = (value: object) => {
    setIsModalOpen(true);
    setSelectedCategory(value as Category);
    setActiveModal((value as Category).id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveModal(null);
    setIsSubModal(false);
  };

  const handleGuestCountChange = (type: 'adults' | 'kids', action: 'increment' | 'decrement') => {
    setGuestCounts((prev) => ({
      ...prev,
      [type]: action === 'increment' ? prev[type] + 1 : Math.max(prev[type] - 1, 0),
    }));
  };

  const handleCheckboxChange = (id: string, option: string) => {
    setSelectedOptions((prev) => {
      const currentSelected = prev[id] || [];
      const updatedSelected = currentSelected.includes(option)
        ? currentSelected.filter((opt) => opt !== option)
        : [...currentSelected, option];

      return { ...prev, [id]: updatedSelected };
    });
  };

  const renderCheckboxes = () => {
    const smallScreen = window.innerWidth === 320 && window.innerHeight === 568;
    const smallScreenTwo = window.innerWidth === 360 && window.innerHeight === 640;

    return (
      <div style={{
        border: "1px solid #e2e2e2", borderRadius: 10, padding: smallScreen ? 5 : 10,
      }}>
        <h4 style={{ fontFamily: "Poppins", fontSize: 16, fontWeight: 500, marginBottom: smallScreen ? 10 : 16, marginLeft: 10 }}>
          Select {selectedCategory && (selectedCategory as { categoryName: string }).categoryName}
        </h4>

        {selectedCategory?.categoryName === 'Guests' && selectedCategory?.id ? (
          <>
            <div className="row-center-space-between" style={{ marginBottom: 21, marginInline: 10 }}>
              <span style={{ fontSize: 14, fontFamily: 'Poppins' }}>Adults</span>
              <div style={{
                padding: '8px 10px', borderRadius: 10, display: 'flex', flexDirection: 'row', alignItems: 'center',
                justifyContent: 'space-between', width: '40%', backgroundColor: '#252525',
              }}>
                <button onClick={() => handleGuestCountChange('adults', 'decrement')}>
                  <FiMinus color='#fff' size={20} />
                </button>
                <span style={{ marginTop: 2, fontSize: 16, color: 'white', fontFamily: "Poppins" }}>
                  {guestCounts.adults}
                </span>
                <button onClick={() => handleGuestCountChange('adults', 'increment')}>
                  <FiPlus color='#fff' size={20} />
                </button>
              </div>
            </div>

            <div className="row-center-space-between" style={{ marginBottom: 21, marginInline: 10 }}>
              <span style={{ fontSize: 14, fontFamily: 'Poppins' }}>Kids</span>
              <div style={{
                padding: '8px 10px', borderRadius: 10, display: 'flex', flexDirection: 'row', alignItems: 'center',
                justifyContent: 'space-between', width: '40%', backgroundColor: '#252525',
              }}>
                <button onClick={() => handleGuestCountChange('kids', 'decrement')}>
                  <FiMinus color='#fff' size={20} />
                </button>
                <span style={{ marginTop: 2, fontSize: 16, color: 'white', fontFamily: "Poppins" }}>
                  {guestCounts.kids}
                </span>
                <button onClick={() => handleGuestCountChange('kids', 'increment')}>
                  <FiPlus color='#fff' size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          filteredList.map((option: any) => (
            <div key={option.id} style={{
              marginBottom:
                smallScreen
                  ? 10
                  : 15,
              marginLeft: 10
            }} >
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedOptions[(selectedCategory as { id: string })?.id || '']?.includes(option.id)}
                  onChange={() => handleCheckboxChange((selectedCategory as { id: string }).id || '', option.id)}
                  style={{
                    accentColor: '#f9791d',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ marginLeft: 8, fontFamily: "Poppins", fontSize: smallScreen || smallScreenTwo ? 12 : 14 }}>
                  {option.name}
                </span>
              </label>
            </div>
          ))
        )}
      </div>
    );
  };

  const handleBack = () => {
    setIsSubModal(false);
    setIsModalOpen(true);
  };

  const handleAddSelection = (categoryName: string) => {
    const isSelected = selectedOptions[categoryName]?.length > 0 || guestCounts.adults > 0 || guestCounts.kids > 0;

    if (isSelected) {
      navigate('/menu', { state: { selectedOptions, guestCounts } });
    }
  };


  const renderContent = (): JSX.Element => {

    const smallScreen = window.innerWidth === 320 && window.innerHeight === 568;

    const tableData = localStorage.getItem('table');
    const table = tableData ? JSON.parse(tableData) : null;

    const restaurant = localStorage.getItem('restaurant');
    const res = restaurant ? JSON.parse(restaurant) : null;

    const logoUrl = res && res.logo
      ? `${Config.MEDIA_URL}${res.logo}?alt=media`
      : food;

    return (
      <main
        className='scrollable center'
        style={{ zIndex: 1 }}
      >
        <div className='container' style={{ height: '100%' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              height: isModalOpen ? '30%' : '38%',
            }}>
            <h4
              style={{
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              Welcome to
            </h4>

            <img
              src={logoUrl}
              alt="Restaurant Logo"
              style={{
                width: '75%',
                marginBottom: 12,
              }}
            />
            <p
              className='t18'
              style={{ textAlign: 'center', marginBottom: 30, fontSize: 12 }}
            >
              We're delighted to have you dine with us!
            </p>
            <h4
              style={{
                textAlign: 'center',
                marginBottom: 12,
                textTransform: 'capitalize',
                fontWeight: 800
              }}
            >
              Table {(table) ? `- ${table?.number}` : ""}
            </h4>
          </div>
          <p
            className='t18'
            style={{
              textAlign: 'center', marginBottom: 30,
              fontSize: 12
            }}
          >
            Prepare to indulge in a culinary journey filled with flavors, passion, and unforgettable moments. Whether you're here for a quick bite, a family gathering, or a special celebration, our team is committed to making your experience exceptional.
          </p>
          <p
            className='t18'
            style={{ textAlign: 'center', fontWeight: 600, fontSize: 12 }}
          >
            Relax, savor every bite, and let us take care of the rest.
          </p>
          <p
            className='t18'
            style={{ textAlign: 'center', fontWeight: 600, fontSize: 12 }}
          >
            Bon appétit!
          </p>


          {/* <div style={{ marginBottom: "5%", marginTop: "15%" }}>
            <components.Button
              text='suggested'
              onClick={() => { openModal({ id: 'main' }) }}
              colorScheme="primary"
            />
          </div> */}

          {/* <p style={{ textAlign: "center", margin: "10px ", fontWeight: "800", fontFamily: "Poppins" }}>Or</p> */}

          {/* <div style={{ marginTop: "25%", paddingBottom: '5%' }}>
            <components.Button
              text='show menu'
              variant="inverse"
              onClick={() => { openModal({ id: 'main' }) }}
            />
          </div> */}

          <div style={{ marginTop: "25%", paddingBottom: '5%' }}>
            <components.Button
              text='show menu'
              variant="inverse"
              onClick={() => navigate('/shop')}
            />
          </div>

        </div>
      </main>
    );
  };

  const renderModal = (): JSX.Element | null => {
    if (!isModalOpen) return null;

    const smallScreen = window.innerWidth === 320 && window.innerHeight === 568;
    const smallScreenTwo = window.innerWidth === 360 && window.innerHeight === 640;
    const smallScreenThree = window.innerWidth === 375 && window.innerHeight === 667;


    return (
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          height: '100%'
        }}
      >

        <div
          style={{
            backgroundColor: '#fff',
            padding: 20,
            borderRadius: 3,
            position: 'relative',
            width: '100%',
            maxWidth: '600px',
            boxShadow: '0px -4px 10px rgba(128, 128, 128, 0.2)',
            height: "70%",
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {(isSubModal) &&
            <button
              onClick={handleBack}
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#000',
              }}
            >
              <FaArrowLeft size={16} style={{ marginTop: 3 }} />
              <span
                style={{ fontSize: "13px", fontFamily: 'Poppins', marginLeft: 5 }}
              >
                Back
              </span>
            </button>
          }

          <button
            onClick={closeModal}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: '#fff',
              borderRadius: "50%",
              border: '1px solid #dedede',
              padding: 2,
              fontSize: '20px',
              color: '#000',
            }}
          >
            <FaTimes />
          </button>


          {!isSubModal && (
            <div>
              <div style={{ marginTop: smallScreen ? '10%' : '0%', textAlign: 'center' }}>
                {isLoading ? (
                  <div style={{ marginTop: '3rem' }}>
                    <BeatLoader />
                  </div>
                ) : categories && categories.length > 0 ? (
                  <div
                    style={{
                      maxHeight:
                        categories.length > 5
                          ? smallScreen || smallScreenTwo || smallScreenThree
                            ? '300px'
                            : '380px'
                          : 'auto',
                      overflowY: categories.length > 5 ? 'auto' : 'visible',
                      marginTop: '20px',
                    }}
                  >
                    {categories.map((item: any) => (
                      <div key={item.categoryName} style={{ marginBottom: 15 }}>
                        <components.Button
                          text={item.categoryName}
                          colorScheme="primary"
                          onClick={() => {
                            openModal(item);
                            setIsSubModal(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='container'>
                    <p
                      className='t18'
                      style={{ textAlign: 'center', marginTop: 50, marginBottom: 30, fontSize: 16, opacity: 0.25 }}
                    >
                      No Categories Found!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isSubModal && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: selectedCategory ? '100%' : '0',
              }}
            >
              <div
                style={{
                  paddingTop: '15%',
                }}
              >
                {filteredList && filteredList.length > 0 ? (
                  renderCheckboxes()
                ) : (

                  <div className='container'>
                    <p
                      className='t18'
                      style={{ textAlign: 'center', marginTop: 50, marginBottom: 30, fontSize: 16, opacity: 0.25 }}
                    >
                      No SubCategories Found!
                    </p>
                  </div>
                )}
              </div>

              <components.Button
                text="Add"
                onClick={() => handleAddSelection(activeModal as string)}
                variant="inverse"
              />
            </div>
          )}


        </div>
      </div >
    );
  };

  const renderInvalidContent = (): JSX.Element => {
    return (
      <main
        className='scrollable center'
        style={{ zIndex: 1 }}
      >
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
            No Restaurant Found!
          </p>
        </div>
      </main>
    );
  };

  return (
    <>
      {(isLoading) ? <>
        <main className='scrollable center'>
          <div className='container' style={{ height: '100%', margin: 'auto' }}>
            <div style={{ marginTop: 150, textAlign: "center" }}>
              <BeatLoader />
            </div>
          </div>
        </main>
      </> : <>
        {(isRestaurant) ? <>
          {renderContent()}
          {renderModal()}
        </> : <>
          {renderInvalidContent()}
        </>}
      </>}

    </>
  );
};
