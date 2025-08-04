import { unwrapElement } from '../utils/functions.js';
import VeraJS from "../VeraJS";

class Component {

    _element;
    _id;
    _parent;

    getComputedStyle(style, int = false){
        if(int){
            return parseInt(window.getComputedStyle(this._element,'div')[style]);
        }
        return window.getComputedStyle(this._element,'div')[style];
    }

    querySelector(selector,all=false){
        if(all){
            return this._element.querySelectorAll(selector);
        }
        return this._element.querySelector(selector);
    }

    _evaluateChildComponents(){
        this._checkElementAndChildren(this._element);
    }

    _checkElementAndChildren(element) {

        Array.from(element.children).forEach(child => {
            if (VeraJS.getComponentClasses().has(child.tagName)) {
                try {
                    // Found a Vera component - process it
                    let ComponentClass = window.VeraJS._componentClasses.get(child.tagName);
                    let instance = new ComponentClass();

                    let outcome = instance.beforeMount();

                    if(outcome === window.VeraJS.ABORT_MOUNT){
                        //Abort
                        return;
                    }

                    let props = child.dataset;
                    props.id = child.id || props.id || crypto.randomUUID();
                    props.innerHTML = child.innerHTML;

                    let template = instance.getTemplate();

                    child.innerHTML = template.replace(/\{([^}]+)}/g, (match, key) => {
                        return props[key] !== undefined ? props[key] : match;
                    });

                    let styleAttribute = child.getAttribute('style');

                    unwrapElement(child);

                    instance._element = document.getElementById(props.id);

                    if (styleAttribute) {
                        instance._element.setAttribute('style', styleAttribute);
                    }

                    instance._id = props.id;
                    instance._parent = this;

                    if (instance._element) {
                        instance.init(props);

                        // Let the component handle its own children
                        instance._evaluateChildComponents();

                        window.VeraJS.addComponent(instance);
                    } else {
                        console.error(`Failed to find element with ID ${props.id} for ${child.tagName}`);
                    }

                } catch (error) {
                    console.error(`Error processing component ${child.tagName}:`, error);
                    console.error('Error stack:', error.stack);
                }

            } else {
                // Regular HTML element - recursively check its children
                this._checkElementAndChildren(child);
            }
        });
    }

    getTemplate(){
        throw new Error(`[Vera UIComponent Error] ${this.constructor.name} doesn't implement the required abstract method getTemplate().`);
    }

    init(){
        throw new Error(`[Vera Component Error] ${this.constructor.name} doesn't implement the required abstract method init().`);
    }

    beforeMount(){
        //Optional abstract method
    }

    getElement(){
        return this._element;
    }
}

export default Component;