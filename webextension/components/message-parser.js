const MESSAGE_KEY_POINT = 'p';
const MESSAGE_KEY_CALIBRATE = 'c';
const MESSAGE_KEY_ORIENTATION = 'o';

export function parse(message) {
    const parts = {
        point: false,
        calibrate: false,
    };

    message.split(';').forEach((partString) => {
        const [key, value] = partString.split(':');
        if (key === MESSAGE_KEY_POINT) {
            parts.point = value === '1';
        } else if (key === MESSAGE_KEY_CALIBRATE) {
            parts.calibrate = value === '1';
        } else if (key === MESSAGE_KEY_ORIENTATION) {
            const [alphaString, betaString] = value.split(',');
            parts.alpha = parseInt(alphaString, 10) / 100.0;
            parts.beta = parseInt(betaString, 10) / 100.0;
        }
    });

    return parts;
}
