import firebase from '@firebase/app';
import '@firebase/firestore';
import {firebase as config} from '../config.json';

const TYPE_RECEIVER = 'receiver';
const TYPE_PRESENTER = 'presenter';

export function create(id = undefined) {
    const session = {
        id,
        database: initializeFirebase(),
        resolveId: undefined,
        idPromise: undefined,
    };

    return {
        getSessionId() {
            if (session.idPromise) {
                return session.idPromise;
            }
            if (session.id) {
                session.idPromise = Promise.resolve(session.id);
            } else {
                session.idPromise = new Promise((resolve) => {
                    session.resolveId = resolve;
                });
            }

            return session.idPromise;
        },
        getDatabase() {
            return session.database;
        },
        onReceiverUpdate(callback) {
            return handleDocumentUpdate(TYPE_RECEIVER, this, callback);
        },
        onPresenterUpdate(callback) {
            return handleDocumentUpdate(TYPE_PRESENTER, this, callback);
        },
        setReceiverSDP(sdp) {
            return setSDP(TYPE_RECEIVER, session, sdp);
        },
        setPresenterSDP(sdp) {
            return setSDP(TYPE_PRESENTER, session, sdp);
        },
        cleanUp() {
            if (!session.id) {
                throw new Error('Failed to delete document: No session ID set.');
            }
            session.database.collection('sessions').doc(session.id).delete();
        },
        destroy() {
            session.database = undefined;
            session.resolveId = undefined;
            session.idPromise = undefined;
        },
    };
}

function initializeFirebase() {
    if (!firebaseIsInitialized()) {
        firebase.initializeApp(config);
    }

    const database = firebase.firestore();
    database.settings({timestampsInSnapshots: true});

    return database;
}

function firebaseIsInitialized() {
    return firebase.apps.length > 0;
}

async function handleDocumentUpdate(type, session, callback) {
    const sessionId = await session.getSessionId();
    if (typeof callback !== 'function' || sessionId === undefined) {
        return;
    }
    const unsubscribe = session.getDatabase().collection('sessions').doc(sessionId).onSnapshot((document) => {
        const data = document.data();
        if (data[type]) {
            callback(data[type]);
            unsubscribe();
        }
    });
}

async function setSDP(type, session, sdp) {
    session[`${type}SDP`] = sdp;

    if (isUsingFixedSessionId(type, session)) {
        await session.database.collection('sessions').doc(session.id).set({
            [TYPE_RECEIVER]: '',
            [TYPE_PRESENTER]: '',
        });
    }

    if (session.id) {
        session.database.collection('sessions').doc(session.id).update({
            [type]: sdp,
        });
    } else {
        await session.database.collection('sessions').add({
            [type]: sdp,
            [type === TYPE_RECEIVER ? TYPE_PRESENTER : TYPE_RECEIVER]: '',
        }).then((documentRef) => {
            session.id = documentRef.id;
            if (session.resolveId) {
                session.resolveId(session.id);
            }
        });
    }
}

function isUsingFixedSessionId(type, session) {
    return (type === TYPE_RECEIVER) && !!session.id;
}
