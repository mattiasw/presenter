import config from '../../config.json';
import * as sessionHandler from '../../shared/session-by-firebase';
import * as peerConnection from '../../shared/peer-connection';
import * as dot from './dot';
import * as calibration from './calibration';
import * as messageParser from './message-parser';
import * as QRCode from './qr-code';

let terminate;

window.addEventListener('message', receiveExtensionMessage);

function receiveExtensionMessage(event) {
    if (isMessageFromExtension(event)) {
        const tabId = event.data.tabId;

        if (isInitialized()) {
            disable(tabId);
        } else {
            onDocumentReady(() => {
                enable(tabId);
            });
        }
    }
}

function isMessageFromExtension(event) {
    return (event.source === window) && event.data.toggle;
}

function isInitialized() {
    return !!document.querySelector('.__web-presenter__dot');
}

function disable(tabId) {
    if (terminate) {
        terminate();
        terminate = undefined;
    }
    window.postMessage({disabled: true, tabId}, '*');
}

function enable(tabId) {
    terminate = initialize();
    window.postMessage({enabled: true, tabId}, '*');
}

function onDocumentReady(callback) {
    if (documentIsReady()) {
        callback();
    } else {
        document.addEventListener('readystatechange', () => {
            if (documentIsReady()) {
                callback();
            }
        });
    }
}

function documentIsReady() {
    return (document.readyState === 'interactive') || (document.readyState === 'complete');
}

function initialize() {
    const session = sessionHandler.create();
    QRCode.initialize(session.getSessionId()).then(QRCode.show);

    const pointerDot = dot.create();
    const pointerCalibration = calibration.create();
    const messageHandler = handleMessage.bind(null, pointerDot, pointerCalibration);

    const peerConnectionPromise = peerConnection.initAsReceiver(session, messageHandler, QRCode.terminate, log);

    log('Peer connection initialized.');

    return function () {
        QRCode.terminate();
        peerConnectionPromise.then((closeConnection) => closeConnection());
        session.destroy();
        pointerDot.destroy();
    };
}

function handleMessage(pointerDot, pointerCalibration, message) {
    const parsedMessage = messageParser.parse(message);
    pointerDot.update(parsedMessage, pointerCalibration);
    pointerCalibration.calibrate(parsedMessage);
}

function log(message) {
    if (config.debug) {
        console.log(message); // eslint-disable-line no-console
    }
}
