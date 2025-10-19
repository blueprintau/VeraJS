/**
 * Reactive store class
 * @class
 */
class Store {
    /**
     * @param {string} name - Store name
     * @param {Object} [initialState={}] - Initial state
     */
    constructor(name, initialState = {}) {
        /** @type {string} */
        this._id = crypto.randomUUID();

        /** @type {string} */
        this._name = name;

        /** @type {Object} */
        this._initialState = { ...initialState };

        /** @type {Object} */
        this._state = { ...initialState };

        /** @type {Function[]} */
        this._observers = [];

        /** @type {boolean} */
        this._ref = true;

        /** @type {boolean} */
        this._store = true;
    }

    /**
     * Get state or specific key
     * @param {string} [key] - Optional key to get specific state property
     * @returns {*}
     */
    getState(key) {
        return key ? this._state[key] : { ...this._state };
    }

    /**
     * Update state and notify observers
     * @param {Object|Function} updates - State updates or updater function
     */
    setState(updates) {
        if (typeof updates === 'function') {
            updates = updates(this._state);
        }
        this._state = { ...this._state, ...updates };
        this._observers.forEach(observer => observer(this._state));
    }

    /**
     * Reset to initial state or new state
     * @param {Object} [newState=null] - Optional new state
     */
    reset(newState = null) {
        this._state = newState ? { ...newState } : { ...this._initialState };
        this._observers.forEach(observer => observer(this._state));
    }

    /**
     * Add an observer callback
     * @param {Function} callback
     */
    addObserver(callback) {
        this._observers.push(callback);
    }
}

export default Store;