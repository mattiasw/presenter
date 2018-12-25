/* global chrome:true, browser:false */

if (typeof chrome.runtime === 'undefined') {
    chrome = browser;
}

const ICON_ENABLED = 'images/icon-enabled.svg';
const ICON_DISABLED = 'images/icon-disabled.svg';

updateTabs((tab) => {
    setIcon(tab.id, ICON_DISABLED);
    chrome.pageAction.show(tab.id);
});

chrome.tabs.onUpdated.addListener((tabId) => {
    setIcon(tabId, ICON_DISABLED);
    chrome.pageAction.show(tabId);
});

chrome.pageAction.onClicked.addListener(togglePresenter);

chrome.runtime.onMessage.addListener((message) => {
    if (message.enabled) {
        setIcon(message.tabId, ICON_ENABLED);
    } else if (message.disabled) {
        setIcon(message.tabId, ICON_DISABLED);
    }
});

function setIcon(tabId, icon) {
    chrome.pageAction.setIcon({tabId, path: icon});
}

function updateTabs(callback, queryInfo = {}) {
    chrome.tabs.query(queryInfo, (tabs) => {
        tabs.forEach((tab) => {
            callback(tab);
        });
    });
}

function togglePresenter(currentTab) {
    chrome.tabs.sendMessage(currentTab.id, {toggle: true, tabId: currentTab.id});
}
