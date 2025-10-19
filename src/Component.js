/**
 * @fileoverview VeraJS Component Base Class
 * @version 1.0.0
 */

import VeraJS from './VeraJS.js';
import { unwrapElement } from './utils/functions.js';

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
     * Component's ID
     * @type {string}
     * @private
     */
    _id;

    /**
     * Component's DOM element
     * @type {HTMLElement}
     * @private
     */
    _element;

    /**
     * Parent component reference
     * @type {Component|null}
     * @private
     */
    _parent;

    /**
     * Array map of child elements
     * @type {Map}
     * @private
     */
    _children = new Map();

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
     * Query for a single element within this component
     * @param {string} selector - CSS selector
     * @returns {Element|NodeListOf<Element>|null} Found element(s)
     */
    querySelector(selector){
        return this._element.querySelector(selector);
    }

    /**
     * Query for elements within this component
     * @param {string} selector - CSS selector
     * @returns {Element|NodeListOf<Element>|null} Found element(s)
     */
    querySelectorAll(selector){
        return this._element.querySelectorAll(selector);
    }

    /**
     * Evaluate and instantiate child components
     * @internal
     */
    evaluateChildComponents(){
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

            if (!(child instanceof HTMLElement)) return;

            if (VeraJS.getComponentClasses().has(child.tagName)) {

                let props = child.dataset;

                props.id = child.id || props.id || crypto.randomUUID();
                props.innerHTML = child.innerHTML;

                let instance = new (VeraJS.getComponentClasses().get(child.tagName))();
                let outcome = instance.beforeMount(props);

                if(outcome === VeraJS.ABORT_MOUNT){
                    return;
                }

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
                this._addChild(instance._id,instance)

                if (instance._element) {
                    instance.init(props);
                    this._evaluateTemplateDirectives(instance);

                    // Let the component handle its own children
                    instance.evaluateChildComponents();

                    instance.ready(props);

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
     * After template is rendered and element exists in DOM
     * @param {ComponentProps} [props] - Component properties from dataset and attributes
     * @returns {void}
     */
    init(props = {}){}

    /**
     * Optional lifecycle method called before component mounts
     * @param {ComponentProps} [props] - Component properties from dataset and attributes
     * @returns {void|Symbol} Return VeraJS.ABORT_MOUNT to prevent mounting
     */
    beforeMount(props = {}){}

    /**
     * Optional lifecycle method called once the component and all its children are ready
     * @param {ComponentProps} [props] - Component properties from dataset and attributes
     * @returns {void}
     */
    ready(props = {}){}

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

    /**
     * Private accessor used by children to add themselves to the parent.
     * @param {string} id
     * @param {Component} component
     */
    _addChild(id,component){
        this._children.set(id,component);
    }


    /**
     * Retrieves a child element
     * @param {string} id
     * @returns {Component|null} Return child component object or null
     */
    getChild(id){
        return this._children.get(id);
    }

    /**
     * Retrieves a child element
     * @returns {Map<String, Component>} Return the parent component object
     */
    getChildren(){
        return this._children;
    }

    /**
     * Retrieves a child element
     * @returns {Component} Return the parent component object
     */
    getParent(){
        return this._parent;
    }

    /**
     * Returns the ID of the component
     * @returns {String} Return the parent component object
     */
    getId(){
        return this._element.id;
    }

    /**
     * Set the parent component
     * @param {Component|null} parent - The parent component or null
     * @returns {void}
     */
    setParent(parent){
        this._parent = parent;
    }

}

export default Component;