/**
 * @fileoverview RouteGroup class for organizing and prefixing routes
 * @version 1.0.0
 */

import Router from './Router.js';
import Component from "../Component.js";

/**
 * @typedef {Object} RouteOptions
 * @property {typeof Component} [layout] - Layout component (overrides group layout)
 * @property {Function | Function[]} [middleware] - Middleware (overrides group middleware)
 */

/**
 * RouteGroup class for organizing and prefixing routes with shared configuration
 * @class
 */
class RouteGroup {

    /**
     * Layout component for routes in this group
     * @type {typeof Component | null}
     * @private
     */
    _layout;

    /**
     * Middleware for routes in this group
     * @type {Function[]}
     * @private
     */
    _middleware = [];

    /**
     * URL prefix for all routes in this group
     * @type {string}
     * @private
     */
    _prefix = "";

    /**
     * Reference to the parent router instance
     * @type {Router}
     * @private
     */
    _router;

    /**
     * Create a new RouteGroup
     * @param {Router} router - The parent router instance
     */
    constructor(router){
        this._router = router;
    }

    /**
     * Set the layout component for all routes in this group
     * @param {typeof Component} layout - Layout component class
     * @returns {RouteGroup} Returns this for method chaining
     */
    layout(layout){
        if (typeof layout !== 'function' || !(layout.prototype instanceof Component)) {
            console.error("[VeraRouter] Layout must be a Component class");
            return this;
        }
        this._layout = layout;
        return this;
    }

    /**
     * Set middleware for all routes in this group
     * @param {Function | Function[]} middleware - Middleware function or array of middleware functions
     * @returns {RouteGroup} Returns this for method chaining
     */
    middleware(middleware){
        this._middleware = [
            ...this._middleware,
            ...(Array.isArray(middleware) ? middleware : [middleware])
        ];

        return this;
    }

    /**
     * Set URL prefix for all routes in this group
     * @param {string} prefix - URL prefix (e.g., '/admin', '/api')
     * @returns {RouteGroup} Returns this for method chaining
     */
    prefix(prefix){
        this._prefix = prefix;
        return this;
    }

    /**
     * Register a route within this group
     * @param {string} route - Route path (will be prefixed with group prefix)
     * @param {Function | typeof Component} handler - Route handler or component class
     * @param {RouteOptions} [options={}] - Route options
     * @returns {RouteGroup} Returns this for method chaining
     */
    route(route, handler, options = {}){
        let layout = options.layout !== undefined ? options.layout : this._layout;

        let middleware = [
            ...this._middleware,  // Start with group middleware
            ...(options.middleware ?
                (Array.isArray(options.middleware) ? options.middleware : [options.middleware])
                : [])
        ];

        this._router.route(this._prefix+route, handler, layout, middleware);
        return this;
    }
}

export default RouteGroup;