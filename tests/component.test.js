// tests/component.test.js
import { describe, it, expect, beforeEach } from 'vitest';

// Import from index.js to avoid circular dependency issues
import VeraJS, { Component } from '../src/index.js';


class ParentComponent extends Component {
    getTemplate() {
        return '<div id="{id}" class="parent-component"></div>';
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