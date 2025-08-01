function unwrapElement(element) {
    // Replace the element with its children
    element.replaceWith(...element.childNodes);
}

function unixToDate(unixTimestamp) {
    return new Date(unixTimestamp * 1000);
}


export { unwrapElement, unixToDate };