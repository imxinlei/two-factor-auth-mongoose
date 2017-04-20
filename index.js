// This will be a stand alone lib, so write in ES5 (maybe a bit ES6)
/* eslint-disable */

var crypto = require('crypto');

module.exports = function twoFactorAuthMongoose(schema, optionsParams = {}) {
  // set default options
  var options = Object.assign({
    send: function(password, user) {
      console.error('did not set send(), password cannot be sent:' + password);
    },
    field: 'TFA',
    passwordLen: 6,
    maxAttempts: 10,
    minAttemptInterval: 1000, // 1s
    minRequestInterval: 1000, // 1s
    expiration: 5 * 60 * 1000, // 5min
    backdoorKey: null
  }, optionsParams);

  var errors = Object.assign({
    userNotFound: 'User not found.',
    notSet: 'Not possible, password not sent.',
    incorrect: 'Your auth password is incorrect.',
    expired: 'Two Factor password expired, please resend.',
    requestTooSoon: 'You request too soon. Try again later.',
    attempTooSoon: 'Currently locked. Try again later.',
    attempTooMany: 'Account locked due to too many failed login attempts.'
  }, options.errors);

  // append schema
  var schemaFields = {};
  schemaFields[options.field] = {
    hash: { type: String, select: false },
    salt: { type: String, select: false },
    attempts: { type: Number, default: 0, select: false },
    lastAttempt: { type: Date, default: Date.now, select: false },
    lastRequest: { type: Date, default: Date.now, select: false }
  };
  schema.add(schemaFields);

  // helper functions
  function findUserById(model, _id) {
    var forceSelect = Object.keys(schemaFields[options.field])
      .map(key => `+${options.field}.${key}`)
      .join(' ');

    return model.findOne({ _id: _id })
      .select(forceSelect)
      .exec()
      .then(user => {
        if (!user) {
          return Promise.reject(new Error(errors.userNotFound));
        }
        return user;
      });
  }

  // append methods
  schema.statics.requestTFA = function(_id) {
    var self = this;

    return findUserById(this, _id)
      .then(user => {
        var tfa = user.get(options.field) || {};

        if (Date.now() - tfa.lastRequest < options.minRequestInterval) {
          return Promise.reject(new Error(errors.requestTooSoon));
        }

        var password = '';
        for (var i = 0; i < options.passwordLen; i++) {
          password += Math.floor(Math.random() * 10).toString();
        }

        tfa.salt = crypto.randomBytes(128).toString('hex');
        tfa.hash = crypto.pbkdf2Sync(password, tfa.salt, 31, 128, 'sha512').toString('hex');
        tfa.lastRequest = Date.now();
        tfa.attempts = 0;
        tfa.lastAttempt = tfa.lastAttempt || 0;

        // call send function
        var cancel = options.send(password, user);
        if (cancel === true) return user;

        var setter = {};
        setter[options.field] = tfa;

        return self.findOneAndUpdate({ _id: _id }, { $set: setter });
      });
  };
  schema.statics.attemptTFA = function(_id, password) {
    var self = this;

    return findUserById(this, _id)
      .then(user => {
        var tfa = user.get(options.field);

        if (!tfa || !tfa.salt || !tfa.hash || !tfa.lastRequest) {
          return Promise.reject(new Error(errors.notSet));
        }

        if (Date.now() - tfa.lastRequest > options.expiration) {
          return Promise.reject(new Error(errors.expired));
        }

        if (Date.now() - tfa.lastAttempt < options.minAttemptInterval) {
          return Promise.reject(new Error(errors.attempTooSoon));
        }

        if (options.attempts > options.maxAttempts) {
          return Promise.reject(new Error(errors.attempTooMany));
        }

        var hash = crypto.pbkdf2Sync(password, tfa.salt, 31, 128, 'sha512').toString('hex');

        var setter = {};
        setter[options.field] = tfa;

        tfa.lastAttempt = Date.now()
        if (
          (options.backdoorKey && options.backdoorKey === password) ||
          hash === tfa.hash
        ) {
          tfa.attempts = 0;
          tfa.hash = '';
          tfa.salt = '';
        } else {
          tfa.attempts++;

          return self.findOneAndUpdate({ _id: _id }, { $set: setter })
            .then(() => Promise.reject(new Error(errors.incorrect)))
            .catch(() => Promise.reject(new Error(errors.incorrect)));
        }

        return self.findOneAndUpdate({ _id: _id }, { $set: setter });
      });
  };
  schema.methods.requestTFA = function () {
    return this.constructor.requestTFA(this.get('_id'));
  };
  schema.methods.attemptTFA = function (password) {
    return this.constructor.attemptTFA(this.get('_id'), password);
  };

};

/* eslint-enable */
