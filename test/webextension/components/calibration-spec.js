import {expect} from '../../_utils/setup';
import * as calibration from '../../../webextension/components/calibration';

describe('webextension/components/calibration', function () {
    it('should calibrate', () => {
        const pointerCalibration = calibration.create();
        pointerCalibration.calibrate({calibrate: true, alpha: -1, beta: -1});
        pointerCalibration.calibrate({calibrate: true, alpha: 1, beta: 1});

        expect(pointerCalibration.getXFactor()).to.equal(50.0);
        expect(pointerCalibration.getYFactor()).to.equal(50.0);
    });

    it('should enlarge calibration', () => {
        const pointerCalibration = calibration.create();
        pointerCalibration.calibrate({calibrate: true, alpha: -1, beta: -1});
        pointerCalibration.calibrate({calibrate: true, alpha: 1, beta: 1});
        pointerCalibration.calibrate({calibrate: true, alpha: -2, beta: -2});
        pointerCalibration.calibrate({calibrate: true, alpha: 2, beta: 2});

        expect(pointerCalibration.getXFactor()).to.equal(25.0);
        expect(pointerCalibration.getYFactor()).to.equal(25.0);
    });

    it('should reset calibration when re-calibrating with greater values', () => {
        const pointerCalibration = calibration.create();
        pointerCalibration.calibrate({calibrate: true, alpha: -1, beta: -1});
        pointerCalibration.calibrate({calibrate: true, alpha: 1, beta: 1});
        pointerCalibration.calibrate({calibrate: false, alpha: 1, beta: 1});
        pointerCalibration.calibrate({calibrate: true, alpha: -2, beta: -2});
        pointerCalibration.calibrate({calibrate: true, alpha: 2, beta: 2});

        expect(pointerCalibration.getXFactor()).to.equal(25.0);
        expect(pointerCalibration.getYFactor()).to.equal(25.0);
    });

    it('should reset calibration when re-calibrating with smaller values', () => {
        const pointerCalibration = calibration.create();
        pointerCalibration.calibrate({calibrate: true, alpha: -2, beta: -2});
        pointerCalibration.calibrate({calibrate: true, alpha: 2, beta: 2});
        pointerCalibration.calibrate({calibrate: false, alpha: 2, beta: 2});
        pointerCalibration.calibrate({calibrate: true, alpha: -1, beta: -1});
        pointerCalibration.calibrate({calibrate: true, alpha: 1, beta: 1});

        expect(pointerCalibration.getXFactor()).to.equal(50.0);
        expect(pointerCalibration.getYFactor()).to.equal(50.0);
    });
});
