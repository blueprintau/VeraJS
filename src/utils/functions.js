/**
 * Unwraps an element by replacing it with its child nodes
 * @param {HTMLElement} element - The element to unwrap
 * @returns {void}
 */
function unwrapElement(element) {
    // Replace the element with its children
    element.replaceWith(...Array.from(element.childNodes));
}

/**
 * Converts a unix timestamp to a JavaScript Date object
 * @param {number} unixTimestamp - Unix timestamp in seconds
 * @returns {Date} JavaScript Date object
 */
function unixToDate(unixTimestamp) {
    return new Date(unixTimestamp * 1000);
}


export { unwrapElement, unixToDate };