import config from '../config.json';

export function initAsPresenter(session, log = () => undefined) {
    return new Promise((resolve, reject) => {
        const connection = new RTCPeerConnection(config['ice-servers'], {optional: [{DtlsSrtpKeyAgreement: true}]});

        session.onReceiverUpdate(async (receiverSDP) => {
            if (connection.signalingState !== 'stable') {
                reject('Signaling state is not stable.');
                return;
            }

            connection.onicecandidate = (event) => {
                if (event.candidate) {
                    return;
                }

                session.setPresenterSDP(connection.localDescription.sdp);
            };

            const description = new RTCSessionDescription({type: 'offer', sdp: receiverSDP});
            await connection.setRemoteDescription(description)
                .then(() => connection.createAnswer())
                .then((localDescription) => connection.setLocalDescription(localDescription))
                .catch((error) => log(`Could not set local description: ${error}`));
        });

        connection.ondatachannel = (event) => {
            const sendChannel = event.channel;
            sendChannel.onopen = () => {
                resolve(sendChannel);
            };
        };
    });
}

export function initAsReceiver(session, onMessageCallback, onConnectionCallback, log = () => undefined) {
    return new Promise((resolve, reject) => {
        const connection = new RTCPeerConnection(config['ice-servers'], {optional: [{DtlsSrtpKeyAgreement: true}]});

        const closeConnection = () => connection.close();

        const sendChannel = connection.createDataChannel('sendChannel');
        sendChannel.onmessage = (event) => {
            onMessageCallback(event.data);
        };

        connection.onicecandidate = (event) => {
            if (event.candidate) {
                return;
            }
            session.setReceiverSDP(connection.localDescription.sdp)
                .then(() => resolve(closeConnection));
        };

        connection.createOffer()
            .then((offer) => connection.setLocalDescription(offer))
            .catch((error) => reject(error));

        session.onPresenterUpdate(async (presenterSDP) => {
            session.cleanUp();

            if (connection.signalingState !== 'have-local-offer') {
                return;
            }

            const description = new RTCSessionDescription({type: 'answer', sdp: presenterSDP});
            await connection.setRemoteDescription(description)
                .catch((error) => log(`Could not set remote description: ${error}`));

            onConnectionCallback();
        });
    });
}
