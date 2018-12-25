export function remove(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.parentNode.removeChild(element);
    }
}

export function append(parentSelector, element) {
    const parent = document.querySelector(parentSelector);
    if (parent) {
        parent.appendChild(element);
    }
}

export function createElement(type, className, content) {
    const element = document.createElement(type);
    element.classList.add(className);
    element.innerHTML = content;
    return element;
}

export function addClass(selector, className) {
    const element = document.querySelector(selector);
    if (element) {
        element.classList.add(className);
    }
}
