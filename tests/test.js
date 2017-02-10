/* eslint-env node, mocha */
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const Members = require('../models/members');

const { app, runServer, closeServer } = require('../index');

const should = chai.should();

chai.use(chaiHttp);

describe('/members', () => {
  before(() => runServer(() => {
    Members.create({
      email: 'email@gmail.com',
      fullname: 'firstname lastname',
      nickname: 'nickname'
    });
  }));
  after(() => {
    Members.findOneAndRemove({ nickname: 'nickname' }, (err) => {
      console.log(err);
    });
    return closeServer();
  });
  it('should create a Member', (done) => {
    chai.request(app)
          .get('/members')
          .end((err, res) => {
            res.should.be.json;
            res.should.have.status(200);
            done();
          });
  });
});
