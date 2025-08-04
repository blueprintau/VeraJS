// VeraJS Framework Entry Point
// Import all core modules with proper ES6 imports

// Utilities
import { unwrapElement, unixToDate } from './utils/functions.js';
import { rule } from './utils/rule.js';
import { useCookie, setCookie, getCookie, removeCookie } from './utils/cookie.js';

// Core classes
import Component from './core/Component.js';
import VeraRouter from './core/VeraRouter.js';

// Reactive system
import { useRef, getRef, useEffect, isRef } from './ref.js';
import { useStore, getStore } from './store.js';

// Main framework
import VeraJS from './VeraJS.js';

// Create the main VeraJS API object that will be exposed
const VeraJSAPI = {
    // Core framework methods
    mount: VeraJS.mount,
    router: VeraJS.router,
    registerComponentClass: VeraJS.registerComponentClass,
    addComponent: VeraJS.addComponent,
    ABORT_MOUNT: VeraJS.ABORT_MOUNT,

    // Static properties that components need
    _componentClasses: VeraJS._componentClasses,
    _instance: VeraJS._instance,

    // Utility functions
    useRef,
    getRef,
    useStore,
    getStore,
    useEffect,
    isRef,
    rule,
    useCookie,
    setCookie,
    getCookie,
    removeCookie,
    unwrapElement,
    unixToDate,

    // Classes for extension
    Component,

    // Instance access (will be set after mount)
    get instance() {
        return VeraJS._instance;
    }
};

// Make VeraJS globally available FIRST
if (typeof window !== 'undefined') {
    window.VeraJS = VeraJSAPI;

    // Also expose utility functions globally for convenience
    window.useRef = useRef;
    window.getRef = getRef;
    window.useStore = useStore;
    window.getStore = getStore;
    window.useEffect = useEffect;
    window.isRef = isRef;
    window.rule = rule;
    window.useCookie = useCookie;
    window.setCookie = setCookie;
    window.getCookie = getCookie;
    window.removeCookie = removeCookie;
    window.unwrapElement = unwrapElement;
    window.unixToDate = unixToDate;
    window.Component = Component;
}

// Define VeraRouterView inline AFTER VeraJS is available
class VeraRouterView extends Component {
    init(props) {
        // Access via the global VeraJS
        if (window.VeraJS && window.VeraJS.router) {
            window.VeraJS.router()._setAnchorComponent(this);
        }
    }

    getTemplate() {
        return '<div id="{id}" class="vera-router-view"></div>';
    }

    render(component, params) {
        // Implementation here
    }
}

// Register the component using the global VeraJS
if (window.VeraJS) {
    window.VeraJS.registerComponentClass("VERA-ROUTER-VIEW", VeraRouterView);
}

// Export for module systems
export { VeraJSAPI as default, VeraJSAPI };