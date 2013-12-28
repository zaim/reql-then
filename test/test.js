var r = require('rethinkdb')
  , assert = require('assert')
  , Promise = require('bluebird')
  , connect = require('..');


// Make sure to start up a test server
var testServer = {
  host: '127.0.0.1',
  port: 28015,
  db: 'reql_then_test'
};

// Shortcuts
var db = r.db(testServer.db)
  , table = db.table('test');


describe('connect', function () {

  it('should be a function', function () {
    assert.strictEqual(typeof connect, 'function');
  });


  describe('()', function () {

    var reql;

    beforeEach(function () {
      reql = connect(testServer);
    });

    it('should return the reql function', function () {
      assert.strictEqual(typeof reql, 'function');
    });


    describe('reql', function () {

      it('should have member functions', function () {
        assert.strictEqual(typeof reql.close, 'function');
        assert.strictEqual(typeof reql.getConnectionPool, 'function');
      });


      describe('getConnectionPool', function () {
        it('should return correct connection pool', function () {
          var pool = reql.getConnectionPool();
          assert.equal(pool.getName(),
            'rethinkdb://127.0.0.1:28015');
        });

        it('should have minimum connection objects', function () {
          var pool = reql.getConnectionPool();
          assert.equal(pool.getPoolSize(), 1);
        });
      });


      describe('close', function () {
        var promise;

        before(function () {
          promise = reql.close();
        });

        it('should return a promise', function () {
          assert.ok(Promise.is(promise));
        });

        it('should close connections', function (done) {
          promise.then(function () {
            var pool = reql.getConnectionPool();
            assert.equal(pool.getPoolSize(), 0);
            done();
          }).catch(done);
        });

        it('should raise error when reaccessing', function (done) {
          promise.then(function () {
            var query = table.count();
            reql(query).then(function () {
              // should not reach here
              assert.fail('runs query', 'throws error');
            }).catch(function (e) {
              done();
            });
          }).catch(done);
        });
      });


      describe('new server', function () {

        beforeEach(function () {
          reql = connect({
            host: 'localhost'
          });
        });

        it('should return new pool', function () {
          var pool = reql.getConnectionPool();
          assert.equal(pool.getName(),
            'rethinkdb://localhost:28015');
        });

        it('should have minimum connection objects', function () {
          var pool = reql.getConnectionPool();
          assert.equal(pool.getPoolSize(), 1);
        });


        describe('run', function () {
          var query = table.count();

          beforeEach(function (done) {
            var pool = reql.getConnectionPool();
            pool.acquire(function (err, conn) {
              if (err) return done(err);
              r.dbCreate(testServer.db).run(conn, function (err) {
                db.tableCreate('test').run(conn, function (err) {
                  table.insert({message:'hello'}).run(conn, done);
                });
              });
            });
          });

          afterEach(function (done) {
            var pool = reql.getConnectionPool();
            pool.acquire(function (err, conn) {
              if (err) return done(err);
              r.dbDrop(testServer.db).run(conn, done);
            });
          });

          it('should return a promise', function () {
            var res = reql(query);
            assert.ok(Promise.is(res));
          });

          it('should run query', function (done) {
            var res = reql(query);
            res.then(function (c) {
              assert.equal(c, 1);
              done();
            }).catch(done);
          });

        });

      });

    });

  });

});
