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
    maxAttempts: 5,
    errors: {
      userNotFound: 'sorry, user not found.'
    }
  };

  const User = new mongoose.Schema({});
  User.plugin(tfaMongoose, config);

  module.exports = mongoose.model('User', User);
```

### how to do two-factor-authentication

This plugin applies two instance methods: `requestTFA()` and `attemptTFA(password)` and two static methods: `requestTFA(_id)` and `attemptTFA(_id, password)` to your schema.

#### Request two factor password:
```javascript
  const User = require('./UserSchema');

  // use instance method
  const user = await User.findOne({ _id: an ObjectId });
  await user.requestTFA()
    .catch(err => console.log(err));

  // user static method
  const user = await User.requestTFA(an ObjectId);
```

#### Attemp two factor password:
```javascript
  const User = require('./UserSchema');

  // use instance method
  const user = await User.findOne({ _id: an ObjectId });
  await user.attemptTFA(password)
    .catch(err => console.log(err));

  // user static method
  const user = await User.attemptTFA(an ObjectId, password);
```

### configuration
TODO

### api
TODO

## TODO
Add test case
