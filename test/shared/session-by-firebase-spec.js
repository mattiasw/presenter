import {proxyquire, sinon, expect} from '../_utils/setup';

const SESSION_ID = '12345';

const deleteSpy = sinon.spy();
let callOnSnapshotCallback;

const firebaseAppStub = {
    apps: [],
    initializeApp() {
        // Empty function.
    },
    firestore() {
        const document = {};
        return {
            settings() {
                // Empty function.
            },
            collection(name) {
                if (name === 'sessions') {
                    return {
                        doc(id) {
                            if (id === SESSION_ID) {
                                document.id = SESSION_ID;
                                return {
                                    set(data) {
                                        document.data = Object.assign({}, data);
                                    },
                                    update(data) {
                                        document.data = Object.assign({}, document.data, data);
                                    },
                                    delete: deleteSpy,
                                    onSnapshot(callback) {
                                        callOnSnapshotCallback = () => callback({data: () => document.data});
                                        return function unsubscribe() {
                                            // Empty function.
                                        };
                                    },
                                };
                            }
                        },
                        add(data) {
                            document.data = data;
                            return Promise.resolve({id: SESSION_ID});
                        },
                    };
                }
            },
        };
    },
};

const session = proxyquire('../../shared/session-by-firebase', {
    '@firebase/app': firebaseAppStub,
    '@firebase/firestore': {},
});

describe('shared/session-by-firebase', function () {
    afterEach(() => {
        deleteSpy.resetHistory();
        callOnSnapshotCallback = undefined;
    });

    it('should create a session', async () => {
        expect(session.create(SESSION_ID)).to.be.an('object');
    });

    it('should create a session with a given ID', async () => {
        expect(await (session.create(SESSION_ID)).getSessionId()).to.equal(SESSION_ID);
    });

    it('should set and retrieve receiver SDP with given session ID', async () => {
        const RECEIVER_SDP = 'receiver SDP';
        const onUpdateSpy = sinon.spy();
        const presenterSession = session.create(SESSION_ID);

        presenterSession.onReceiverUpdate(onUpdateSpy);
        await presenterSession.setReceiverSDP(RECEIVER_SDP);
        callOnSnapshotCallback();

        expect(onUpdateSpy).to.have.been.calledWith(RECEIVER_SDP);
    });

    it('should set and retrieve receiver SDP without a session ID', async () => {
        const RECEIVER_SDP = 'receiver SDP';
        const onUpdateSpy = sinon.spy();
        const presenterSession = session.create();

        await presenterSession.setReceiverSDP(RECEIVER_SDP);
        await presenterSession.onReceiverUpdate(onUpdateSpy);
        callOnSnapshotCallback();

        expect(onUpdateSpy).to.have.been.calledWith(RECEIVER_SDP);
        expect(await presenterSession.getSessionId()).to.equal(SESSION_ID);
    });

    it('should set and retrieve presenter SDP with given session ID', async () => {
        const PRESENTER_SDP = 'presenter SDP';
        const onUpdateSpy = sinon.spy();
        const presenterSession = session.create(SESSION_ID);

        presenterSession.onPresenterUpdate(onUpdateSpy);
        await presenterSession.setPresenterSDP(PRESENTER_SDP);
        callOnSnapshotCallback();

        expect(onUpdateSpy).to.have.been.calledWith(PRESENTER_SDP);
    });

    it('should set and retrieve presenter SDP without a session ID', async () => {
        const PRESENTER_SDP = 'presenter SDP';
        const onUpdateSpy = sinon.spy();
        const presenterSession = session.create();

        await presenterSession.setPresenterSDP(PRESENTER_SDP);
        await presenterSession.onPresenterUpdate(onUpdateSpy);
        callOnSnapshotCallback();

        expect(onUpdateSpy).to.have.been.calledWith(PRESENTER_SDP);
        expect(await presenterSession.getSessionId()).to.equal(SESSION_ID);
    });

    it('should delete a document on cleanup', async () => {
        const presenterSession = session.create(SESSION_ID);
        presenterSession.cleanUp();
        expect(deleteSpy).to.have.been.called;
    });

    it('should throw if trying to delete a document when session ID is not set', async () => {
        const presenterSession = session.create();
        expect(() => presenterSession.cleanUp()).to.throw(/Failed to delete document/);
        expect(deleteSpy).to.not.have.been.called;
    });
});
