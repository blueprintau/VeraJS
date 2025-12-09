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
     * @type {Map<string,Component>}
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
     * @param {String} name The name of the slot we are trying to retrieve
     * @returns {HTMLElement|null} Returns the slots HTMLElement.
     */
    getSlot(name){
        // First check if this element itself is the slot
        if (this._element.getAttribute('data-slot') === name) {
            return this._element;
        }

        // Recursively search for the slot
        return this._findSlotElement(this._element, name);
    }

    /**
     * Finds a slot element within the component's DOM tree
     * @param {HTMLElement} rootElement
     * @param {String} slotName
     * @returns {HTMLElement|null}
     * @private
     */
    _findSlotElement(rootElement, slotName) {
        // Check all child elements (not components in _children Map)
        for (const child of Array.from(rootElement.children)) {

            // Skip if not an HTMLElement
            if (!(child instanceof HTMLElement)) continue;

            // Skip if this element IS a child component (check by ID in _children)
            if (child.id && this._children.has(child.id)) {
                console.log("Skipping child component:", child.id);
                continue;
            }

            // Check if this element is the slot
            if (child.getAttribute("data-slot") === slotName) {
                return child;
            }

            // Recursively search this child's children
            const found = this._findSlotElement(child, slotName);

            if (found) {
                return found;
            }
        }

        return null;
    }

    /**
     * Gets all components that are currently rendered in a slot
     * @param {string} name - Name of the slot
     * @returns {Map<string, Component>} Map of components in the slot (id -> component)
     */
    getChildrenFromSlot(name) {
        const slot = this.getSlot(name);

        if (!slot) {
            return new Map();
        }

        const components = new Map();

        // Check all direct children of the slot
        Array.from(slot.children).forEach(child => {
            if (child instanceof HTMLElement && child.id) {
                const component = this.getChild(child.id);
                if (component) {
                    components.set(child.id, component);
                }
            }
        });

        return components;
    }


    /**
     * Programmatically create and mount a child component
     * @param {typeof Component} componentClass - The component class to instantiate
     * @param {Object} [props={}] - Props to pass to the component as data attributes
     * @param {HTMLElement} [targetElement=this._element] - Container element
     * @returns {Component} The instantiated component instance
     */
    addComponent(componentClass, props = {}, targetElement = this._element) {
        // Get the tag name
        let tagName = VeraJS.helpers().components.generateTag(componentClass);

        // Register component if not already registered
        if (!VeraJS.getComponentClasses().has(tagName)) {
            VeraJS.registerComponentClass(tagName, componentClass);
        }

        // Generate ID if not provided
        const id = props.id || crypto.randomUUID();

        // Build data attributes string for HTML
        let dataAttrs = VeraJS.helpers().components.buildDataAttributesString(props);

        // Get innerHTML if provided
        const innerHTML = props.innerHTML || '';

        // Create the element HTML string with data attributes
        const elementHTML = `<${tagName.toLowerCase()} id="${id}"${dataAttrs}>${innerHTML}</${tagName.toLowerCase()}>`;

        // Insert into DOM
        targetElement.insertAdjacentHTML('beforeend', elementHTML);

        this.evaluateChildComponents();

        // Evaluate to instantiate the component
        this._evaluateTemplateDirectives(this);

        // Return the component instance
        return this.getChild(id);
    }

    /**
     * Mount a pre-instantiated component with full lifecycle
     * Use case: Create instance, configure it programmatically, then mount
     * @param {Component} componentInstance - Already instantiated component
     * @param {HTMLElement} [targetElement=this._element] - Container element
     * @returns {Component} The mounted component instance
     */
    mountComponent(componentInstance,targetElement = this._element) {

        // Get the tag name
        let tagName = VeraJS.helpers().components.generateTag(componentInstance.constructor);

        // Register component if not already registered
        if (!VeraJS.getComponentClasses().has(tagName)) {
            VeraJS.registerComponentClass(tagName, componentInstance.constructor);
        }

        //Set the id if it's not already set
        if(!componentInstance._id){
            componentInstance._id = crypto.randomUUID();
        }

        // Get props from instance
        let props = {
            id: componentInstance._id,
            innerHTML: '',
            ...componentInstance.getProps()
        };

        // Run beforeMount - check for abort
        const outcome = componentInstance.beforeMount(props);

        if (outcome === VeraJS.ABORT_MOUNT) {
            return null;
        }

        // Create the element HTML string with data attributes
        const elementHTML = componentInstance.getTemplate().replace(/\{([^}]+)}/g, (match, key) => {
            return props[key] !== undefined ? props[key] : match;
        });

        // Insert into DOM
        targetElement.insertAdjacentHTML('beforeend', elementHTML);

        //Set our element
        componentInstance._element = document.getElementById(componentInstance._id);

        //Run init
        componentInstance.init(props);

        //Evaluate child components
        this._evaluateTemplateDirectives(componentInstance);

        componentInstance.evaluateChildComponents();

        //run ready
        componentInstance.ready(props);

        this._addChild(componentInstance._id,componentInstance);

        componentInstance._parent = this;

        VeraJS.addComponent(componentInstance);

        // Return the component instance
        return this.getChild(componentInstance._id);
    }

    unmount() {
        this.beforeUnmount();

        // Recursively unmount all children first
        Array.from(this.getChildren().values()).forEach(child => {
            child.unmount();
        });

        // Remove from parent's children map
        if (this._parent) {
            this._parent._children.delete(this._id);
        }

        // Remove from VeraJS global registry
        VeraJS.removeComponent(this);

        // Remove from DOM
        if (this._element) {
            this._element.remove();
        }

        // Clear references
        this._element = null;
        this._parent = null;
        this._children.clear();
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
     * Optional lifecycle method called before the component unmounts
     */
    beforeUnmount(){}

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

    /**
     * Get all class properties as a JSON-serializable object (primitives only - String,Number,Boolean)
     * @returns {Object}
     */
    getProps(){
        return VeraJS.helpers().components.extractPropsFromInstance(this);
    }

}

export default Component;