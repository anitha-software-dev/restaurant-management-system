
import React, { useEffect, useState } from 'react';
import { components } from '.';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import { FiMinus, FiPlus } from "react-icons/fi";
import { useNavigate, useParams } from 'react-router-dom';
import { getCollectionById, getCollectionByRestaurant } from '../services';
import { BeatLoader } from 'react-spinners'


interface Category {
    id: string;
    categoryName: string;
    restaurantId: string;
}

export const Modal: React.FC = () => {
    const { id }: any = useParams();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubModal, setIsSubModal] = useState(false);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [isRestaurant, setIsRestaurant] = useState(false);
    const [guestCounts, setGuestCounts] = useState({ adults: 0, kids: 0 });

    const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string[] }>({});

    const getDataList = (param: string) => {
        // GET CATEGORIES
        getCollectionByRestaurant('categories', param).then((data: any) => {
            setCategories(data);
        });

        // GET SUB CATEGORIES
        getCollectionByRestaurant('subcategories', param).then((data: any) => {
            setSubCategories(data);
        });
    }


    useEffect(() => {
        if (id) {
            // FETCH TABLE
            setIsLoading(true)
            getCollectionById('tables', id).then((data: any) => {
                if (data) {
                    setIsValid(true)
                    // FETCH RESTAURANT
                    getCollectionById('restaurants', data.restaurantId).then((result: any) => {
                        setIsLoading(false)
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
                    });
                } else {
                    setIsLoading(false)
                    setIsValid(false)
                }
            });
        }
    }, [id]);

    // FILTER SUB CATEGORIES
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

    const renderButton = (): JSX.Element => {
        const smallScreen = window.innerWidth === 320 && window.innerHeight === 568;
        return (
            <section
                className='container'
                style={{ marginBottom: 20 }}
            >
                <div style={{ marginBottom: "5%", marginTop: "15%" }}>
                    <components.Button
                        text='suggested'
                        onClick={() => { openModal({ id: 'main' }) }}

                        colorScheme="primary"
                    />
                </div>

                <p style={{ textAlign: "center", margin: "10px ", fontWeight: "800", fontFamily: "Poppins" }}>Or</p>

                <div style={{ marginTop: "5%", marginBottom: smallScreen ? '20%' : "5%", paddingBottom: smallScreen ? '20%' : '5%' }}>
                    <components.Button
                        text='show complete menu'
                        variant="inverse"
                        to='/shop'
                    />
                </div>

            </section>
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

                    {!isSubModal && (
                        <div>
                            <div style={{ marginTop: smallScreen ? '10%' : '0%', textAlign: 'center' }}>
                                {isLoading ? (
                                    <div style={{ marginTop: '3rem' }}>
                                        <BeatLoader />
                                    </div>
                                ) : (
                                    categories && categories.length > 0 && (
                                        <div
                                            style={{
                                                maxHeight: categories.length > 5
                                                    ? (smallScreen || smallScreenTwo || smallScreenThree ? '300px' : '380px')
                                                    : 'auto',
                                                overflowY: categories.length > 5 ? 'auto' : 'visible',
                                                // paddingRight: categories.length > 5 ? '10px' : '0px',
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
                                    )
                                )}
                            </div>
                        </div>
                    )}

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
            {renderModal()}
            {renderButton()}

        </>
    );
};
