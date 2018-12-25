import QRCode from 'qrcode-generator';
import config from '../../config.json';
import * as dom from './dom';

const TYPE_NUMBER = 4;
const ERROR_CORRECTION_LEVEL = 'L';
const QR_CONTAINER_CLASS = '__web-presenter__qr';
const QR_CONTAINER_VISIBLE_CLASS = `${QR_CONTAINER_CLASS}--visible`;

export function initialize(sessionIdPromise) {
    return sessionIdPromise.then((id) => {
        const qrCode = QRCode(TYPE_NUMBER, ERROR_CORRECTION_LEVEL);
        const qrUrl = `https://${config['app-host']}/#${id}`;
        qrCode.addData(qrUrl);
        qrCode.make();
        terminate();
        dom.append('body', createQRElement(qrCode, qrUrl));
    });
}

function createQRElement(qrCode, qrUrl) {
    const qrLink = dom.createElement('a', QR_CONTAINER_CLASS, qrCode.createSvgTag());
    qrLink.href = qrUrl;
    qrLink.target = '_blank';
    return qrLink;
}

export function show() {
    dom.addClass(`.${QR_CONTAINER_CLASS}`, `${QR_CONTAINER_VISIBLE_CLASS}`);
}

export function terminate() {
    dom.remove(`.${QR_CONTAINER_CLASS}`);
}
