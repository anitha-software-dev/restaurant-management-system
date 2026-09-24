//welcome page -------- /

import { Action } from 'redux';
import React, { useEffect, useState } from 'react';
import { ThunkDispatch } from 'redux-thunk';
import { useDispatch } from 'react-redux';

import { hooks } from '../hooks';
import { RootState } from '../store';
import { components } from '../components';
import { actions } from '../store/actions';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCollectionByRestaurant } from '../services';
import { BeatLoader } from 'react-spinners'
import { FiMinus, FiPlus } from "react-icons/fi";
import food from '../assets/images/food.png'
import { getFirebaseImageUrl, handleImageError } from '../utils/imageUtils';

interface Category {
    id: string;
    categoryName: string;
    restaurantId: string;
}

export const Menu: React.FC = () => {

    const dispatch = useDispatch<ThunkDispatch<RootState, void, Action>>();

    const location = useLocation()
    const navigate = useNavigate();

    const [guestCounts, setGuestCounts] = useState(location.state?.guestCounts || { adults: 0, kids: 0 })
    const [selectedOptions, setSelectedOptions] = useState(location.state?.selectedOptions || {});

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [filteredList, setFilteredList] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubModal, setIsSubModal] = useState(false);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    hooks.useThemeColor('#f2f4f4');

    useEffect(() => {
        window.scrollTo(0, 0);
        dispatch(actions.setColor('#f2f4f4'));
    }, []);

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

    const restaurant = localStorage.getItem('restaurant');
    const res = restaurant ? JSON.parse(restaurant) : null;

    const tableData = localStorage.getItem('table');
    const table = tableData ? JSON.parse(tableData) : null;

    const logoUrl = getFirebaseImageUrl(res?.logo, food);

    useEffect(() => {
        setIsLoading(true);

        if (res && res.id) {
            getCollectionByRestaurant('categories', res.id)
                .then((data: any) => {
                    if (data) {
                        setCategories(data);
                    }
                    setIsLoading(false);
                })
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);

        if (res && res.id) {
            getCollectionByRestaurant('subcategories', res.id)
                .then((data: any) => {
                    if (data) {
                        setSubCategories(data);
                    }
                    setIsLoading(false);
                })
        }
    }, []);

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


    const handleAddSelection = (categoryName: string) => {
        const isSelected = selectedOptions[categoryName]?.length > 0 || guestCounts.adults > 0 || guestCounts.kids > 0;

        if (isSelected) {
            navigate('/menu', { state: { selectedOptions, guestCounts } });
            setIsModalOpen(false)
        }
    };

    const handleGuestCountChange = (type: 'adults' | 'kids', action: 'increment' | 'decrement') => {
        setGuestCounts((prev: { adults: number; kids: number }) => ({
            ...prev,
            [type]: action === 'increment' ? prev[type] + 1 : Math.max(prev[type] - 1, 0),
        }));
    };


    const handleCheckboxChange = (id: string, option: string) => {
        setSelectedOptions((prev: { [key: string]: string[] }) => {
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
        const token = localStorage.getItem('token');
        if (token) {
            navigate(`/${token}`)
        }
    }
    const handleModalBack = () => {
        setIsSubModal(false);
        setIsModalOpen(false);
    };
    const handleProceed = () => {
        navigate("/shop", {
            state: { selectedOptions, guestCounts }
        })
    }

    const renderContent = (): JSX.Element => {
        const smallScreen = window.innerWidth === 320 && window.innerHeight === 568;
        const smallScreenTwo = window.innerWidth === 360 && window.innerHeight === 640 || window.innerWidth === 375 && window.innerHeight === 667;

        return (
            <main
                className='scrollable center'
                style={{ zIndex: 1 }}
            >
                <div className='container' style={{ height: '100%' }}>
                    <button
                        onClick={handleBack}
                        style={{
                            position: 'absolute',
                            top: 20,
                            left: 20,
                            background: 'none',
                            border: 'none',
                            fontSize: '14px',
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

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            height:
                                smallScreen
                                    ? '45%'
                                    : smallScreenTwo
                                        ? '40%'
                                        : '30%'

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
                            onError={handleImageError}
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

                    <div>
                        <div style={{ marginTop: smallScreen ? '10%' : '20%', marginBottom: '15%' }}>

                            {isLoading ? (
                                <div style={{ marginTop: '7rem', textAlign: 'center' }}>
                                    <BeatLoader />
                                </div>
                            ) : (
                                <>
                                    {categories && categories.length > 0 ? (
                                        categories.map((item: any) => (
                                            <div key={item.id} style={{ marginBottom: 15 }}>
                                                <components.Button
                                                    text={item.categoryName}
                                                    colorScheme={
                                                        item.categoryName === 'Guests' &&
                                                            (guestCounts.adults > 0 || guestCounts.kids > 0)
                                                            ? 'orange'
                                                            : selectedOptions[item.id]?.length > 0
                                                                ? 'orange'
                                                                : 'primary'
                                                    }
                                                    onClick={() => {
                                                        openModal(item);
                                                        setIsSubModal(true);
                                                    }}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ textAlign: 'center' }}>No categories available.</p>
                                    )}

                                    {categories.some(
                                        (item: any) =>
                                            (item.categoryName === "Guests" && (guestCounts.adults > 0 || guestCounts.kids > 0)) ||
                                            selectedOptions[item.id]
                                    ) && (
                                            <div style={{ marginBottom: smallScreen ? '20%' : '10%', paddingBottom: categories.length > 5 ? '20%' : '5%', }}>
                                                <components.Button
                                                    text="Proceed"
                                                    colorScheme="primary"
                                                    variant="inverse"
                                                    onClick={handleProceed}
                                                />
                                            </div>
                                        )}
                                </>)}
                        </div>

                    </div>
                </div>
            </main>
        );
    };

    const renderModal = (): JSX.Element | null => {
        if (!isModalOpen) return null;

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
                            onClick={handleModalBack}
                            style={{
                                position: 'absolute',
                                top: 20,
                                left: 20,
                                background: 'none',
                                border: 'none',
                                fontSize: '14px',
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
                            fontSize: '14px',
                            color: '#000',
                        }}
                    >
                        <FaTimes />
                    </button>


                    {(isSubModal) &&
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: selectedCategory ? '100%' : '0',
                        }}>
                            <div
                                style={{
                                    paddingTop: '15%'
                                }}
                            >
                                {(filteredList && filteredList.length > 0) && renderCheckboxes()}
                            </div>

                            <components.Button
                                text="Add"
                                onClick={() => handleAddSelection(activeModal as string)}
                                variant="inverse"
                            />
                        </div>
                    }
                </div>
            </div >
        );
    };

    return (
        <>
            {renderContent()}
            {renderModal()}

        </>
    );
};
