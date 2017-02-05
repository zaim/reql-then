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
var r = require('rethinkdb')
  , connect = require('reql-then')
  , reql = connect({
      host: 'localhost',
      port: 28015,
      db: 'test',
      authKey: '',
      maxPoolSize: 10  // set to 1 to disable connection pooling
    });

// Run a query
var query = r.db('MiddleEarth').table('Wizards').get('Gandalf').update({colour: 'White'});
reql(query).then(function (result) {
  // handle result
}).error(function (err) {
  // handle error
}).catch(function (err) {
  // handle exception
});

// Make lazy query functions
var beans = r.table('counter').get('beans')
  , add = reql.lazy(beans.update({count: r.row('count').add(1) }))
  , mul = reql.lazy(beans.update({count: r.row('count').mul(2) }))
  , sub = reql.lazy(beans.update({count: r.row('count').sub(3) }));
add().then(mul).then(sub);

// Disconnect
reql.close().then(function () {
  console.log('good bye');
});
```

## Testing

Testing uses the [mocha](http://mochajs.org/) framework.
A RethinkDB test server needs to be running at `localhost:28015`:

```
$ npm install -g mocha
$ rethinkdb --directory test &
$ npm test
```

Enable debugging messages (assuming `server.js` uses `reql-then`):

```
$ DEBUG=reql-then node server.js
```
