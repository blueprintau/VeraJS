// tests/component.test.js
import { describe, it, expect, beforeEach } from 'vitest';

// Import from index.js to avoid circular dependency issues
import VeraJS, { Component } from '../src/index.js';


class ParentComponent extends Component {
    getTemplate() {
        return '<div id="{id}" class="parent-component"></div>';
    }
}


class MainLayout extends Component {
    getTemplate() {
        return`<div id="{id}"><sidebar><span>Left!</span></sidebar><div data-slot="innerHTML">{innerHTML}</div><sidebar><span>Right!</span></sidebar></div>`;
    }
}

class Sidebar extends Component {
    getTemplate() {
        return `<div id="{id}"><span @slot="innerHTML">{innerHTML}</span></div>`;
    }
}

class Article extends Component {
    getTemplate() {
        return '<div id="{id}" class="another-component"><h1>{title}</h1><p>{description}</p><p class="likes">{likes}</p></div>';
    }
}

describe('Component.addComponent()', () => {
    let parentComponent;

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = '<div id="app"></div>';

        // Mount VeraJS
        VeraJS._instance = new VeraJS('app');

        // Create parent
        const parentEl = document.createElement('div');
        parentEl.id = 'parent-123';
        document.getElementById('app').appendChild(parentEl);

        parentComponent = new ParentComponent();
        parentComponent._element = parentEl;
        parentComponent._id = 'parent-123';
    });

    it('should create and mount a child component', () => {

        const child = parentComponent.addComponent(Article, {
            title: 'Gold Prices',
            description: 'Gold prices have had a big boost and then fall at the end of 2025.',
            likes: 5
        });

        expect(child).toBeInstanceOf(Article);
        expect(child.getElement().innerHTML).toContain('<h1>Gold Prices</h1>');
        expect(child.getElement().innerHTML).toContain('<p>Gold prices have had a big boost and then fall at the end of 2025.</p>');
        expect(child.getElement().innerHTML).toContain('<p class="likes">5</p>');
    });

});


describe('Component Slots', () => {

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = '<div id="app"></div>';
        // Mount VeraJS
        VeraJS._instance = new VeraJS('app');

        // Register components
        VeraJS.registerComponentClass('SIDEBAR', Sidebar);
        VeraJS.registerComponentClass('MAIN-LAYOUT', MainLayout);
        VeraJS.registerComponentClass('ARTICLE', Article);
    });

    it('should find slot in direct HTML elements, not inside VeraJS components', () => {
        // Create a layout with sidebars that have data-slot attributes
        const layoutEl = document.createElement('div');
        layoutEl.id = 'layout-123';
        layoutEl.innerHTML = `
            <sidebar id="sidebar-1">
                <div data-slot="innerHTML">Sidebar Content</div>
            </sidebar>
            <main data-slot="innerHTML">Main Content</main>
            <sidebar id="sidebar-2">
                <div data-slot="innerHTML">Another Sidebar</div>
            </sidebar>
        `;
        document.getElementById('app').appendChild(layoutEl);

        const layout = new MainLayout();
        layout._element = layoutEl;
        layout._id = 'layout-123';

        // Test the _findSlotElement method directly
        const router = VeraJS.router();
        const slotElement = router._findSlotElement(layoutEl, 'innerHTML');

        // Should find the <main> element, NOT the sidebar's slot
        expect(slotElement).not.toBeNull();
        expect(slotElement.tagName.toLowerCase()).toBe('main');
        expect(slotElement.textContent).toBe('Main Content');
    });

    it('should skip VeraJS components when searching for slots', () => {
        const containerEl = document.createElement('div');
        containerEl.id = 'container-123';
        containerEl.innerHTML = `
            <div class="wrapper">
                <sidebar id="left-sidebar">
                    <span data-slot="innerHTML">Left Sidebar Slot</span>
                </sidebar>
                <div class="content">
                    <section data-slot="innerHTML">Correct Slot</section>
                </div>
            </div>
        `;
        document.getElementById('app').appendChild(containerEl);

        const router = VeraJS.router();
        const slotElement = router._findSlotElement(containerEl, 'innerHTML');

        // Should find the <section> inside .content, NOT inside <sidebar>
        expect(slotElement).not.toBeNull();
        expect(slotElement.tagName.toLowerCase()).toBe('section');
        expect(slotElement.textContent).toBe('Correct Slot');
    });

    it('should return the root element if it has the slot attribute', () => {
        const rootEl = document.createElement('div');
        rootEl.id = 'root-123';
        rootEl.setAttribute('data-slot', 'innerHTML');
        rootEl.innerHTML = 'Root Content';
        document.getElementById('app').appendChild(rootEl);

        const router = VeraJS.router();
        const slotElement = router._findSlotElement(rootEl, 'innerHTML');

        // Should return the root element itself
        expect(slotElement).toBe(rootEl);
        expect(slotElement.textContent).toBe('Root Content');
    });

    it('should return null if slot not found', () => {
        const containerEl = document.createElement('div');
        containerEl.id = 'container-123';
        containerEl.innerHTML = `
            <div class="wrapper">
                <sidebar id="sidebar">
                    <span data-slot="innerHTML">Only in sidebar</span>
                </sidebar>
            </div>
        `;
        document.getElementById('app').appendChild(containerEl);

        const router = VeraJS.router();
        const slotElement = router._findSlotElement(containerEl, 'innerHTML');

        // Should return null since the only slot is inside a VeraJS component
        expect(slotElement).toBeNull();
    });

    it('should find nested slots in standard HTML elements', () => {
        const containerEl = document.createElement('div');
        containerEl.id = 'container-123';
        containerEl.innerHTML = `
            <div class="wrapper">
                <div class="level-1">
                    <div class="level-2">
                        <main data-slot="innerHTML">Deep Slot</main>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('app').appendChild(containerEl);

        const router = VeraJS.router();
        const slotElement = router._findSlotElement(containerEl, 'innerHTML');

        // Should find the deeply nested <main> element
        expect(slotElement).not.toBeNull();
        expect(slotElement.tagName.toLowerCase()).toBe('main');
        expect(slotElement.textContent).toBe('Deep Slot');
    });

    it('should prioritize first matching slot in HTML elements', () => {
        const containerEl = document.createElement('div');
        containerEl.id = 'container-123';
        containerEl.innerHTML = `
            <sidebar id="sidebar-1">
                <div data-slot="innerHTML">Sidebar Slot (should skip)</div>
            </sidebar>
            <main data-slot="innerHTML">First Valid Slot</main>
            <article data-slot="innerHTML">Second Valid Slot</article>
        `;
        document.getElementById('app').appendChild(containerEl);

        const router = VeraJS.router();
        const slotElement = router._findSlotElement(containerEl, 'innerHTML');

        // Should find the first valid HTML element slot
        expect(slotElement).not.toBeNull();
        expect(slotElement.tagName.toLowerCase()).toBe('main');
        expect(slotElement.textContent).toBe('First Valid Slot');
    });
});