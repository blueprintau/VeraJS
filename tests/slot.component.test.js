// tests/component.test.js
import { describe, it, expect, beforeEach } from 'vitest';

// Import from index.js to avoid circular dependency issues
import VeraJS, { Component } from '../src/index.js';

class StandardSlotComponent extends Component{

    getTemplate() {
        return `
            <div id="{id}">
                <h1>My Page</h1>
                <slot></slot>
            </div>
        `;
    }

}

class NamedSlotComponent extends Component{


    getTemplate() {
        return `
            <div id="{id}">
             <slot name="header"><h1>My Page</h1></slot>
            </div>
        `;
    }

}

class MultipleNamedSlotComponent extends Component{

    getTemplate() {
        return `
            <div id="{id}">
             <slot name="header"><h1>My Page</h1></slot>
             <slot name="breadcrumbs"><a href="/">Home</a><a href="/pages">Pages</a></slot>
            </div>
        `;
    }

}

class SlotComponentWithDefaultValue extends Component{

    getTemplate() {
        return `<div id="{id}">
            <h1>My Page with default</h1>
            <slot><div class="default">Default Page</div></slot>
        </div>`
    }

}

class LayoutComponent extends Component{

    getTemplate() {
        return `<div id="{id}" class="layout"></div>`
    }
}

describe('Component._findSlotElement()', () => {
    let layoutComponent;

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = '<div id="app"></div>';

        // Mount VeraJS
        VeraJS._instance = new VeraJS('app');

        const layoutEl = document.createElement('div');
        layoutEl.id = 'layout-123';
        document.getElementById('app').appendChild(layoutEl);

        layoutComponent = new LayoutComponent();
        layoutComponent._element = layoutEl;
        layoutEl._id = 'layout-123';
    });

    it('Should remove empty slot, if nothing is present with addComponent()',()=>{

        layoutComponent.addComponent(StandardSlotComponent,{
            id : "child-comp"
        })

        expect(layoutComponent.getElement().innerHTML).not.toContain("<slot></slot>");
    });

    it ('Should remove empty slot, if nothing is present with mountComponent()',()=>{

        let instance = new StandardSlotComponent();

        layoutComponent.mountComponent(instance);

        expect(layoutComponent.getElement().innerHTML).not.toContain("<slot></slot>");
    });

    it('should yield its default value',()=>{

        layoutComponent.addComponent(SlotComponentWithDefaultValue);

        expect(layoutComponent.getElement().innerHTML).not.toContain("<slot>");
        expect(layoutComponent.getElement().innerHTML).not.toContain("</slot>");
        expect(layoutComponent.getElement().innerHTML).toContain('<div class="default">Default Page</div>');
    });


    it('should yield the innerHTML if not named',()=>{

        layoutComponent.addComponent(StandardSlotComponent,{
            "innerHTML" : "<h1>Slot Title</h1><p>Slot content</p>"
        });

        expect(layoutComponent.getElement().innerHTML).not.toContain("<slot></slot>");
        expect(layoutComponent.getElement().innerHTML).toContain("<h1>Slot Title</h1>");
        expect(layoutComponent.getElement().innerHTML).toContain("<p>Slot content</p>");

    });

    it('should yield to matching template content',()=>{

        layoutComponent.addComponent(NamedSlotComponent,{
            "innerHTML" : "<template slot='header'><h1>Jacks Page</h1></template>"
        });

        expect(layoutComponent.getElement().innerHTML).not.toContain("<slot>");
        expect(layoutComponent.getElement().innerHTML).not.toContain("My Page");
        expect(layoutComponent.getElement().innerHTML).toContain("Jacks Page");
    });

    it('should yield to multiple matching template sections',()=>{
        layoutComponent.addComponent(MultipleNamedSlotComponent,{
            "innerHTML" : `
                        <template slot="header">
                            <h1>Jacks Page</h1>
                        </template>
                        <template slot="breadcrumbs">
                            <a href="/pages">All Profiles</a>
                        </template>
            `
        });

        expect(layoutComponent.getElement().innerHTML).not.toContain("<slot>");
        expect(layoutComponent.getElement().innerHTML).not.toContain('<a href="/">Home</a><a href="/pages">Pages</a>');
        expect(layoutComponent.getElement().innerHTML).toContain(' <a href="/pages">All Profiles</a>');
        expect(layoutComponent.getElement().innerHTML).toContain('<h1>Jacks Page</h1>');
    });


})