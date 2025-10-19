/**
 * @fileoverview Reactive store utilities for VeraJS framework
 * @module store
 */

import Store from './reactive/Store.js';
import VeraJS from './VeraJS.js';

/**
 * Creates or retrieves a reactive store for managing application state
 * @param {string} name - Unique name for the store
 * @param {Object} [initialState={}] - Initial state object
 * @returns {Store} Reactive store object
 * @example
 * // Create a new store
 * const userStore = useStore('user', {
 *     name: 'John',
 *     age: 30
 * });
 *
 * // Update state
 * userStore.setState({ age: 31 });
 *
 * // Get specific state value
 * console.log(userStore.getState('name')); // 'John'
 *
 * // Reset to initial state
 * userStore.reset();
 */
function useStore(name, initialState = {}) {
    if (VeraJS.getStore(name) !== null) {
        console.warn(`Store '${name}' already exists. Returning existing store.`);
        return VeraJS.getStore(name);
    }

    const store = new Store(name, initialState);
    VeraJS.addStore(name, store);
    return store;
}

/**
 * Retrieves an existing store by name
 * @param {string} name - Store name to retrieve
 * @returns {Store|null} The store object or null if not found
 * @example
 * const userStore = getStore('user');
 * if (userStore) {
 *     console.log(userStore.getState());
 * }
 */
function getStore(name) {
    return VeraJS.getStore(name) || null;
}

export { useStore, getStore };