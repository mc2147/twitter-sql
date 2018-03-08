'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var client = require('../db/index');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query('SELECT * FROM tweets', function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    client.query('select * from tweets join users on tweets.user_id = users.id where users.name = $1', [req.params.username], function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    client.query('select * from tweets where tweets.id = $1', [req.params.id], function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
    // var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsWithThatId // an array of only one element ;-)
    // });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    var name = req.body.name;
    var content = req.body.content;

    // var newTweet = tweetBank.add(req.body.name, req.body.content);
    // io.sockets.emit('new_tweet', newTweet);
    // res.redirect('/');

    client.query('select * from users where users.name = $1', [name], function (err, data) {
      console.log("test: " + data.rows.length);
      if (data.rows.length == 0) {
        console.log("test2: " + name);
          client.query("INSERT INTO users (name, picture_url) VALUES ($1, 'http://i.imgur.com/XDjBjfu.jpg') RETURNING id, name", [name], function (err, data2) {
            if (err) {
              console.log("error: " + err);
            }
            else {
              var userId = data2.rows[0].id;
              client.query("INSERT INTO tweets (user_id, content) VALUES ($1, $2) RETURNING id, user_id, content;", [userId, content], function (err, data3) {
                if (err) {
                  console.log("error 3: " + err);
                }
                else {
                  console.log("data 3 row[0]: " + data3.rows[0].user_id + " " + data3.rows[0].content);
                  var newTweet = {name:name, content:content, id:data3.rows[0].id};
                  io.sockets.emit('new_tweet', newTweet);
                }
              });
              console.log("New Row: " + data2.rows[0].id + " " + data2.rows[0].name);
            }
        }
        )
      }
      else {        
        client.query("SELECT id from users where name = $1", [name], function(err,data2){
          var userId = data2.rows[0].id;
          if(err) {
            console.log(err)
          }
          else{
                client.query("insert into tweets (user_id, content) VALUES ($1, $2) RETURNING id, user_id, content;", [userId, content], 
                function (err, data3) {
                  if (err) {console.log(err)}
                  else {
                    var newTweet = {name:name, content:content, id:data3.rows[0].id}; 
                  }
              })        
          }
        })
    }
  })
  })

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
