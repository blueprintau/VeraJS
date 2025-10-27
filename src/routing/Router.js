import RouteGroup from './RouteGroup.js';
import VeraJS from "../index.js";
import Component from "../Component.js";

class Router {

    /** @type {Component} */
    _anchorComponent;

    /** @type {VeraJS} */
    _vera

    /** @type {string} */
    _currentLayout;

    constructor(vera) {
        this._routes = new Map();        // For exact routes
        this._dynamicRoutes = [];        // For :param and * routes
        this._currentMatch = null;       // Cache current match
        this._lastUrl = null;
        this._vera = vera;
    }

    route(route, component, layout = null, middleware = []) {

        if (route !== '/' && route.endsWith('/')) {
            route = route.slice(0, -1);
        }

        if (route.includes(':') || route.includes('*')) {
            // Dynamic route with parameters - store in same format as exact routes
            this._dynamicRoutes.push({
                path: route,
                component: {component: component, layout: layout, middleware: middleware}, // Fixed: wrap in same format
                regex: this._pathToRegex(route)
            });
        } else {
            // Exact route - use Map for O(1) lookup
            this._routes.set(route, {component: component, layout: layout, middleware: middleware});
        }

        return this;
    }

    /**
     * Creates a group of routes
     * @returns {RouteGroup} Returns a new instance of the route group object.
     */
    group() {
        return new RouteGroup(this);
    }
    /**
     * Creates a group of routes
     * @param {Component} component The name of the route group.
     * @returns void
     */
    setAnchorComponent(component) {
        this._anchorComponent = component;
    }

    // Most efficient current route check
    getCurrentMatch() {
        const currentUrl = window.location.pathname;

        // Only recalculate if URL changed
        if (this._lastUrl !== currentUrl) {
            this._lastUrl = currentUrl;
            this._currentMatch = this._findMatch(currentUrl);
        }

        return this._currentMatch;
    }

    _findMatch(path) {

        if (path !== '/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        // Fast exact match first - O(1)
        if (this._routes.has(path)) {
            return {
                component: this._routes.get(path),
                params: {},
                path: path
            };
        }

        // Check dynamic routes - O(n)
        for (const route of this._dynamicRoutes) {
            const match = path.match(route.regex);
            if (match) {
                return {
                    component: route.component,
                    params: match.groups || {},
                    path: path,
                    route: route.path
                };
            }
        }

        // Return 404 route match instead of navigating
        if (this._routes.has("/404")) {
            return {
                component: this._routes.get("/404"),
                params: {},
                path: path,  // Keep the original path that failed
                is404: true  // Optional flag to indicate this is a 404
            };
        }

        // Strict mode - no 404 route defined
        throw new Error(`[VeraRouter] No route found for "${path}" and no 404 handler is registered. Register a /404 route to handle missing pages.`);
    }

    // Quick boolean checks
    isCurrentRoute(routePath) {
        return window.location.pathname === routePath;
    }

    // Convert route pattern to regex
    _pathToRegex(path) {
        return new RegExp(
            '^' + path
                .replace(/\//g, '\\/')
                .replace(/:(\w+)/g, '(?<$1>[^/]+)')
                .replace(/\*/g, '.*') + '$'
        );
    }

    // Navigate programmatically
    navigate(path) {
        history.pushState({}, '', path);
        this._invalidateCache();
        this._handleRouteChange();
    }

    // Invalidate cache when URL changes
    _invalidateCache() {
        this._currentMatch = null;
        this._lastUrl = null;
    }

    // Handle route changes
    _handleRouteChange() {
        const match = this.getCurrentMatch();

        if (match && match.component) {

            if (match.component.middleware) {
                for (const middleware of match.component.middleware) {
                    let result = middleware(match);
                    if (result === VeraJS.ABORT_MOUNT) {
                        return;
                    }
                }
            }

            // Check if it's a regular function (not a component class)
            if (typeof match.component.component === "function" && !match.component.component.prototype?.getTemplate) {
                match.component.component(); // Execute the function
            } else {
                // Render the component
                this.render(match)
            }
        }
    }

    render(match){

        if (!this._anchorComponent || !(this._anchorComponent instanceof Component)) {
            console.error('[VeraJS.Router] Cannot render: anchor component not set or invalid.');
            return;
        }

        if (!match.component) {
            console.error('[VeraJS.Router] Cannot render: route component must be either a function or component.');
            return;
        }

        if (typeof match.component.component !== 'function') {
            console.error('[VeraJS.Router] Cannot render: route component must be either a function or component.');
            return;
        }

        if (!(match.component.component.prototype instanceof Component)) {
            console.error('[VeraJS.Router] Cannot render: route component must be a Component class.');
            return;
        }

        const id = crypto.randomUUID();

        const tagName = match.component.component.name
            .replace(/([A-Z])/g, (match, letter, index) => {
                return index === 0 ? letter : '-' + letter;
            })
            .toUpperCase();

        const newLayout = match.component.layout;

        // CASE 1: No layout needed
        if (newLayout === null || !Component.isPrototypeOf(newLayout)) {
            //console.log("CASE 1")
            let html =  `<${tagName.toLowerCase()} id="${id}"></${tagName.toLowerCase()}>`;
            this._renderComponent(this._anchorComponent,html);
            this._currentLayout = null;
            return;
        }

        // CASE 2: Same layout - just replace content inside layout
        if (newLayout === this._currentLayout) {
           // console.log("CASE 2")

            let html = `<${tagName.toLowerCase()} id="${id}"></${tagName.toLowerCase()}>`;
            let layoutComponent = this._anchorComponent.getChildren().values().next().value;

            // Find the slot element
            const slotElement = layoutComponent.getElement().getAttribute("data-slot") === "innerHTML"
                ? layoutComponent.getElement()
                : layoutComponent.getElement().querySelector('[data-slot="innerHTML"]');

            if (slotElement) {
                // Find the old page component inside the slot
                // The page component's root element should be a direct child of the slot
                const oldPageElement = slotElement.firstElementChild;

                if (oldPageElement && oldPageElement.id) {
                    // Get the component instance by ID
                    const oldPageComponent = layoutComponent.getChild(oldPageElement.id);

                    if (oldPageComponent) {
                        // Remove only this page's portaled children
                        this._removedPortalElements(oldPageComponent);
                    }
                }
            }

            this._renderComponent(layoutComponent,html,"innerHTML");

            return;
        }

       // console.log("CASE 3")
        // CASE 3: New/different layout - recreate everything (this clears layout portals too)
        const layoutId = crypto.randomUUID();

        const layoutName = newLayout.name
            .replace(/([A-Z])/g, (match, letter, index) => {
                return index === 0 ? letter : '-' + letter;
            })
            .toUpperCase();

        const layoutHTML = `<${layoutName.toLowerCase()} id="${layoutId}">`;
        const componentHTML = `<${tagName.toLowerCase()} id="${id}"></${tagName.toLowerCase()}>`;
        const layoutEndHTML = `</${layoutName.toLowerCase()}>`;

        this._renderComponent(this._anchorComponent,layoutHTML+componentHTML+layoutEndHTML);

        // Store the layout CLASS reference, not the ID
        this._currentLayout = newLayout;
    }

    _renderComponent(target, html, slot = null) {
        // Remove all portaled elements from target component and its children
        this._removedPortalElements(target);

        if(slot !== null) {

            if(target.getElement().getAttribute("data-slot") === "innerHTML"){
                target.innerHTML = html;
            }else {
                target.getElement().querySelector(`[data-slot="${slot}"]`).innerHTML = html;
            }
        }else{
            target.getElement().innerHTML = html;
        }

        target.evaluateChildComponents();
        this._vera._evaluateRefs();
    }

    /**
     * Removes all the portaled elements belonging to a component, or its children.
     * @param {Component} component
     * @private
     */
    _removedPortalElements(component) {
        component.getChildren().forEach(child => {
            this._removedPortalElements(child);

            if(child.getElement().getAttribute('data-portaled') === 'true'){
                child.getElement().remove();
                component.getChildren().delete(child.getId());
                child.setParent(null);
            }

        });
    }


    start() {
        // Listen for browser back/forward
        window.addEventListener('popstate', () => {
            this._invalidateCache();
            this._handleRouteChange();
        });

        // Handle initial route
        this._handleRouteChange();

        return this;
    }
}

export default Router;