import Config from '../configs/config.json'
import { Toast, ToastBody, ToastHeader } from 'reactstrap'

const openNotification = (type, message, description) => (
    <Toast>
        <ToastHeader close={close} icon={type}>{message}</ToastHeader>
        <ToastBody> {description} </ToastBody>
    </Toast>
)

const Storage = {
    isLogedin: (para) => {  
        return localStorage.getItem('token') !== null
    },
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value))
    },
    get: (key, value) => {
        return JSON.parse(localStorage.getItem(key))
    },
    setString: (key, value) => {
        localStorage.setItem(key, value)
    },
    logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('auth')
    },
    getToken: (key, value) => {
        return (localStorage.getItem('token')) ? localStorage.getItem('token') : false
    }
}

const Service = {
    get: (para) => {
        const header = {
            "content-type": "application/json",
            accept: "application/json"
        }

        const token = localStorage.getItem('token')
        if (token) {
            header["Authorization"] = `TOKEN ${token}`
        }
        return fetch(Config.BASE_URL + para.url, {
            method: "GET",
            headers: header,
            body: para.body
        })
        .then((response) => {
            if (response.status === 401 || response.status === 403) {     //Unauthorized.  Invalid JWT Token
                Storage.logout()
                window.location.href = '/login'
            } else {
                return response.json()
            }
        }, (error) => {
            console.log(error)
            if (error === 'TypeError: NetworkError when attempting to fetch resource.') {
                openNotification('error', 'Unable to reach server.', 'Please check your network connectivity')
            }
        })
        //.then(response => response.json());
    },
    post: (para) => {
        const header = {}
        if (para.formdata) {
            // header["content-type"] = "multipart/form-data"
        } else {
            header["content-type"] = "application/json"
            header["accept"] = "application/json"
        }

        const token = localStorage.getItem('token')
        if (token) {
            header["Authorization"] = `TOKEN ${token}`
        }

        return fetch(Config.BASE_URL + para.url, {
            method: "POST",
            headers: header,
            body: para.body
        })
        .then((response) => {
            if (response.status === 401 || response.status === 403) {     //Unauthorized.  Invalid JWT Token
                Storage.logout()
                window.location.href = '/login'
            } else if (response.status === 400) {
                return {
                    status: 'error',
                    data: response.json()
                }
            } else {
                return response.json()
            }
        }, (error) => {
            console.log(error)
            if (error === 'TypeError: NetworkError when attempting to fetch resource.') {
                openNotification('error', 'Unable to reach server.', 'Please check your network connectivity')
            }
        })
        //.then(response => response.json())
    },
    patch: (para) => {

        const header = {}
        if (para.formdata) {
            // header["content-type"] = "multipart/form-data"
        } else {
            header["content-type"] = "application/json"
            header["accept"] = "application/json"
        }
        
        const token = localStorage.getItem('token')
        if (token) {
            header["Authorization"] = `TOKEN ${token}`
        }

        return fetch(Config.BASE_URL + para.url, {
            method: "PATCH",
            headers: header,
            body: para.body
        })
        .then((response) => {
            if (response.status === 401) {     //Unauthorized.  Invalid JWT Token
                Storage.logout()
                window.location.href = '/login'
            } else if (response.status === 400) {
                return {
                    status: 'error',
                    data: response.json()
                }
            } else {
                return response.json()
            }
        }, (error) => {
            console.log(error)
        })
        //.then(response => response.json())
    },
    put: (para) => {
        const header = {}
        if (para.formdata) {
            // header["content-type"] = "multipart/form-data"
        } else {
            header["content-type"] = "application/json"
            header["accept"] = "application/json"
        }

        const token = localStorage.getItem('token')
        if (token) {
            header["Authorization"] = `TOKEN ${token}`
        }

        return fetch(Config.BASE_URL + para.url, {
            method: "PUT",
            headers: header,
            body: para.body
        })
        .then((response) => {
            if (response.status === 401) {     //Unauthorized.  Invalid JWT Token
                Storage.logout()
                window.location.href = '/login'
            } else if (response.status === 400) {
                return {
                    status: 'error',
                    data: response.json()
                }
            } else {
                return response.json()
            }
        }, (error) => {
            console.log(error)
        })
        //.then(response => response.json())
    },
    delete: (para) => {
        const header = {
            "content-type": "application/json",
            accept: "application/json"
        }

        const token = localStorage.getItem('token')
        if (token) {
            header["Authorization"] = `TOKEN ${token}`
        }
        return fetch(Config.BASE_URL + para.url, {
            method: "DELETE", headers: header, body: para.body
        })
        .then((response) => {
            if (response.status === 401) {     //Unauthorized.  Invalid JWT Token
                Storage.logout()
                window.location.href = '/login'
            } else {
                return response.json()
            }
        }, (error) => {
            console.log(error)
            if (error === 'TypeError: NetworkError when attempting to fetch resource.') {
                openNotification('error', 'Unable to reach server.', 'Please check your network connectivity')
            }
        })
        //.then(response => response.json());
    },
    getImage(image) {
        return Config.MEDIA_URL + image
    }
}


export {Service, Storage}
