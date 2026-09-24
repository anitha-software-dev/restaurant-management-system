const AuthService = {
    isLogedin: (para) => {  
        return localStorage.getItem('token') !== null;
    },
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    get: (key, value) => {
        return JSON.parse(localStorage.getItem(key));
    },
    getToken: () => {
        return JSON.parse(localStorage.getItem(key));
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('auth');
    }
};

export { AuthService };
