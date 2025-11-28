import { beforeEach, describe, expect, test, vi, afterEach } from 'vitest';
import Component from '../src/Component.js';
import VeraJS from "../src/VeraJS.js";

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

        // Create a real VeraJS instance
        VeraJS.mount('app');

        // Clear component classes before creating instance
        VeraJS.getInstance()._componentClasses = new Map();

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
                return '<div id="{id}" class="Layout"><nav>My Navbar</nav><div data-slot="innerHTML"></div></div>';
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
        VeraJS.router().navigate('/settings');
        VeraJS.router().navigate('/friends');

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

    test('should switch from one layout to another layout', () => {
        class LayoutA extends Component {
            getTemplate() {
                return '<div id="{id}" class="layout-a"><h1>Layout A</h1><div data-slot="innerHTML"></div></div>';
            }
        }

        class LayoutB extends Component {
            getTemplate() {
                return '<div id="{id}" class="layout-b"><h1>Layout B</h1><div data-slot="innerHTML"></div></div>';
            }
        }

        class Page1 extends Component {
            getTemplate() {
                return '<div id="{id}">Page 1</div>';
            }
        }

        class Page2 extends Component {
            getTemplate() {
                return '<div id="{id}">Page 2</div>';
            }
        }

        VeraJS.registerComponentClass('LAYOUT-A', LayoutA);
        VeraJS.registerComponentClass('LAYOUT-B', LayoutB);
        VeraJS.registerComponentClass('PAGE-1', Page1);
        VeraJS.registerComponentClass('PAGE-2', Page2);

        VeraJS.router().route('/page1', Page1, LayoutA);
        VeraJS.router().route('/page2', Page2, LayoutB);

        VeraJS.router().navigate('/page1');
        expect(document.getElementById('app').innerHTML).toContain('layout-a');

        VeraJS.router().navigate('/page2');
        expect(document.getElementById('app').innerHTML).toContain('layout-b');
        expect(document.getElementById('app').innerHTML).not.toContain('layout-a');
    });

    test('should handle nested components with their own slots', () => {
        class InnerComponent extends Component {
            getTemplate() {
                return '<div id="{id}" class="inner"><div data-slot="innerHTML">Inner Slot</div></div>';
            }
        }

        class OuterLayout extends Component {
            getTemplate() {
                return '<div id="{id}" class="outer"><inner-component></inner-component><div data-slot="innerHTML"></div></div>';
            }
        }

        class Page extends Component {
            getTemplate() {
                return '<div id="{id}">Page Content</div>';
            }
        }

        VeraJS.registerComponentClass('INNER-COMPONENT', InnerComponent);
        VeraJS.registerComponentClass('OUTER-LAYOUT', OuterLayout);
        VeraJS.registerComponentClass('PAGE', Page);

        VeraJS.router().route('/', Page, OuterLayout);
        VeraJS.router().navigate('/');

        const html = document.getElementById('app').innerHTML;
        expect(html).toContain('Page Content');
        expect(html).toContain('Inner Slot'); // Inner component's slot should remain
    });

    test('should remove layout when navigating to route without layout', () => {
        class LayoutPage extends Component {
            getTemplate() {
                return '<div id="{id}" class="with-layout"><nav>Nav</nav><div data-slot="innerHTML"></div></div>';
            }
        }

        class Page1 extends Component {
            getTemplate() {
                return '<div id="{id}">With Layout</div>';
            }
        }

        class Page2 extends Component {
            getTemplate() {
                return '<div id="{id}">No Layout</div>';
            }
        }

        VeraJS.registerComponentClass('LAYOUT-PAGE', LayoutPage);
        VeraJS.registerComponentClass('PAGE1', Page1);
        VeraJS.registerComponentClass('PAGE2', Page2);

        VeraJS.router().route('/with-layout', Page1, LayoutPage);
        VeraJS.router().route('/no-layout', Page2);

        VeraJS.router().navigate('/with-layout');
        expect(document.getElementById('app').innerHTML).toContain('with-layout');

        VeraJS.router().navigate('/no-layout');
        expect(document.getElementById('app').innerHTML).not.toContain('with-layout');
        expect(document.getElementById('app').innerHTML).toContain('No Layout');
    });

    test('should correctly track current layout', () => {
        class LayoutA extends Component {
            getTemplate() {
                return '<div id="{id}" class="layout-a"><div data-slot="innerHTML"></div></div>';
            }
        }

        class Page extends Component {
            getTemplate() {
                return '<div id="{id}">Page</div>';
            }
        }

        VeraJS.registerComponentClass('LAYOUT-A', LayoutA);
        VeraJS.registerComponentClass('PAGE', Page);

        VeraJS.router().route('/with-layout', Page, LayoutA);
        VeraJS.router().route('/no-layout', Page);

        // Start with no layout
        expect(VeraJS.router()._currentLayout).toBeNull();

        // Navigate to route with layout
        VeraJS.router().navigate('/with-layout');
        expect(VeraJS.router()._currentLayout).toBeInstanceOf(LayoutA);

        // Navigate to route without layout
        VeraJS.router().navigate('/no-layout');
        expect(VeraJS.router()._currentLayout).toBeNull();
    });

});