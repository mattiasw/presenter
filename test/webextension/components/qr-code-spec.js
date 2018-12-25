import {proxyquire, sinon, expect} from '../../_utils/setup';

const QRCodeLib = {
    addData: sinon.spy(),
    make: sinon.spy(),
    createSvgTag: sinon.spy(),
};
const dom = {
    remove: sinon.spy(),
    append: sinon.spy(),
    createElement: sinon.stub().returns({}),
    addClass: sinon.spy(),
    removeClass: sinon.spy(),
};
const APP_HOST = 'example.com';
const SESSION_ID = '12345';

const QRCode = proxyquire('../../webextension/components/qr-code', {
    'qrcode-generator': () => QRCodeLib,
    '../../config.json': {
        'app-host': APP_HOST,
    },
    './dom': dom,
});

describe('webextension/components/qr-code', function () {
    afterEach(() => {
        QRCodeLib.addData.resetHistory();
        QRCodeLib.make.resetHistory();
        QRCodeLib.createSvgTag.resetHistory();
        dom.remove.resetHistory();
        dom.append.resetHistory();
        dom.createElement.resetHistory();
        dom.addClass.resetHistory();
        dom.removeClass.resetHistory();
    });

    it('should set QR data to the session ID', async () => {
        await QRCode.initialize(Promise.resolve(SESSION_ID));
        expect(QRCodeLib.addData.getCall(0).args[0].endsWith(`#${SESSION_ID}`)).to.be.true;
    });

    it('should remove old QR element', async () => {
        await QRCode.initialize(Promise.resolve(SESSION_ID));
        expect(dom.remove).to.have.been.calledWith('.__web-presenter__qr');
    });

    it('should insert new QR element', async () => {
        await QRCode.initialize(Promise.resolve(SESSION_ID));
        expect(dom.append).to.have.been.calledWith('body', {href: `https://${APP_HOST}/#${SESSION_ID}`, target: '_blank'});
    });

    it('should show QR element', () => {
        QRCode.show();
        expect(dom.addClass).to.have.been.calledWith('.__web-presenter__qr', '__web-presenter__qr--visible');
    });

    it('should terminate QR element', () => {
        QRCode.terminate();
        expect(dom.remove).to.have.been.calledWith('.__web-presenter__qr');
    });
});
