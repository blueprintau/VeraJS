import { beforeEach, describe, expect, test, vi } from 'vitest';
import Router from '../src/routing/Router.js';
import VeraJS from "../src/index.js";

// Mock global window and history objects
global.window = {
    location: { pathname: '/' },
    history: {
        pushState: vi.fn((state, title, url) => {
            if (url) {
                global.window.location.pathname = url;
            }
        }),
        replaceState: vi.fn(),
    },
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
};

global.history = global.window.history;

describe('Router', () => {
    let router;
    let consoleSpy;
    let errorSpy;

    beforeEach(() => {
        // Reset router and mocks before each test
        router = new Router();
        vi.clearAllMocks();
        global.window.location.pathname = '/';
        consoleSpy = vi.spyOn(console, 'log');
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    })

    // ============================================================================
    // Legacy Route API Tests
    // ============================================================================

    test('should register exact route', () => {
        const route = '/about';
        const handler = vi.fn();

        router.route(route, handler);

        expect(router._routes.has(route)).toBe(true);
    });

    test('should match exact route and return correct component', () => {
        const route = '/about';
        const handler = vi.fn();

        router.route(route, handler);
        global.window.location.pathname = route;

        const match = router.getCurrentMatch();

        expect(match).not.toBeNull();
        expect(match.component.component).toBe(handler);
        expect(match.params).toEqual({});
        expect(match.path).toBe(route);
    });


    test('should call route handler when navigating', () => {
        const route = '/about';
        const handler = vi.fn();

        router.route(route, handler);
        router.navigate(route);

        expect(global.window.history.pushState).toHaveBeenCalledWith({}, '', route);
        expect(global.window.location.pathname).toBe(route);
    });

    test('should handle multiple exact routes', () => {
        router.route('/', vi.fn());
        router.route('/about', vi.fn());
        router.route('/contact', vi.fn());

        expect(router._routes.has('/')).toBe(true);
        expect(router._routes.has('/about')).toBe(true);
        expect(router._routes.has('/contact')).toBe(true);
        expect(router._routes.size).toBe(3);
    });

    test('should differentiate between similar routes', () => {
        const aboutHandler = vi.fn();
        const aboutUsHandler = vi.fn();

        router.route('/about', aboutHandler);
        router.route('/about-us', aboutUsHandler);

        global.window.location.pathname = '/about';
        let match = router.getCurrentMatch();
        expect(match.component.component).toBe(aboutHandler);

        global.window.location.pathname = '/about-us';
        match = router.getCurrentMatch();
        expect(match.component.component).toBe(aboutUsHandler);
    });

    // ============================================================================
    // RouteGroup API Tests
    // ============================================================================

    test('should register route group', () => {
        const route = '/about';

        router.group("test")
            .route("/about",()=>{
                console.log("<h1>About Us</h1>")
            });

        expect(router._routes.has(route)).toBe(true);
    });

    test('route group index check passing without slash',()=>{
        window.location.pathname= "/staff/";

        const route = '/staff';

        router.group("staff")
            .prefix("/staff")
            .route("/",()=>{
                console.log("Staff Home page 1")
        });

        router.start();

        expect(router._routes.has(route)).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith("Staff Home page 1");
    });


    test('route group index check passing with slash',()=>{

        window.location.pathname = "/staff/";

        router.group("staff")
            .prefix("/staff")
            .route("/",()=>{
                console.log("Staff Home page 2")
            });

        router.start();

        expect(router._routes.has("/staff")).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith("Staff Home page 2");
    });


    test('route group with single middleware as function',()=>{

        window.location.pathname = "/staff/";

        router.group("staff")
            .prefix("/staff")
            .middleware(()=>console.log("Staff is authenticated"))
            .route("/",()=>{
                console.log("Staff Home page");
            });

        router.start();

        expect(router._routes.has("/staff")).toBe(true);
        expect(consoleSpy).toHaveBeenCalledTimes(2);

        // Check the order of calls
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "Staff is authenticated");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "Staff Home page");
    });

    test('route group with middleware and route with middleware',()=>{
        window.location.pathname = "/staff/add";

        router.group("staff")
            .prefix("/staff")
            .middleware(()=>console.log("Staff is authenticated"))
            .route("/",()=>{
                console.log("Staff Home page");
            })
            .route("/add",()=>{
                console.log("Add new staff member");
            },{
                middleware:()=>{
                    console.log("You must be a manager to add new staff");

                    return VeraJS.ABORT_MOUNT
                }
            })

        router.start();

        expect(router._routes.has("/staff/add")).toBe(true);
        expect(consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "Staff is authenticated");
        expect(consoleSpy).not.toHaveBeenNthCalledWith(2,"Add new staff member");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "You must be a manager to add new staff");
    });

    test('route group with middleware with abort and redirect',()=>{


        window.location.pathname = "/dashboard";

        router.group("app")
            .route("/login",()=>{
                console.log("Login page");
            })
            .route("/dashboard",()=>{
                console.log("Dashboard page");
            },{
                middleware:()=>{
                    console.log("You must be logged in to access this page.");
                    router.navigate("/login");
                    return VeraJS.ABORT_MOUNT
                }
            })

        router.start();

        expect(router._routes.has("/login")).toBe(true);
        expect(router._routes.has("/dashboard")).toBe(true);

        expect(consoleSpy).toHaveBeenCalledTimes(2);

        expect(consoleSpy).not.toHaveBeenNthCalledWith(1, "Dashboard page");
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "You must be logged in to access this page.");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "Login page");
    });

    test('route group with invalid layout',()=>{


        window.location.pathname = "/dashboard";

        let test = {message:"NOT A COMPONENT"};

        router
            .group("app")
            .layout(test)
            .route("/dashboard",()=>{
                        console.log("Login page");
                    });

        router.start()

        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('[VeraRouter] Layout must be a Component class')
        );
    });

    test('route group with route parameter',()=>{


        window.location.pathname = "/user/123";

        let userPage = function (){
            console.log("user page page");
        };

        router
            .group()
            .prefix("/user")
            .route("/:id",userPage);

        router.start();

        let match = router.getCurrentMatch();

        expect(match.path).toEqual("/user/123");
        expect(match.route).toEqual("/user/:id");
        expect(match.params).toEqual({id: '123'})

    });

    test('route invalid route with no defined 404 page',()=>{

        window.location.pathname = "/user/123";
        try {
            router.start();
        }catch(err){
            expect(err.message).toEqual('[VeraRouter] No route found for "/user/123" and no 404 handler is registered. Register a /404 route to handle missing pages.');
        }
    });

    test('route invalid route with defined 404 page',()=>{

        window.location.pathname = "/user/123";

        let pageNotFound = ()=>{
            console.log("404 Page not found");
        }

        router.route("/404",pageNotFound);

        expect(() => router.start()).not.toThrow();

        expect(consoleSpy).toHaveBeenNthCalledWith(1, "404 Page not found");
    });

});