/**
 * @fileoverview Reactive reference utilities for VeraJS framework
 * @module ref
 */

import Ref from './reactive/Ref.js';
import VeraJS from './VeraJS.js';

/**
 * Creates a reactive reference that tracks value changes and notifies observers
 * @param {*} [value=null] - Initial value for the reference
 * @param {string} [id] - Optional custom ID (auto-generated if not provided)
 * @returns {Ref} Reactive reference object
 * @example
 * // Create a simple ref
 * const count = useRef(0);
 *
 * // Create a ref with custom ID
 * const userId = useRef('user123', 'my-user-id');
 *
 * // Create a ref bound to an input element
 * const inputElement = document.querySelector('input');
 * const inputRef = useRef(inputElement);
 */
function useRef(value = null, id = crypto.randomUUID()) {
    const ref = new Ref(value, id);

    if (isElement(value, "INPUT")) {
        value.addEventListener("input", (event) => {
            ref.setValue(event.target.value);
        });
        ref._value = value.value;
        ref._element = value;
        ref._isElement = true;
    }

    VeraJS.addRef(ref);
    return ref;
}

/**
 * Retrieves an existing reactive reference by ID
 * @param {string} id - Reference ID to retrieve
 * @returns {Ref|null} The reactive reference or null if not found
 * @example
 * const myRef = getRef('my-ref-id');
 * if (myRef) {
 *     console.log(myRef.getValue());
 * }
 */
function getRef(id) {
    const ref = VeraJS.getRef(id);
    if (!ref) {
        console.warn(`[VeraJS] Ref with id "${id}" not found`);
        return null;
    }
    return ref;
}

/**
 * Checks if an object is a VeraJS reactive reference
 * @param {*} object - Object to check
 * @returns {boolean} True if object is a Ref, false otherwise
 * @example
 * const myRef = useRef(10);
 * console.log(isRef(myRef)); // true
 * console.log(isRef({})); // false
 */
function isRef(object){
    return object._ref ?? false;
}

/**
 * Registers a callback to execute when any of the specified refs change
 * @param {Function} callback - Function to call when refs change
 * @param {Ref[]} [refs=[]] - Array of refs to observe
 * @returns {void}
 * @example
 * const count = useRef(0);
 * const name = useRef('John');
 *
 * useEffect(() => {
 *     console.log('A ref changed!');
 * }, [count, name]);
 *
 * count.setValue(5); // Triggers callback
 */
function useEffect(callback, refs = []){
    refs.forEach(ref=>{
        ref.addObserver(callback);
    })
}

/**
 * Checks if a variable is an HTMLElement with a specific tag name
 * @param {*} variable - Variable to check
 * @param {string} name - Tag name to match (e.g., 'INPUT', 'DIV')
 * @returns {boolean} True if variable is an HTMLElement with matching tag name
 * @private
 */
function isElement(variable, name){
    if (!(variable instanceof HTMLElement)) return false;
    return variable.tagName === name;
}

export { useRef, getRef, useEffect, isRef };