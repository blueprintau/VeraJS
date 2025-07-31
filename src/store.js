// CREATE stores (like useRef creates refs)
function useStore(name, initialState = {}) {
    // Check if the store already exists
    if (VeraJS._instance._stores.has(name)) {
        console.warn(`Store '${name}' already exists. Returning existing store.`);
        return VeraJS._instance._stores.get(name)
    }

    const store = {
        _id: crypto.randomUUID(),
        _name: name,
        _initialState: { ...initialState },
        _state: { ...initialState },
        _observers: [],
        _ref: true,
        _store: true,

        getState(key) {
            return key ? this._state[key] : { ...this._state };
        },

        setState(updates) {
            if (typeof updates === 'function') {
                updates = updates(this._state);
            }

            //const prevState = { ...this._state };
            this._state = { ...this._state, ...updates };
            this._observers.forEach(observer => observer(this._state));
        },

        // Reset method - rolls back to initial state if no argument provided
        reset(newState = null) {
            // If no newState provided, use the original initial state
            this._state = newState ? { ...newState } : { ...this._initialState };
            this._observers.forEach(observer => observer(this._state));
        },

        addObserver(callback) {
            this._observers.push(callback);
        }
    };

    VeraJS._instance._addRef(store);
    VeraJS._instance._stores.set(name, store);
    return store;
}

// GET existing stores (different name for retrieval)
function getStore(name) {
    return VeraJS._instance._stores.get(name) || null;
}