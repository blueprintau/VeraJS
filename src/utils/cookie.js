/**
 * @fileoverview Cookie management utilities for VeraJS framework
 * @version 1.0.0
 */

/**
 * @typedef {Object} CookieRef
 * @property {string} _id - Unique identifier for the ref
 * @property {*} _value - Current value of the cookie
 * @property {Function[]} _observers - Array of observer callbacks
 * @property {boolean} _ref - Flag indicating this is a ref object
 * @property {boolean} _isElement - Flag indicating if this is an element ref
 * @property {*} _element - Element reference (if applicable)
 * @property {Function} getValue - Get the current value
 * @property {Function} setValue - Set a new value and update cookie
 * @property {Function} addObserver - Add an observer callback
 */

/**
 * @typedef {Object} CookieOptions
 * @property {string} [path='/'] - Cookie path
 * @property {string} [domain] - Cookie domain
 * @property {boolean} [secure] - Whether cookie requires HTTPS
 * @property {string} [sameSite] - SameSite attribute value
 */

/**
 * Creates a reactive reference that syncs with a browser cookie
 * @param {string} name - Cookie name
 * @param {*} [initialValue=null] - Initial value if cookie doesn't exist
 * @param {number|Date|null} [expires=7] - Expiration in days (number) or Date object
 * @param {string} [path='/'] - Cookie path
 * @returns {CookieRef} Reactive reference object that syncs with cookie
 * @example
 * // Create a cookie ref with 30-day expiration
 * const userPref = useCookie('user_preference', 'dark', 30);
 *
 * // Update the cookie value
 * userPref.setValue('light');
 *
 * // Get current value
 * console.log(userPref.getValue()); // 'light'
 */
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

/**
 * Sets a browser cookie with the specified parameters
 * @param {string} name - Cookie name
 * @param {*} value - Cookie value (will be URL encoded)
 * @param {number|Date|null} [expires=null] - Expiration time
 *   - number: days from now
 *   - Date: specific expiration date
 *   - null: session cookie (expires when browser closes)
 * @param {string} [path='/'] - Cookie path
 * @returns {void}
 * @example
 * // Set a session cookie
 * setCookie('session_id', 'abc123');
 *
 * // Set a cookie that expires in 30 days
 * setCookie('remember_me', 'true', 30);
 *
 * // Set a cookie with specific expiration date
 * const futureDate = new Date('2025-12-31');
 * setCookie('special_offer', 'holiday2025', futureDate);
 */
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

/**
 * Retrieves a cookie value by name
 * @param {string} name - Cookie name to retrieve
 * @param {*} [defaultValue=null] - Default value if cookie doesn't exist
 * @returns {string|*} Cookie value (URL decoded) or default value
 * @example
 * // Get a cookie with default fallback
 * const theme = getCookie('theme', 'light');
 *
 * // Get a cookie that might not exist
 * const userId = getCookie('user_id');
 * if (userId === null) {
 *     console.log('User not logged in');
 * }
 */
function getCookie(name, defaultValue = null) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return defaultValue;
}

/**
 * Removes a cookie by setting its expiration to the past
 * @param {string} name - Cookie name to remove
 * @param {CookieOptions} [options={}] - Cookie options
 * @param {string} [options.path='/'] - Cookie path (must match the path used when setting)
 * @param {string} [options.domain] - Cookie domain (must match the domain used when setting)
 * @returns {void}
 * @example
 * // Remove a cookie with default path
 * removeCookie('user_session');
 *
 * // Remove a cookie with specific path
 * removeCookie('admin_token', { path: '/admin' });
 *
 * // Remove a cookie with domain and path
 * removeCookie('cross_domain_cookie', {
 *     path: '/',
 *     domain: '.example.com'
 * });
 */
function removeCookie(name, options = {}) {
    let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    cookieString += `; path=${options.path || '/'}`;

    // Add domain if specified
    if (options.domain) {
        cookieString += `; domain=${options.domain}`;
    }

    document.cookie = cookieString;
}

export { useCookie, setCookie, getCookie, removeCookie };