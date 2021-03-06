var express = require('express');
var app = express();
var cool = require('cool-ascii-faces');
var pg = require('pg');
var mongodb = require('mongodb');
var bp = require('body-parser');
var basicAuth = require('basic-auth-connect');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bp.json());

app.use(bp.urlencoded({
    extended: true
}));

var auth = basicAuth(function(user, pass) {
    return((user ==='cs360')&&(pass === 'test'));
});

app.get('/', function(request, response) {
  var result = '';
  var times = process.env.TIMES || 5;
  for(i = 0; i < times; i++)
    result += cool() + '\n';
  response.send(result);
});

app.get('/comments', function(request, response) {
    mongodb.MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
        if(err) throw err;
        db.collection('comments', function (err, comments) {
            if(err) throw err;
            comments.find({}).toArray(function (err, all_comments) {
                if(err) throw err;
                all_comments.forEach(function (comment) {
                    console.log('Got a comment from: ' + comment['name'] + ' saying: ' + comment['comment']);
                });
                response.send(all_comments);
                db.close();
            });
        });
    });
});

app.post('/comments', auth, function(request, response) {
    mongodb.MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
        if(err) throw err;
        db.collection('comments', function (err, comments) {
            if(err) throw err;
            comments.insert(request.body, function (err, result) {
                if(err) throw err;
                response.send(200);
                db.close();
            });
        });
    });
});

app.get('/db', function(request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM test_table', function(err, result) {
      done();
      if(err) {
        console.error(err);
        response.send("Error " + err);
      }
      else {
        response.send(result.rows);
      }
    });
  });
});

app.get('/cities', function(request, response) {
    var letters = request.query.q;
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query('SELECT name FROM cities WHERE name LIKE \'%' + letters + '%\'', function(err, result) {
            done();
            if(err) {
                console.error(err);
                response.send("Error " + err);
            }
            else {
                response.send(result.rows);
            }
        })
    })
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
