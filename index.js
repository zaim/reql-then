var r = require('rethinkdb')
  , debug = require('debug')('reql-then:main')
  , timing = require('debug')('reql-then:timing')
  , Pool = require('generic-pool').Pool
  , Promise = require('bluebird');


var pools = {};

function connectionKey (conn) {
  return conn.host + ':' + conn.port;
}


function validateConfig (config) {
  if (typeof config === 'undefined') {
    config = {};
  } else if (typeof config === 'string') {
    config = {host: config};
  }
  config.host = config.host || 'localhost';
  config.port = config.port || 28015;
  config.minReportTime = config.minReport || process.env.MIN_REPORT_TIME || 10000; /* Report timing after 10 seconds */
  return config;
}


function createPool (key, config) {
  debug('createPool: %s', key);
  return Pool({
    name: 'rethinkdb://' + key,
    create: function (callback) {
      debug('new: %s', key);
      return r.connect(config, callback);
    },
    validate: function (conn) {
      debug('validate: %s', connectionKey(conn));
      return conn.open;
    },
    destroy: function (conn) {
      debug('destroy: %s', connectionKey(conn));
      conn.close();
    },
    min: 1,
    max: config.maxPoolSize || 10,
    log: debug
  });
}


function connect (config) {
  config = validateConfig(config);

  var key = connectionKey(config)
    , pool = pools[key] || (pools[key] = createPool(key, config))
    , reql;

  reql = function (query) {
    var acquire = Promise.promisify(pool.acquire, pool)
      , run = Promise.promisify(query.run, query);
    debug('acquiring: %s', key);
    return acquire().then(function (conn) {
      debug('acquired: %s', connectionKey(conn));
      var start = new Date();
      return run(conn)
        .then(function(result) {
          var end = new Date();
          var total = end-start;
          if (total >= config.minReportTime) {
            timing('Query ' + query.toString() + ' took ' + total + 'ms');
          }
          return result;
        })
        .finally(function () {
          debug('releasing: %s', connectionKey(conn));
          pool.release(conn);
        });
    });
  };

  reql.lazy = function (query) {
    return function () {
      return reql(query);
    };
  };

  reql.close = function () {
    var drain = Promise.promisify(pool.drain, pool);
    debug('closing: %s', key);
    return drain().then(function () {
      debug('destroyAllNow: %s', key);
      pool.destroyAllNow();
    });
  };

  reql.getConnectionPool = function () {
    return pool;
  };

  return reql;
}

module.exports = connect;
