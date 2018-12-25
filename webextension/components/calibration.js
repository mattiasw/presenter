export function create() {
    let bottom = undefined;
    let left = undefined;
    let right = undefined;
    let top = undefined;
    let xFactor = 2.0;
    let yFactor = 4.0;
    let wasCalibrating = false;

    return {
        getXFactor() {
            return xFactor;
        },
        getYFactor() {
            return yFactor;
        },
        calibrate({calibrate: isCalibrating, alpha, beta}) {
            if (isCalibrating && !wasCalibrating) {
                bottom = undefined;
                left = undefined;
                right = undefined;
                top = undefined;
            }

            if (isCalibrating) {
                if ((left === undefined) || (alpha > left)) {
                    left = alpha;
                }
                if ((right === undefined) || (alpha < right)) {
                    right = alpha;
                }
                if ((top === undefined) || (beta > top)) {
                    top = beta;
                }
                if ((bottom === undefined) || (beta < bottom)) {
                    bottom = beta;
                }

                if ((left !== undefined)
                    && (right !== undefined)
                    && (bottom !== undefined)
                    && (top !== undefined)) {
                    xFactor = 100.0 / Math.abs(left - right);
                    yFactor = 100.0 / Math.abs(top - bottom);
                }
            }

            wasCalibrating = isCalibrating;
        },
    };
}
