import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import proxyquire from 'proxyquire';

chai.use(sinonChai);
proxyquire.noCallThru();
const expect = chai.expect;

export {
    proxyquire,
    sinon,
    expect,
};
