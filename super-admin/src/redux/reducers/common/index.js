// ** Initial State
const initialState = {
    locationData: [],
    doohLocationData: [],
    oohLocationData: [],
    deviceData: [],
    adsData: [],
    stateData: [],
    areaData: [],
    districtData: [],
    cityData: [],
    cityMoniteringData: [],
    isFetching: false
}

const common = (state = initialState, action) => {
    switch (action.type) {
        case 'GET_LOCATION_LIST':
            return { ...state, locationData: action.payload, isFetching: action.isFetching }
        case 'GET_DOOH_LOCATION_LIST':
            return { ...state, doohLocationData: action.payload, isFetching: action.isFetching }
        case 'GET_OOH_LOCATION_LIST':
            return { ...state, oohLocationData: action.payload, isFetching: action.isFetching }
        case 'GET_DEVICE_LIST':
            return { ...state, deviceData: action.payload, isFetching: action.isFetching }  
        case 'GET_ADS_LIST':
            return { ...state, adsData: action.payload, isFetching: action.isFetching }  
        case 'GET_STATES_LIST':
            return { ...state, stateData: action.payload, isFetching: action.isFetching } 
        case 'GET_AREA_LIST':
            return { ...state, areaData: action.payload, isFetching: action.isFetching } 
        case 'GET_DISTRICT_LIST':
            return { ...state, districtData: action.payload, isFetching: action.isFetching } 
        case 'GET_CITIES_LIST':
            return { ...state, cityData: action.payload, isFetching: action.isFetching } 
        case 'GET_CITIES_MONITERING_LIST':
            return { ...state, cityMoniteringData: action.payload, isFetching: action.isFetching } 
        default:
            return { ...state }
    }
}

export default common