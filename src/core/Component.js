/**
 * @fileoverview VeraJS Component Base Class
 * @version 1.0.0
 */

import VeraJS from '../VeraJS.js';
import { unwrapElement } from '../utils/functions.js';

/**
 * @typedef {Object} ComponentProps
 * @property {string} [id] - Component unique identifier
 * @property {string} [innerHTML] - Initial HTML content
 * @property {*} [key] - Any additional data attributes from element dataset
 */

/**
 * Base component class for all VeraJS components
 * @class
 * @global
 */
class Component {

    /**
     * Component's DOM element
     * @type {HTMLElement}
     * @private
     */
    _element;

    /**
     * Component's unique ID
     * @type {string}
     * @private
     */
    _id;

    /**
     * Parent component reference
     * @type {Component|null}
     * @private
     */
    _parent;

    /**
     * Get computed CSS style value for the component's element
     * @param {string} style - CSS property name
     * @param {boolean} [int=false] - Whether to return as integer
     * @returns {string|number} Style value
     */
    getComputedStyle(style, int = false){
        if(int){
            return parseInt(window.getComputedStyle(this._element,'div')[style]);
        }
        return window.getComputedStyle(this._element,'div')[style];
    }

    /**
     * Query for elements within this component
     * @param {string} selector - CSS selector
     * @param {boolean} [all=false] - Whether to return all matches
     * @returns {Element|NodeListOf<Element>|null} Found element(s)
     */
    querySelector(selector, all=false){
        if(all){
            return this._element.querySelectorAll(selector);
        }
        return this._element.querySelector(selector);
    }

    /**
     * Evaluate and instantiate child components
     * @private
     */
    _evaluateChildComponents(){
        this._checkElementAndChildren(this._element);
    }

    /**
     * Recursively check element and children for VeraJS components
     * @param {HTMLElement} element - Element to check
     * @private
     */
    _checkElementAndChildren(element) {
        // Check all direct children of this element
        Array.from(element.children).forEach(child => {

            if (VeraJS.getComponentClasses().has(child.tagName)) {

                let instance = new (VeraJS.getComponentClasses().get(child.tagName))();
                let outcome = instance.beforeMount();

                if(outcome === VeraJS.ABORT_MOUNT){
                    return;
                }

                let props = child.dataset;
                props.id = child.id || props.id || crypto.randomUUID();
                props.innerHTML = child.innerHTML;

                child.innerHTML = instance.getTemplate().replace(/\{([^}]+)}/g, (match, key) => {
                    return props[key] !== undefined ? props[key] : match;
                });

                let styleAttribute = child.getAttribute('style');

                unwrapElement(child);

                instance._element = document.getElementById(props.id);

                if (styleAttribute) {
                    instance._element.setAttribute('style', styleAttribute);
                }

                instance._id = props.id;
                instance._parent = this;

                if (instance._element) {
                    instance.init(props);
                    this._evaluateTemplateDirectives(instance);

                    // Let the component handle its own children
                    instance._evaluateChildComponents();
                    VeraJS.addComponent(instance);
                }

            }else{
                // Regular HTML element - recursively check its children
                this._checkElementAndChildren(child);
            }
        });
    }

    /**
     * Get the HTML template for this component
     * @abstract
     * @returns {string} HTML template string with {property} placeholders
     * @throws {Error} When not implemented by subclass
     */
    getTemplate(){
        throw new Error(`[Vera UIComponent Error] `+this.constructor.name+` doesnt implement the required abstract method getTemplate().`);
    }

    /**
     * Initialize the component with properties
     * @abstract
     * @param {ComponentProps} [props] - Component properties from dataset and attributes
     * @returns {void}
     * @throws {Error} When not implemented by subclass
     */
    init(props){
        throw new Error(`[Vera Component Error] `+this.constructor.name+` doesnt implement the required abstract method init().`);
    }

    /**
     * Optional lifecycle method called before component mounts
     * @returns {void|Symbol} Return VeraJS.ABORT_MOUNT to prevent mounting
     */
    beforeMount(){
        //Optional abstract method
    }

    /**
     * Get the component's DOM element
     * @returns {HTMLElement} The component's root element
     */
    getElement(){
        return this._element;
    }

    _evaluateTemplateDirectives(instance){
        // Get all elements and manually filter
        const allElements = instance._element.querySelectorAll('*');
        const clickElements = Array.from(allElements).filter(el => el.hasAttribute('@click'));

        clickElements.forEach(element => {
            const clickHandler = element.getAttribute('@click');
            element.addEventListener('click', (event) => {
                // Call the method on the instance
                if (typeof instance[clickHandler] === 'function') {
                    instance[clickHandler](event);
                } else {
                    throw new Error(`[VeraJS Error] Unable to call method ${clickHandler}, on object ${instance}`);
                }
            });
        });
    }

}

// Make Component available globally for component inheritance
window.Component = Component;
export default Component;