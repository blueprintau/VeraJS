import { beforeEach, describe, expect, test, vi, afterEach } from 'vitest';
import Router from '../src/routing/Router.js';
import Component from '../src/Component.js';
import VeraJS from "../src/index.js";
import veraJS from "../src/VeraJS.js";

describe('Router Component Rendering', () => {
    let router;
    let veraInstance;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '<div id="app"></div>';

        global.history = {
            pushState: vi.fn((state, title, url) => {
                if (url) {
                    window.location.pathname = url;
                }
            }),
            replaceState: vi.fn(),
        };

        // Clear component classes before creating instance
        VeraJS._componentClasses = new Map();

        // Create a real VeraJS instance
        VeraJS.mount('app');

        window.location.pathname = '/';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('should register component class', () => {
        class TestComponent extends Component {
            getTemplate() {
                return '<div id="{id}">Test</div>';
            }
        }

        VeraJS.registerComponentClass('TEST-COMPONENT', TestComponent);

        expect(VeraJS.getComponentClasses().has('TEST-COMPONENT')).toBe(true);
        expect(VeraJS.getComponentClasses().get('TEST-COMPONENT')).toBe(TestComponent);
    });

    test('should render component without layout', () => {

        class HomePage extends Component {
            getTemplate() {
                return '<div id="{id}" class="home-page">Home</div>';
            }
        }

        VeraJS.registerComponentClass('HOME-PAGE', HomePage);

        VeraJS.router().route('/', HomePage);
        VeraJS.router().navigate('/');

        // Check that component was rendered
        const html = document.getElementById('app').innerHTML;
        expect(html).toContain('home-page');

    });

    test('should render component with layout', () => {

        class HomePage extends Component {
            getTemplate() {
                return '<div id="{id}" class="home-page">Home</div>';
            }
        }

        class LoginPage extends Component {
            getTemplate() {
                return '<div id="{id}" class="home-page">Login Form</div>';
            }
        }

        class LayoutPage extends Component {
            getTemplate() {
                return '<div id="{id}" class="Layout"><nav>My Navbar</nav><div data-slot="innerHTML">{innerHTML}</div></div>';
            }
        }


        VeraJS.registerComponentClass('HOME-PAGE', HomePage);
        VeraJS.registerComponentClass('LOGIN-PAGE', LoginPage);
        VeraJS.registerComponentClass("LAYOUT-PAGE", LayoutPage);

        VeraJS.router().route('/', HomePage,LayoutPage);
        VeraJS.router().route('/login',LoginPage,LayoutPage);

        //Test home first
        VeraJS.router().navigate('/');

        // Check that component was rendered
        let html = document.getElementById('app').innerHTML;

        expect(html).toContain('home-page');
        expect(html).toContain('<nav>My Navbar</nav>');

        //Check login component
        VeraJS.router().navigate('/login');

        html = document.getElementById('app').innerHTML;
        expect(html).toContain('Login Form');
        expect(html).toContain('<nav>My Navbar</nav>');

    });

    test('should reuse layout when navigating between routes with same layout', () => {
        const renderComponentSpy = vi.spyOn(VeraJS.router(), '_renderComponent');

        class AppLayout extends Component {
            getTemplate() {
                return '<div id="{id}" class="app-layout" data-slot="innerHTML">{innerHTML}</div>';
            }
        }

        class ProfilePage extends Component {
            getTemplate() {
                return '<div id="{id}" class="profile">Profile</div>';
            }
        }

        class SettingsPage extends Component {
            getTemplate() {
                return '<div id="{id}" class="settings">Settings</div>';
            }
        }

        class FriendsPage extends Component {
            getTemplate() {
                return '<div id="{id}" class="friends">Friends</div>';
            }
        }

        VeraJS.registerComponentClass('APP-LAYOUT', AppLayout);
        VeraJS.registerComponentClass('PROFILE-PAGE', ProfilePage);
        VeraJS.registerComponentClass('SETTINGS-PAGE', SettingsPage);
        VeraJS.registerComponentClass("FRIENDS-PAGE", FriendsPage);

        VeraJS.router().route('/profile', ProfilePage, AppLayout);
        VeraJS.router().route('/settings', SettingsPage, AppLayout);
        VeraJS.router().route('/friends', FriendsPage, AppLayout);

        VeraJS.router().navigate('/profile');

        // CASE 3: First call should render to anchor (contains layout HTML)
        const firstCall = renderComponentSpy.mock.calls[0];
        expect(firstCall[0]).toBe(VeraJS._instance.root); // target is anchor
        expect(firstCall[1]).toContain('app-layout'); // HTML contains layout

        renderComponentSpy.mockClear();

        VeraJS.router().navigate('/settings');

        // CASE 2: Should render to layout component (no layout HTML)
        const secondCall = renderComponentSpy.mock.calls[0];
        expect(secondCall[0]).not.toBe(VeraJS._instance.root); // target is NOT anchor
        expect(secondCall[1]).not.toContain('app-layout'); // HTML does NOT contain layout
        expect(secondCall[1]).toContain('settings-page'); // Only contains the page

        renderComponentSpy.mockClear();

        VeraJS.router().navigate('/friends');

        // CASE 2: Should render to layout component (no layout HTML)
        const thirdCall = renderComponentSpy.mock.calls[0];
        expect(thirdCall[0]).not.toBe(VeraJS._instance.root); // target is NOT anchor
        expect(thirdCall[1]).not.toContain('app-layout'); // HTML does NOT contain layout
        expect(thirdCall[1]).toContain('friends-page'); // Only contains the page

        renderComponentSpy.mockRestore();

    });


    test('should preserve layout portaled children when navigating between pages', () => {
        class HomePage extends Component {
            getTemplate() {
                return '<div id="{id}" class="home-page"><h1>Home</h1><div @portal="document.body.start"><h2>Home Portal</h2></div></div>';
            }
        }

        class LoginPage extends Component {
            getTemplate() {
                return '<div id="{id}" class="login-page"><h1>Login</h1></div>';
            }
        }

        class LayoutPage extends Component {
            getTemplate() {
                return '<div id="{id}" class="Layout"><nav>My Navbar</nav><div @portal="document.body.start"><h2>Layout Portal</h2></div><div data-slot="innerHTML">{innerHTML}</div></div>';
            }
        }

        VeraJS.registerComponentClass('HOME-PAGE', HomePage);
        VeraJS.registerComponentClass('LOGIN-PAGE', LoginPage);
        VeraJS.registerComponentClass("LAYOUT-PAGE", LayoutPage);

        VeraJS.router().route('/', HomePage, LayoutPage);
        VeraJS.router().route('/login', LoginPage, LayoutPage);

        const removePortalsSpy = vi.spyOn(VeraJS.router(), '_removedPortalElements');

        // Navigate to home page (CASE 3)
        VeraJS.router().navigate('/');

        // Should call _removedPortalElements on anchor (removes everything)
        expect(removePortalsSpy).toHaveBeenCalledWith(VeraJS._instance.root);

        removePortalsSpy.mockClear();

        // Navigate to login page (CASE 2 - same layout)
        VeraJS.router().navigate('/login');

        // Should NOT call _removedPortalElements on anchor or layout
        // Should ONLY call it on the old page component (HomePage)
        const calls = removePortalsSpy.mock.calls;

        // Verify it was called
        expect(calls.length).toBeGreaterThan(0);

        // Verify none of the calls were on the anchor component
        const calledOnAnchor = calls.some(call => call[0] === VeraJS._instance._root);
        expect(calledOnAnchor).toBe(false);

        // Verify it was called on a component (the old page)
        const calledOnComponent = calls.some(call => call[0] instanceof Component);
        expect(calledOnComponent).toBe(true);

        removePortalsSpy.mockRestore();
    });

    test('should destroy page portaled children when navigating away', () => {
        class ProfilePage extends Component {
            getTemplate() {
                return '<div id="{id}" class="profile-page"><h1>Profile</h1><div @portal="document.body.start"><h2>Profile Modal</h2></div></div>';
            }
        }

        class SettingsPage extends Component {
            getTemplate() {
                return '<div id="{id}" class="settings-page"><h1>Settings</h1><div @portal="document.body.start"><h2>Settings Modal</h2></div></div>';
            }
        }

        class AppLayout extends Component {
            getTemplate() {
                return '<div id="{id}" class="app-layout"><nav>Navbar</nav><div data-slot="innerHTML">{innerHTML}</div></div>';
            }
        }

        VeraJS.registerComponentClass('PROFILE-PAGE', ProfilePage);
        VeraJS.registerComponentClass('SETTINGS-PAGE', SettingsPage);
        VeraJS.registerComponentClass("APP-LAYOUT", AppLayout);

        VeraJS.router().route('/profile', ProfilePage, AppLayout);
        VeraJS.router().route('/settings', SettingsPage, AppLayout);

        const removePortalsSpy = vi.spyOn(VeraJS.router(), '_removedPortalElements');

        // Navigate to profile (CASE 3)
        VeraJS.router().navigate('/profile');

        removePortalsSpy.mockClear();

        // Navigate to settings (CASE 2)
        VeraJS.router().navigate('/settings');

        // Should have called _removedPortalElements on the ProfilePage component
        expect(removePortalsSpy).toHaveBeenCalled();

        // Should NOT have been called on anchor (which would remove layout portals)
        const calledOnAnchor = removePortalsSpy.mock.calls.some(
            call => call[0] === VeraJS._instance._root
        );
        expect(calledOnAnchor).toBe(false);

        removePortalsSpy.mockRestore();
    });

});