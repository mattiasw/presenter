import {expect} from '../../_utils/setup';
import * as messageParser from '../../../webextension/components/message-parser';

describe('webextension/components/message-parser', function () {
    it('should parse inactive pointing action', () => {
        expect(messageParser.parse('p:0;o:9042,5340')).to.deep.equal({
            point: false,
            calibrate: false,
            alpha: 90.42,
            beta: 53.40,
        });
    });

    it('should parse active pointing action', () => {
        expect(messageParser.parse('p:1;o:9042,5340')).to.deep.equal({
            point: true,
            calibrate: false,
            alpha: 90.42,
            beta: 53.40,
        });
    });

    it('should parse inactive calibration action', () => {
        expect(messageParser.parse('c:0;o:9042,5340')).to.deep.equal({
            point: false,
            calibrate: false,
            alpha: 90.42,
            beta: 53.40,
        });
    });

    it('should parse active calibration action', () => {
        expect(messageParser.parse('c:1;o:9042,5340')).to.deep.equal({
            point: false,
            calibrate: true,
            alpha: 90.42,
            beta: 53.40,
        });
    });
});
