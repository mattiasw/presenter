import config from '../config.json';
import * as sessionHandler from '../shared/session-by-firebase';
import * as peerConnection from '../shared/peer-connection';

const ACTION_NONE = 'action-none';
const ACTION_POINT = 'action-point';
const ACTION_CALIBRATE = 'action-calibrate';

const POINTER_BUTTON_CLASS = 'pointer-button';
const POINTER_BUTTON_PRESSED_CLASS = 'pointer-button--pressed';
const CALIBRATION_BUTTON_CLASS = 'calibration-button';
const CALIBRATION_BUTTON_PRESSED_CLASS = 'calibration-button--pressed';

init();

async function init() {
    setUpUI();

    const session = sessionHandler.create(getSessionId());

    if (!await session.getSessionId()) {
        setOffline('Faulty session ID. Try to reconnect.');
        return;
    }

    const timeout = setTimeout(() => {
        setOffline('Timeout. Try to reconnect.');
    }, 20000);

    peerConnection.initAsPresenter(session, log).then((sendChannel) => {
        clearTimeout(timeout);
        setOnline(sendChannel);
    }).catch((error) => {
        clearTimeout(timeout);
        setOffline('Error connecting to receiver: ' + error);
    });
}

function setUpUI() {
    if (config.debug) {
        const debugOutput = document.createElement('div');
        debugOutput.id = 'debug-output';
        debugOutput.classList.add('debug-output');
        document.querySelector('body').appendChild(debugOutput);
    }
}

function getSessionId() {
    return location.hash.slice(1);
}

function setOffline(message) {
    log(message);
    document.documentElement.classList.add('presenter-offline');
}

function setOnline(sendChannel) {
    document.documentElement.classList.add('presenter-online');

    const state = {
        action: ACTION_NONE,
        alpha: undefined,
        beta: undefined,
        time: performance.now(),
        touchStartX: undefined,
        touchStartY: undefined,
        touchX: undefined,
        touchY: undefined,
    };

    window.addEventListener('deviceorientation', sendOrientation.bind(null, state, sendChannel));

    document.querySelector(`.${POINTER_BUTTON_CLASS}`).addEventListener('touchstart', function (event) {
        this.classList.add(POINTER_BUTTON_PRESSED_CLASS);
        state.point = true;
        state.action = ACTION_POINT;
        state.touchStartX = event.touches[0].clientX;
        state.touchStartY = event.touches[0].clientY;
    });
    document.querySelector(`.${POINTER_BUTTON_CLASS}`).addEventListener('touchend', function () {
        this.classList.remove(POINTER_BUTTON_PRESSED_CLASS);
        state.point = false;
        state.action = ACTION_NONE;
    });

    document.querySelector(`.${CALIBRATION_BUTTON_CLASS}`).addEventListener('touchstart', function () {
        this.classList.add(CALIBRATION_BUTTON_PRESSED_CLASS);
        state.calibrate = true;
        state.action = ACTION_CALIBRATE;
    });
    document.querySelector(`.${CALIBRATION_BUTTON_CLASS}`).addEventListener('touchend', function () {
        this.classList.remove(CALIBRATION_BUTTON_PRESSED_CLASS);
        state.calibrate = false;
        state.action = ACTION_NONE;
    });

    document.addEventListener('touchmove', function (event) {
        event.preventDefault();
        state.touchX = event.touches[0].clientX;
        state.touchY = event.touches[0].clientY;
    });

    log('Pointer is online.');
}

function sendOrientation(state, sendChannel, event) {
    const now = performance.now();
    const deltaTime = now - state.time;
    if ((state.action !== ACTION_NONE && deltaTime > 1000 / 60.0) || (deltaTime > 1000 / 2)) {
        const newAlpha = Math.round(100 * event.alpha);
        const newBeta = Math.round(100 * event.beta);
        if ((newAlpha !== state.alpha) || (newBeta !== state.beta)) {
            state.alpha = newAlpha;
            state.beta = newBeta;
            sendChannel.send(getMessage(state));
        }
        state.time = now;
    }
}

function getMessage(state) {
    const orientation = `o:${state.alpha},${state.beta}`;

    if (state.action === ACTION_CALIBRATE) {
        return `c:1;${orientation}`;
    }

    return `p:${state.action === ACTION_POINT ? '1' : '0'};${orientation}`;
}

function log(message) {
    const debugOutput = document.getElementById('debug-output');
    if (debugOutput) {
        debugOutput.innerHTML += message + '<br>';
    }
}
