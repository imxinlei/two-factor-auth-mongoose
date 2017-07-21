const assert = require('assert');
const mongoose = require('mongoose');
const UserModel = require('./UserModel');

const Types = mongoose.Types;

const DB_URL = 'mongodb://localhost:27017/password';
const userId = Types.ObjectId();
let password = null;

describe('Test Database', () => {

  before(function(done) {
    mongoose.Promise = global.Promise;
    mongoose.connect(DB_URL, {
      useMongoClient: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 4000
    });

    const db = mongoose.connection;
    db.on('error', () => {
      throw new Error('Cannot connect to db!');
    });
    db.once('open', () => {
      UserModel.create({
        _id: userId,
        username: 'random'
      }).then(() => done());
    });
  });

  describe('# request tfa()', () => {
    it('first time request code', function (done) {
      UserModel.requestTFA(userId)
        .then((code) => {
          password = code;
          done();
        })
        .catch(done);
    });

    it('request code throw too soon', function (done) {
      UserModel.requestTFA(userId)
        .then(() => done('should throw'))
        .catch(err => {
          if (err === 'requestedTooSoon') done();
          else done(err);
        });
    });

    it('request should success after 1s', function (done) {
      setTimeout(() => {
        UserModel.requestTFA(userId)
          .then((code) => {
            password = code;
            assert(/^\d{6}$/.test(password), true, 'code should be 6 number long');
            done();
          })
          .catch(done);
        }, 1000);
    });
  });

  describe('# attempt tfa()', () => {
    it('should throw user not found', function (done) {
      UserModel.attemptTFA(Types.ObjectId(), password)
        .then(() => done('should throw'))
        .catch(err => {
          if (err === 'userNotFound') done();
          else done(err);
        });
    });

    it('attempt should success first time', function (done) {
      UserModel.attemptTFA(userId, password)
        .then(() => done())
        .catch(done);
    });

    it('attempt should throw no password set', function (done) {
      UserModel.attemptTFA(userId, password)
        .then(() => done('should throw'))
        .catch(err => {
          if (err === 'notSet') done();
          else done(err);
        });
    });

    it('request a new one', function (done) {
      setTimeout(() => {
        UserModel.requestTFA(userId)
          .then((code) => {
            password = code;
            assert(/^\d{6}$/.test(password), true, 'code should be 6 number long');
            done();
          })
          .catch(done);
        }, 1000);
    });

    it('login wrong password', function (done) {
      UserModel.attemptTFA(userId, '222')
        .then(() => done('should throw'))
        .catch(err => {
          if (err === 'incorrect') done();
          else done(err);
        });
    });

    it('login too soon wrong password', function (done) {
      UserModel.attemptTFA(userId, '222')
        .then(() => done('should throw'))
        .catch(err => {
          if (err === 'attemptedTooSoon') done();
          else done(err);
        });
    });

    it('login to soon right password', function (done) {
      UserModel.attemptTFA(userId, password)
        .then(() => done('should throw'))
        .catch(err => {
          if (err === 'attemptedTooSoon') done();
          else done(err);
        });
    });

    it('login attempt too many', function (done) {
      setTimeout(() => {
        UserModel.attemptTFA(userId, password)
          .then(() => done('should throw'))
          .catch(err => {
            if (err === 'attemptedTooMany') done();
            else done(err);
          });
        }, 1000);
    });

    it('request should success after 1s', function (done) {
      setTimeout(() => {
        UserModel.requestTFA(userId)
          .then((code) => {
            password = code;
            assert(/^\d{6}$/.test(password), true, 'code should be 6 number long');
            done();
          })
          .catch(done);
        }, 1000);
    });

    it('login success should success after 1s', function (done) {
      setTimeout(() => {
        UserModel.attemptTFA(userId, password)
          .then(() => done())
          .catch(done);
        }, 1000);
    });

    it('request should success after 1s', function (done) {
      setTimeout(() => {
        UserModel.requestTFA(userId)
          .then((code) => {
            password = code;
            assert(/^\d{6}$/.test(password), true, 'code should be 6 number long');
            done();
          })
          .catch(done);
        }, 1000);
    });

    it('login with backdoor key success', function (done) {
      setTimeout(() => {
        UserModel.attemptTFA(userId, '111111')
          .then(() => done())
          .catch(done);
        }, 1000);
    });

    it('request a new one', function (done) {
      UserModel.requestTFA(userId)
        .then((code) => {
          password = code;
          assert(/^\d{6}$/.test(password), true, 'code should be 6 number long');
          done();
        })
        .catch(done);
    });

    it('password expired', function (done) {
      this.timeout(6000);

      setTimeout(() => {
        UserModel.attemptTFA(userId, password)
          .then(() => done('should throw'))
          .catch(err => {
            if (err === 'expired') done();
            else done(err);
          });
        }, 5000);
    });
  });
});
