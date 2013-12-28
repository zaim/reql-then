# ReQL, then

Promisify [RethinkDB](http://rethinkdb.com/)'s ReQL queries.
Inspired by [rql-promise](https://github.com/guillaumervls/rql-promise).
Uses the [bluebird](https://github.com/petkaantonov/bluebird) promise library.

## Install

```
npm install --save rethinkdb reql-then
```

## Usage

```javascript
var connect = require('reql-then')
  , reql = connect({
      host: 'localhost',
      port: 28015,
      db: 'test',
      authKey: '',
      maxPoolSize: 10
    });

// Make a query
var query = r.db('MiddleEarth').table('Wizards').get('Gandalf').update({'colour': 'White'});
reql(query).then(function (result) {
  // handle result
}).error(function (err) {
  // handle error
}).catch(function (err) {
  // handle exception
});

// Disconnect
reql.close().then(function () {
  console.log('good bye');
});
```

## Testing

Run tests:

```
$ npm test
```

Enable debugging messages (assuming `server.js` uses `reql-then`):

```
$ DEBUG=reql-then node server.js
```
