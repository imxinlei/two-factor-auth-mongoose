# two-factor-auth-mongoose
two-factor-auth-mongoose is a [Mongoose plugin](http://mongoosejs.com/docs/plugins.html)
that simplifies supporting [2FA](https://en.wikipedia.org/wiki/Multi-factor_authentication) in Promise style api.

## Installation
```bash
  npm install two-factor-auth-mongoose
```
two-factor-auth-mongoose depends on nothing, but you must install mongoose, because it's a mongoose-plugin.

## Usage

### how to plugin to mongoose

When you are defining your user schema, plug the two-factor-auth-mongoose and configuration into mongoose. This will add a field and some methods to your schema. See the [API](#api) documentation section for more details.

```javascript
  const mongoose = require('mongoose');
  const tfaMongoose = require('two-factor-auth-mongoose');

  const config = {
    field: 'TFA',
    iterate: 3,
    passwordLen: 6,
    maxAttempts: 10,
    minAttemptInterval: 1000, // 1s
    minRequestInterval: 1000, // 1s
    expiration: 5 * 60 * 1000, // 5min
    backdoorKey: null
    errors: {
      dbError: 'Cannot access database',
      userNotFound: 'User not found.',
      notSet: 'Not possible, password not sent.',
      incorrect: 'Your auth password is incorrect.',
      expired: 'Two Factor password expired, please resend.',
      requestedTooSoon: 'You request too soon. Try again later.',
      attemptedTooSoon: 'Currently locked. Try again later.',
      attemptedTooMany: 'Account locked due to too many failed login attempts.'
    }
  };

  const User = new mongoose.Schema({});
  User.plugin(tfaMongoose, config);

  module.exports = mongoose.model('User', User);
```

### configuration
```js
{
  field: 'TFA', // TFA field in database
  iterate: 3, // encrypt iteration time
  passwordLen: 6, // opt length
  maxAttempts: 10, // how many failed attempts before lock the user
  minAttemptInterval: 1000, // min interval between two attempts tfa
  minRequestInterval: 1000, // min interval between two request tfa
  expiration: 5 * 60 * 1000, // tfa code expired in
  backdoorKey: null // a backdoor password for debug (null means disabled)
  errors: {
    dbError: 'Cannot access database',
    userNotFound: 'User not found.',
    notSet: 'Not possible, password not sent.',
    incorrect: 'Your auth password is incorrect.',
    expired: 'Two Factor password expired, please resend.',
    requestedTooSoon: 'You request too soon. Try again later.',
    attemptedTooSoon: 'Currently locked. Try again later.',
    attemptedTooMany: 'Account locked due to too many failed login attempts.'
  }
}
```

### api

This plugin applies two instance methods: `requestTFA()` and `attemptTFA(password)` and two static methods: `requestTFA(_id)` and `attemptTFA(_id, password)` to your schema.

* Request two factor password:
```javascript
  const User = require('./UserSchema');
  const mongoose = require('mongoose');
  
  const Types = mongoose.Types;
  const _id = Types.ObjectId('59715f11cf910abed39e39dd');

  // use instance method
  const user = await User.findOne({ _id });
  const code = await user.requestTFA()
    .catch(err => console.log(err));

  // user static method
  const code = await User.requestTFA(_id)
    .catch(err => console.log(err));
```

* Attemp two factor password:
```javascript
  const User = require('./UserSchema');
  const mongoose = require('mongoose');
  
  const Types = mongoose.Types;
  const _id = Types.ObjectId('59715f11cf910abed39e39dd');

  // use instance method
  const user = await User.findOne({ _id });
  await user.attemptTFA(password)
    .catch(err => console.log(err));

  // user static method
  const user = await User.attemptTFA(_id, password)
    .catch(err => console.log(err));
```
