class VeraJS {

    _components;
    _registeredComponents;
    _observer;
    _refs;
    _whenReady = [];
    _root;
    _router;
    _stores;
    _setup;

    static ABORT_MOUNT = Symbol('ABORT_MOUNT');

    static _componentClasses = new Map();
    static _instance;

    constructor(id) {

        this._components = new Map();
        this._registeredComponents = [];
        this._observer = [];
        this._refs = [];
        this._router = new VeraRouter();
        this._stores = new Map();
        this._setup = ()=>{};

        try {
            let root = new Component();
            root._element = document.getElementById(id);
            root.getElement().classList.add('vera-root');
            this._root = root;
        }catch (error) {
            throw new Error(`[Vera Error] Unable to mount app to `+id+` it doesnt exist in the DOM.`);
        }

        document.addEventListener("DOMContentLoaded", async () => {
            await this._setup();

            this._root._evaluateChildComponents();

            this._whenReady.forEach((item) => {
                item();
            });
            this._evaluateRefs();
        });

    }

    _evaluateRefs(selector = null){

        if(selector === null){
            selector = this._root.getElement();
        }

        selector.querySelectorAll('*').forEach((element)=> {

            let ref = element.getAttribute('@ref');

            if(ref) {
                try {
                    ref = VeraJS._instance._getRef(ref);
                    ref.addObserver((value)=>{
                        element.innerText = value;
                    });
                } catch (e) {
                    throw new Error(`[VeraJS Error] Unable to bind ref: ${ref} to element ${element} - the ref does not exist or hasn't been created yet.`);
                }
            }

            let portal = element.getAttribute('@portal');


            if(portal) {
                let position = portal.endsWith('.start') ? 'afterbegin' : 'beforeend';
                let cleanPortal = portal.endsWith('.start') ? portal.slice(0, -6) : portal;
                let targetContainer = eval(cleanPortal);
                // Mark all children as portaled BEFORE unwrapping
                Array.from(element.children).forEach(child => {
                    child.dataset.portaled = "true";
                });
                // Move the actual element
                if(position === 'afterbegin') {
                    targetContainer.insertBefore(element, targetContainer.firstChild);
                } else {
                    targetContainer.appendChild(element);
                }


                // Unwrap the portal element, leaving its children in the target location
                unwrapElement(element);

                console.log("Moved and unwrapped " + portal, element);
            }
        });
    }

    _addRef(ref){
        this._refs.push(ref);
    }

    _getRef(id){
        return this._refs.find((ref) => ref._id === id);
    }

    _addComponent(component){
        this._components.set(component.id, component);
    }


    static addComponent(component){
        VeraJS._instance._addComponent(component);
    }

    whenReady(callback){
        this._whenReady.push(callback);
    }

    setUp(callback){
        this._setup = callback;
        return this;
    }

    static mount(id){
        VeraJS._instance = new VeraJS(id);
        return VeraJS._instance;
    }

    static registerComponentClass(key,componentClass){
        VeraJS._componentClasses.set(key,componentClass);
    }

    static router(){
        return this._instance._router;
    }

}