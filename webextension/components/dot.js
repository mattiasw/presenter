const DOT_VISIBLE_CLASS = '__web-presenter__dot--visible';
const DOT_LEFT_PROPERTY = '--web-pointer-dot-left';
const DOT_TOP_PROPERTY = '--web-pointer-dot-top';

export function create() {
    let pointerLeft = 0;
    let pointerTop = 0;
    let animationFrameRequest = undefined;
    let alphaOrigin = undefined;
    let betaOrigin = undefined;
    let wasPointing = false;

    const dot = document.createElement('div');
    dot.classList.add('__web-presenter__dot');
    document.body.appendChild(dot);

    return {
        update({point: isPointing, alpha, beta}, pointerCalibration) {
            if (isPointing && !wasPointing) {
                alphaOrigin = undefined;
                betaOrigin = undefined;
            }

            if (alphaOrigin === undefined) {
                alphaOrigin = alpha;
            }
            if (betaOrigin === undefined) {
                betaOrigin = beta;
            }

            const {newPointerLeft, newPointerTop} = getPointerPosition(alpha, beta, alphaOrigin, betaOrigin, pointerCalibration);

            if ((isPointing || wasPointing) && (newPointerLeft !== pointerLeft || newPointerTop !== pointerTop)) {
                pointerLeft = newPointerLeft;
                pointerTop = newPointerTop;

                if (animationFrameRequest) {
                    window.cancelAnimationFrame(animationFrameRequest);
                }

                animationFrameRequest = window.requestAnimationFrame(() => {
                    animationFrameRequest = undefined;
                    updateDot(dot, isPointing, pointerLeft, pointerTop);
                });
            }

            wasPointing = isPointing;
        },
        destroy() {
            dot.parentNode.removeChild(dot);
            document.documentElement.style.setProperty(DOT_LEFT_PROPERTY, '');
            document.documentElement.style.setProperty(DOT_TOP_PROPERTY, '');
        },
    };
}

function getPointerPosition(alpha, beta, alphaOrigin, betaOrigin, pointerCalibration) {
    return {
        newPointerLeft: (getOrientationDelta(alphaOrigin, alpha) * pointerCalibration.getXFactor()).toFixed(2),
        newPointerTop: (getOrientationDelta(betaOrigin, beta) * pointerCalibration.getYFactor()).toFixed(2),
    };
}

function getOrientationDelta(origin, current) {
    const delta = origin - current;
    if (delta >= 180) {
        return delta - 360;
    }
    if (delta <= -180) {
        return delta + 360;
    }
    return delta;
}

function updateDot(dot, isPointing, pointerLeft, pointerTop) {
    document.documentElement.style.setProperty(DOT_LEFT_PROPERTY, `${pointerLeft}vw`);
    document.documentElement.style.setProperty(DOT_TOP_PROPERTY, `${pointerTop}vh`);

    if (isPointing) {
        dot.classList.add(DOT_VISIBLE_CLASS);
    } else {
        dot.classList.remove(DOT_VISIBLE_CLASS);
    }
}
