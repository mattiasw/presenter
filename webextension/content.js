/* global chrome:false */

chrome.runtime.onMessage.addListener((message) => {
    if (message.toggle) {
        window.postMessage(message, '*');
    }
});

window.addEventListener('message', (event) => {
    if ((event.source === window) && (event.data.enabled || event.data.disabled)) {
        const message = Object.assign({tabId: event.data.tabId}, event.data);
        chrome.runtime.sendMessage(message);
    }
});

injectCSS(chrome.extension.getURL('/components/receiver.css'), 'head');
injectScript(chrome.extension.getURL('/components/receiver.js'), 'body');

function injectCSS(file, tagName) {
    const node = document.getElementsByTagName(tagName)[0];
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', file);
    node.appendChild(link);
}

function injectScript(file, tagName) {
    const node = document.getElementsByTagName(tagName)[0];
    const script = document.createElement('script');
    script.setAttribute('type', 'module');
    script.setAttribute('src', file);
    node.appendChild(script);
}
