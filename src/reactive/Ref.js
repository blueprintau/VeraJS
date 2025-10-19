/**
 * Reactive reference class
 * @class
 */
class Ref {
    /**
     * @param {*} [value=null] - Initial value
     * @param {string} [id] - Unique identifier
     */
    constructor(value = null, id = crypto.randomUUID()) {
        /** @type {string} */
        this._id = id;

        /** @type {*} */
        this._value = value;

        /** @type {Function[]} */
        this._observers = [];

        /** @type {boolean} */
        this._ref = true;

        /** @type {boolean} */
        this._isElement = false;

        /** @type {HTMLElement|null} */
        this._element = null;
    }

    /**
     * Get the current value
     * @returns {*}
     */
    getValue() {
        return this._value;
    }

    /**
     * Set a new value and notify observers
     * @param {*} value
     */
    setValue(value) {
        this._value = value;
        this._observers.forEach(observer => observer(this._value));
    }

    /**
     * Add an observer callback
     * @param {Function} callback
     */
    addObserver(callback) {
        this._observers.push(callback);
    }
}

export default Ref;