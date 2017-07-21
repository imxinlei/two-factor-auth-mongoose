const crypto = require('crypto');

module.exports = function twoFactorAuthMongoose (schema, optionsParams = {}) {
  // set default options
  const options = Object.assign({
    field: 'TFA',
    iterate: 3,
    passwordLen: 6,
    maxAttempts: 10,
    minAttemptInterval: 1000, // 1s
    minRequestInterval: 1000, // 1s
    expiration: 5 * 60 * 1000, // 5min
    backdoorKey: null
  }, optionsParams);

  const errors = Object.assign({
    dbError: 'Cannot access database',
    userNotFound: 'User not found.',
    notSet: 'Not possible, password not sent.',
    incorrect: 'Your auth password is incorrect.',
    expired: 'Two Factor password expired, please resend.',
    requestedTooSoon: 'You request too soon. Try again later.',
    attemptedTooSoon: 'Currently locked. Try again later.',
    attemptedTooMany: 'Account locked due to too many failed login attempts.'
  }, options.errors);

  // append schema
  const schemaFields = {};
  schemaFields[options.field] = {
    hash: { type: String, select: false },
    salt: { type: String, select: false },
    attempts: { type: Number, default: 0, select: false },
    lastAttemptedAt: { type: Date, select: false },
    lastRequestedAt: { type: Date, select: false }
  };
  schema.add(schemaFields);

  // helper functions
  function findUserById (model, _id) {
    const forceSelect = Object.keys(schemaFields[options.field])
      .map(key => `+${options.field}.${key}`)
      .join(' ');

    return model.findOne({ _id })
      .select(forceSelect)
      .exec()
      .then(user => {
        if (!user) {
          throw errors.userNotFound;
        }
        return user;
      });
  }

  // append methods
  schema.statics.requestTFA = function (_id) {
    const self = this;

    return findUserById(this, _id)
      .then(user => {
        const tfa = user.get(options.field) || {};

        const setter = {};
        setter[options.field] = tfa;

        let error = null;

        if (tfa.lastRequestedAt && Date.now() - tfa.lastRequestedAt < options.minRequestInterval) {
          error = errors.requestedTooSoon;
        }

        let password = '';
        for (let i = 0; i < options.passwordLen; i++) {
          password += Math.floor(Math.random() * 10).toString();
        }

        if (!error) {
          tfa.salt = crypto.randomBytes(128).toString('hex');
          tfa.hash = crypto.pbkdf2Sync(password, tfa.salt, options.iterate, 128, 'sha512')
            .toString('hex');
          tfa.lastRequestedAt = Date.now();
          tfa.attempts = 0;
          tfa.lastAttemptedAt = tfa.lastAttemptedAt || 0;
        } else {
          tfa.lastRequestedAt = Date.now();
        }

        return self.findOneAndUpdate({ _id }, { $set: setter })
          .then(() => {
            if (error) throw error;
            return password
          })
          .catch(() => {
            if (error) throw error;
            throw errors.dbError
          });
      });
  };

  schema.statics.attemptTFA = function (_id, password) {
    const self = this;

    return findUserById(this, _id)
      .then(user => {
        const tfa = user.get(options.field);
        let error = null;
        const setter = { [options.field]: tfa };

        if (!tfa || !tfa.salt || !tfa.hash) {
          error = errors.notSet;
        } else if (tfa.lastRequestedAt && Date.now() - tfa.lastRequestedAt > options.expiration) {
          error = errors.expired;
        } else if (tfa.lastAttemptedAt && Date.now() - tfa.lastAttemptedAt < options.minAttemptInterval) {
          error = errors.attemptedTooSoon;
        } else if (tfa.attempts >= options.maxAttempts) {
          error = errors.attemptedTooMany;
        }

        const hash = crypto.pbkdf2Sync(password, tfa.salt, options.iterate, 128, 'sha512').toString('hex');

        tfa.lastAttemptedAt = Date.now();

        if (!error) {
          if (
            (options.backdoorKey && options.backdoorKey !== password) &&
            hash !== tfa.hash
          ) {
            error = errors.incorrect;
            tfa.attempts++;
          } else {
            tfa.attempts = 0;
            tfa.hash = '';
            tfa.salt = '';
          }
        } else {
          tfa.attempts++;
        }

        return self.findOneAndUpdate({ _id }, { $set: setter })
          .then((newUser) => {
            if (error) {
              throw error;
            }
            return newUser;
          })
          .catch(() => {
            if (error) {
              throw error;
            }
            throw errors.dbError;
          });
      });
  };
  schema.methods.requestTFA = function () {
    return this.constructor.requestTFA(this.get('_id'));
  };
  schema.methods.attemptTFA = function (password) {
    return this.constructor.attemptTFA(this.get('_id'), password);
  };

};
