/**
 * @fileoverview VeraJS Framework Core
 * @version 1.0.0
 */

import './types.js';
import Router from './routing/Router.js';
import Component from './Component.js';
import { unwrapElement } from './utils/functions.js';
import Ref from './reactive/Ref.js';
import Store from './reactive/Store.js';

/**
 * Main VeraJS Framework class
 * @class
 * @global
 */
class VeraJS {

    /**
     * Component instances map
     * @type {Map<string, Component>}
     * @private
     */
    _components;

    /**
     * Registered component classes
     * @type {Array}
     * @private
     */
    _registeredComponents;

    /**
     * Observer callbacks
     * @type {Array}
     * @private
     */
    _observer;

    /**
     * Active reactive references
     * @type {Array<Ref|Store>}
     * @private
     */
    _refs;

    /**
     * Callbacks to execute when app is ready
     * @type {Array<Function>}
     * @private
     */
    _whenReady = [];

    /**
     * Root component instance
     * @type {Component}
     * @internal
     */
    root;

    /**
     * Router instance
     * @type {Router}
     * @private
     */
    _router;

    /**
     * Named stores map
     * @type {Map<string, Store>}
     * @private
     */
    _stores;

    /**
     * Setup callback function
     * @type {Function}
     * @private
     */
    _setup;

    /**
     * Symbol to abort component mounting
     * @type {Symbol}
     * @static
     * @readonly
     */
    static ABORT_MOUNT = Symbol('ABORT_MOUNT');

    /**
     * Map of registered component classes
     * @type {Map<string, typeof Component>}
     * @static
     * @private
     */
    static _componentClasses = new Map();

    /**
     * Current framework instance
     * @type {VeraJS}
     * @static
     * @private
     */
    static _instance;

    /**
     * Create a new VeraJS instance
     * @param {string} id - DOM element ID to mount the app
     */
    constructor(id) {
        this._components = new Map();
        this._registeredComponents = [];
        this._observer = [];
        this._refs = [];
        this._router = new Router(this);
        this._stores = new Map();
        this._setup = ()=>{};

        try {
            let root = new Component();
            // @ts-ignore
            root._element = document.getElementById(id);
            root.getElement().classList.add('vera-root');
            this.root = root;
            this._router.setAnchorComponent(this.root);
        }catch (error) {
            throw new Error(`[Vera Error] Unable to mount app to `+id+` it doesnt exist in the DOM.`);
        }

        document.addEventListener("DOMContentLoaded", async () => {
            await this._setup();
            this.root.evaluateChildComponents();
            this._whenReady.forEach((item) => {
                item();
            });
            this._evaluateRefs();
        });
    }

    /**
     * Evaluate reactive references in the DOM
     * @param {HTMLElement} [selector] - Element to scan, defaults to root
     * @internal;
     */
    _evaluateRefs(selector = null){
        if(selector === null){
            selector = this.root.getElement();
        }

        selector.querySelectorAll('*').forEach((element)=> {

            if (!(element instanceof HTMLElement)) return;


            let ref = element.getAttribute('@ref');

            if(ref) {
                try {
                    // @ts-ignore
                    ref = VeraJS.getRef(ref);
                    // @ts-ignore
                    ref.addObserver((value)=>{
                        element.innerText = value;
                    });
                } catch (e) {
                    throw new Error(`[VeraJS Error] Unable to bind ref: ${ref} to element ${element} - the ref does not exist or hasn't been created yet.`);
                }
            }

            let portal = element.getAttribute('@portal');

            if(portal) {
                let position = portal.endsWith('.start') ? 'afterbegin' : 'beforeend';
                let cleanPortal = portal.endsWith('.start') ? portal.slice(0, -6) : portal;
                let targetContainer = eval(cleanPortal);

                Array.from(element.children).forEach(child => {
                    // @ts-ignore
                    child.dataset.portaled = "true";
                });

                if(position === 'afterbegin') {
                    targetContainer.insertBefore(element, targetContainer.firstChild);
                } else {
                    targetContainer.appendChild(element);
                }

                unwrapElement(element);
                console.log("Moved and unwrapped " + portal, element);
            }
        });
    }

    /**
     * Add a reactive reference to the framework
     * @param {Ref|Store} ref - Reactive reference to add
     * @private
     */
    _addRef(ref){
        this._refs.push(ref);
    }

    /**
     * Get a reactive reference by ID
     * @param {string} id - Reference ID
     * @returns {Ref|undefined} The reactive reference
     * @private
     */
    _getRef(id){
        let ref = this._refs.find((ref) => ref._id === id);
        if(ref instanceof Ref){
            return ref;
        }
        return undefined;
    }

    /**
     * Add a component instance to the framework
     * @param {Component} component - Component instance to add
     * @private
     */
    _addComponent(component){
        this._components.set(component.getId(), component);
    }

    /**
     * Add a component instance to the framework (static method)
     * @param {Component} component - Component instance to add
     * @static
     */
    static addComponent(component){
        VeraJS._instance._addComponent(component);
    }

    /**
     * Register a callback to execute when the framework is ready
     * @param {Function} callback - Callback function
     * @returns {void}
     */
    whenReady(callback){
        this._whenReady.push(callback);
    }

    /**
     * Set up the framework with a callback
     * @param {Function} callback - Setup callback function
     * @returns {VeraJS} Framework instance for chaining
     */
    setUp(callback){
        this._setup = callback;
        return this;
    }

    /**
     * Mount the VeraJS framework to a DOM element
     * @param {string} id - DOM element ID to mount to
     * @returns {VeraJS} Framework instance
     * @static
     */
    static mount(id){
        VeraJS._instance = new VeraJS(id);
        return VeraJS._instance;
    }

    /**
     * Register a component class with the framework
     * @param {string} key - Component tag name (uppercase with hyphens)
     * @param {typeof Component} componentClass - Component class to register
     * @static
     */
    static registerComponentClass(key, componentClass){
        VeraJS._componentClasses.set(key, componentClass);
    }

    /**
     * Get the router instance
     * @returns {Router} Router instance
     * @static
     */
    static router(){
        return VeraJS._instance._router;
    }

    /**
     * Get the map of registered component classes
     * @returns {Map<string, typeof Component>} Component classes map
     * @static
     */
    static getComponentClasses() {
        return VeraJS._componentClasses;
    }

    /**
     * Adds a new ref
     * @static
     * @param {Ref|Store} ref
     */
    static addRef(ref){
       VeraJS._instance._addRef(ref);
    }

    /**
     * Returns a ref by id
     * @static
     * @returns {Ref} VeraJS Ref
     * @param {string} id
     */
    static getRef(id){
        return VeraJS._instance._getRef(id);
    }

    /**
     * Adds a new store
     * @param {string} name
     * @param {Store} store
     * @static
     */
    static addStore(name,store){
        VeraJS._instance._addRef(store);
        VeraJS._instance._stores.set(name, store);
    }

    /**
     * Returns a store by name
     * @static
     * @param {string} name
     * @returns {Store} VeraJS Ref
     */
    static getStore(name){
        return VeraJS._instance._stores.get(name);
    }

}

export default VeraJS;