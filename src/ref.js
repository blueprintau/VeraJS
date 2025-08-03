import VeraJS from './VeraJS.js';

function useRef(value = null, id = crypto.randomUUID()){

    const ref = {
        _id: id,
        _value: value,
        _observers: [],
        _ref: true,
        _isElement: false,
        _element: value,

        getValue(){
            return this._value;
        },

        setValue(value){
            this._value = value;
            this._observers.forEach(observer => observer(this._value));
        },

        addObserver(callback){
            this._observers.push(callback);
        },
    };

    if(isElement(value,"INPUT")){
        value.addEventListener("input",(event)=>{
            ref.setValue(event.target.value);
        });
        ref.value = value.value;
    }

    VeraJS._instance._addRef(ref);
    return ref;
}

function getRef(id) {
    const ref = VeraJS._instance._getRef(id);
    if (!ref) {
        console.warn(`[VeraJS] Ref with id "${id}" not found`);
        return null;
    }
    return ref;
}

function isRef(object){
    return object._ref ?? false;
}

function useEffect(callback,refs = []){
    refs.forEach(ref=>{
        ref.addObserver(callback);
    })
}

function isElement(variable,name){
    if (!(variable instanceof HTMLElement)) return false;

    return variable.tagName === name;
}

export { useRef, getRef, useEffect, isRef };