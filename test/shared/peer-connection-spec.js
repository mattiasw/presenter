import {sinon, expect} from '../_utils/setup';

import * as peerConnection from '../../shared/peer-connection';

describe('shared/peer-connection', function () {
    const testContext = this;
    const localDescriptionAnswer = {sdp: 'Answer SDP'};
    const localDescriptionOffer = {sdp: 'Offer SDP'};
    const remoteDescription = 'remoteDescription';

    beforeEach(() => {
        this.receiverSDP = 'receiverSDP';
        this.presenterSDP = 'presenterSDP';
        this.session = {
            onReceiverUpdate: (callback) => {
                this.sessionOnReceiverUpdate = () => callback(this.receiverSDP);
            },
            onPresenterUpdate: (callback) => {
                this.sessionOnPresenterUpdate = () => callback(this.presenterSDP);
            },
            setPresenterSDP: sinon.stub().resolves(),
            setReceiverSDP: sinon.stub().resolves(),
            cleanUp: sinon.spy(),
        };

        testContext.setLocalDescriptionSpy = sinon.spy();
        testContext.setRemoteDescriptionSpy = sinon.stub().resolves();
        this.sendChannel = {};
        global.RTCPeerConnection = function () {
            this.signalingState = testContext.connectionSignalingState;
            this.setRemoteDescription = () => Promise.resolve();
            this.createAnswer = () => Promise.resolve(localDescriptionAnswer);
            this.createOffer = () => Promise.resolve(localDescriptionOffer);
            this.setLocalDescription = (value) => {
                this.localDescription = value;
                testContext.setLocalDescriptionSpy(value);
            };
            this.setRemoteDescription = async (value) => {
                this.remoteDescription = value;
                testContext.setRemoteDescriptionSpy(value);
            };
            this.createDataChannel = sinon.stub().withArgs('sendChannel').returns(testContext.sendChannel);
            testContext.connection = this;
        };
        global.RTCSessionDescription = function (options) {
            testContext.sessionDescriptionOptions = options;
            this.remoteDescription = remoteDescription;
        };
    });

    describe('presenter', () => {
        beforeEach(() => {
            testContext.connectionSignalingState = 'stable';
        });

        it('should fail when signaling state is not stable', (done) => {
            this.connectionSignalingState = 'not stable';
            const connectionPromise = peerConnection.initAsPresenter(this.session);
            this.sessionOnReceiverUpdate();
            connectionPromise.catch(() => {
                done();
            });
        });

        it('should pass receiver SDP on session update', () => {
            peerConnection.initAsPresenter(this.session);
            this.sessionOnReceiverUpdate();
            expect(this.sessionDescriptionOptions.sdp).to.equal(this.receiverSDP);
        });

        it('should set local description', async () => {
            peerConnection.initAsPresenter(this.session);
            await this.sessionOnReceiverUpdate();
            expect(this.setLocalDescriptionSpy).to.have.been.calledWith(localDescriptionAnswer);
        });

        it('should set presenter SDP', async () => {
            peerConnection.initAsPresenter(this.session);
            await this.sessionOnReceiverUpdate();
            testContext.connection.onicecandidate({candidate: undefined});
            expect(this.session.setPresenterSDP).to.have.been.calledWith(localDescriptionAnswer.sdp);
        });

        it('should not set presenter SDP until ICE candidate is empty', async () => {
            peerConnection.initAsPresenter(this.session);
            await this.sessionOnReceiverUpdate();
            testContext.connection.onicecandidate({candidate: 'candidate'});
            expect(this.session.setPresenterSDP).to.not.have.been.called;
        });

        it('should pass send-channel back when connected', async () => {
            const connectionPromise = peerConnection.initAsPresenter(this.session);
            const sendChannel = {};
            await this.sessionOnReceiverUpdate();
            testContext.connection.ondatachannel({channel: sendChannel});
            sendChannel.onopen();

            return connectionPromise.then((connectionChannel) => {
                expect(connectionChannel).to.equal(sendChannel);
            });
        });
    });

    describe('receiver', () => {
        const emptyFunction = () => {
            // Empty function.
        };

        beforeEach(() => {
            testContext.connectionSignalingState = 'have-local-offer';
        });

        it('should set receiver SDP', async () => {
            peerConnection.initAsReceiver(this.session, emptyFunction, emptyFunction);
            await Promise.resolve();
            testContext.connection.onicecandidate({candidate: undefined});
            expect(this.session.setReceiverSDP).to.have.been.calledWith(localDescriptionOffer.sdp);
        });

        it('should not set receiver SDP until ICE candidate is empty', () => {
            peerConnection.initAsReceiver(this.session, emptyFunction, emptyFunction);
            testContext.connection.onicecandidate({candidate: 'candidate'});
            expect(this.session.setReceiverSDP).to.not.have.been.called;
        });

        it('should set local description', async () => {
            peerConnection.initAsReceiver(this.session, emptyFunction, emptyFunction);
            await Promise.resolve();
            expect(this.setLocalDescriptionSpy).to.have.been.calledWith(localDescriptionOffer);
        });

        it('should pass presenter SDP on session update', async () => {
            peerConnection.initAsReceiver(this.session, emptyFunction, emptyFunction);
            await Promise.resolve();
            testContext.connection.onicecandidate({candidate: undefined});
            await this.sessionOnPresenterUpdate();
            expect(this.sessionDescriptionOptions.sdp).to.equal(this.presenterSDP);
        });

        it('should fail when signaling state is not "have-local-offer"', async () => {
            this.connectionSignalingState = 'not have-local-offer';
            peerConnection.initAsReceiver(this.session, emptyFunction, emptyFunction);
            await Promise.resolve();
            testContext.connection.onicecandidate({candidate: undefined});
            await this.sessionOnPresenterUpdate();
            expect(this.setRemoteDescriptionSpy).to.not.have.been.called;
        });

        it('should clean up session data', async () => {
            peerConnection.initAsReceiver(this.session, emptyFunction, emptyFunction);
            await Promise.resolve();
            testContext.connection.onicecandidate({candidate: undefined});
            await this.sessionOnPresenterUpdate();
            expect(this.session.cleanUp).to.have.been.called;
        });

        it('should set remote description', async () => {
            peerConnection.initAsReceiver(this.session, emptyFunction, emptyFunction);
            await Promise.resolve();
            testContext.connection.onicecandidate({candidate: undefined});
            await this.sessionOnPresenterUpdate();
            expect(this.setRemoteDescriptionSpy.getCall(0).args[0].remoteDescription).to.equal(remoteDescription);
        });

        it('should act on received message', (done) => {
            const event = {data: 'Message.'};
            peerConnection.initAsReceiver(this.session, (message) => {
                expect(message).to.deep.equal(event.data);
                done();
            }, emptyFunction);
            this.sendChannel.onmessage(event);
        });

        it('should call onConnection callback when connection is ready', async () => {
            const onConnectionCallback = sinon.spy();
            peerConnection.initAsReceiver(this.session, emptyFunction, onConnectionCallback);
            await Promise.resolve();
            testContext.connection.onicecandidate({candidate: undefined});
            await this.sessionOnPresenterUpdate();
            expect(onConnectionCallback).to.have.been.called;
        });
    });
});
