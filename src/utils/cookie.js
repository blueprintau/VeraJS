function useCookie(name, initialValue = null, expires = 7, path = '/') {
    // Create a ref that syncs with cookie
    const cookieRef = useRef(getCookie(name) || initialValue);

    // Override setValue to also update cookie
    const originalSetValue = cookieRef.setValue;
    cookieRef.setValue = function(value) {
        setCookie(name, value, expires, path);
        originalSetValue.call(this, value);
    };

    // Load initial value from cookie
    const storedValue = getCookie(name);
    if (storedValue !== null) {
        cookieRef._value = storedValue;
    } else if (initialValue !== null) {
        setCookie(name, initialValue, expires, path);
    }

    return cookieRef;
}

function setCookie(name, value, expires = null, path = '/') {
    let cookieString = `${name}=${encodeURIComponent(value)}`;

    // Handle expiration
    if (expires instanceof Date) {
        cookieString += `; expires=${expires.toUTCString()}`;
    } else if (typeof expires === 'number') {
        const expiryDate = new Date();
        expiryDate.setTime(expiryDate.getTime() + (expires * 24 * 60 * 60 * 1000));
        cookieString += `; expires=${expiryDate.toUTCString()}`;
    }

    // Always set path to ensure consistent cookie scope
    cookieString += `; path=${path}`;

    document.cookie = cookieString;
}

// GET a cookie
function getCookie(name, defaultValue = null) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return defaultValue;
}

// REMOVE a cookie
function removeCookie(name, options = {}) {
    let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    cookieString += `; path=${options.path || '/'}`;
    document.cookie = cookieString;
}

export { useCookie, setCookie, getCookie, removeCookie };