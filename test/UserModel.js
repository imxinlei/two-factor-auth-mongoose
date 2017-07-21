const tfaMongoose = require('../index');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tfaConfig = {
  field: 'tfa',
  iterate: 3,
  passwordLen: 6,
  maxAttempts: 3,
  minAttemptInterval: 1000,
  minRequestInterval: 1000,
  expiration: 5000,
  backdoorKey: '111111',
  errors: {
    dbError: 'dbError',
    userNotFound: 'userNotFound',
    notSet: 'notSet',
    incorrect: 'incorrect',
    expired: 'expired',
    requestedTooSoon: 'requestedTooSoon',
    attemptedTooSoon: 'attemptedTooSoon',
    attemptedTooMany: 'attemptedTooMany'
  }
};

const UserSchema = new Schema({
  username: {
    type: String,
    required: true
  }
});

UserSchema.plugin(tfaMongoose, tfaConfig);

module.exports = mongoose.model('tfa', UserSchema);
