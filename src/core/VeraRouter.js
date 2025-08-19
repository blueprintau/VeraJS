class VeraRouter {

    _anchorComponent;
    _vera

    constructor(vera) {
        this._routes = new Map();        // For exact routes
        this._dynamicRoutes = [];        // For :param and * routes
        this._currentMatch = null;       // Cache current match
        this._lastUrl = null;
        this._vera = vera;
    }

    route(route, component, layout = null) {
        if (route.includes(':') || route.includes('*')) {
            // Dynamic route with parameters - store in same format as exact routes
            this._dynamicRoutes.push({
                path: route,
                component: {component: component, layout: layout}, // Fixed: wrap in same format
                regex: this._pathToRegex(route)
            });
        } else {
            // Exact route - use Map for O(1) lookup
            this._routes.set(route, {component: component, layout: layout});
        }

        return this;
    }

    _setAnchorComponent(component){
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

        console.warn("[VeraRouter] No route found '"+path+"'");

        if(this._routes.has("/404")) {
            this.navigate("/404");
            //console.log("404 redirect triggered!")
        }

        return null;
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
                .replace(/:([^/]+)/g, '(?<$1>[^/]+)')
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
            // Render the component
            this._renderComponent(match);
        }
    }

    _renderComponent(match) {
        try {
            if (this._anchorComponent && match.component) {
                // Generate an ID for the component
                const componentId = crypto.randomUUID();
                this._anchorComponent._element.innerHTML = '';


                const portaledElements = document.querySelectorAll('[data-portaled="true"]');

                portaledElements.forEach(element => {
                    element.remove();
                });

                const tagName = match.component.component.name
                    .replace(/([A-Z])/g, (match, letter, index) => {
                        return index === 0 ? letter : '-' + letter;
                    })
                    .toUpperCase();

                let layoutStart = "";
                let layoutEnd = "";

                if (match.component.layout !== null) {

                    let layoutId = crypto.randomUUID();
                    let layoutName = match.component.layout.name
                        .replace(/([A-Z])/g, (match, letter, index) => {
                            return index === 0 ? letter : '-' + letter;
                        })
                        .toUpperCase();

                    layoutStart = `<${layoutName.toLowerCase()} id="${layoutId}">`;
                    layoutEnd = `</${layoutName.toLowerCase()}>`;

                }
                // Create the HTML
                const componentHTML = `<${tagName.toLowerCase()} id="${componentId}"></${tagName.toLowerCase()}>`;
                this._anchorComponent._element.innerHTML = layoutStart + componentHTML + layoutEnd;

                // Let the anchor component discover and instantiate the route component
                this._anchorComponent._evaluateChildComponents();
                this._vera._evaluateRefs();

            }
        } catch(err) {
            console.error('=== RENDER ERROR ===');
            console.error('Error:', err);
            console.error('Error message:', err.message);
            console.error('Error stack:', err.stack);
        }
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

export default VeraRouter;