// VeraJS Framework Entry Point

// Utilities
import { unwrapElement, unixToDate } from './utils/functions.js';
import { useCookie, setCookie, getCookie, removeCookie } from './utils/cookie.js';

// Core classes
import Component from './Component.js';
import Router from './routing/Router.js';

// Reactive system
import { useRef, getRef, useEffect, isRef } from './ref.js';
import { useStore, getStore } from './store.js';

// Main framework
import VeraJS from './VeraJS.js';
import RouterView from "./routing/RouterView.js";

// Register VeraRouterView
VeraJS.registerComponentClass("VERA-ROUTER-VIEW", RouterView);

// Export default
export default VeraJS;

// Named exports for ES6 module imports
export {
    // Core classes
    Component,
    Router,
    RouterView,

    // Reactive system
    useRef,
    getRef,
    useStore,
    getStore,
    useEffect,
    isRef,

    // Utilities
    useCookie,
    setCookie,
    getCookie,
    removeCookie,
    unwrapElement,
    unixToDate,
};