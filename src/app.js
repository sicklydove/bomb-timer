http = require('http');
fs = require('fs');
url = require('url')
 
var BOMB_SECS = 40;
var PORT = 3000;

// Keep all users in in-memory cache
// This'll work for now, but should be moved to mongo or something if popular
var users = {};
var username_to_steamid = {};

server = http.createServer( function(req, res) {
 
    // POST requests coming from CSGO gamestate
    if (req.method == 'POST') {
        res.writeHead(200, {'Content-Type': 'text/html'});
 
        var body = '';
        req.on('data', function (data) {
            body += data;
        });

        req.on('end', function () {
            var gamestate = JSON.parse(body);

            var username = gamestate.player.name;
            var steamid = gamestate.player.steamid;

            if(!users.hasOwnProperty(steamid)){
                users[steamid] = {'planted': false, 'explodes': null};
            }
            if(!username_to_steamid.hasOwnProperty(username)){
                username_to_steamid[username] = steamid;
            }

            var player = users[steamid];

            if(gamestate.hasOwnProperty('round')){
                if(gamestate.round.bomb == "planted" && !player.planted){
                    player = {
                        "planted": true,
                        // csgo timestamp is seconds since epoch - convert to millis
                        "explodes_at": (gamestate.provider.timestamp + BOMB_SECS) * 1000
                    }
                }

                if(gamestate.round.phase == "over"){
                    player = {'planted': false, 'explodes': null};
                }

                users[steamid] = player;
            }

            if(gamestate.hasOwnProperty('map') && gamestate.map.phase == "gameover"){
                delete(users[steamid]);
            }

        	res.end('');
        });
    }

    // GET requests coming from client
    else {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Request-Method', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
        res.writeHead(200, {'Content-Type': 'application/json'});

        var qry = url.parse(req.url, true).query;
        if(!qry.hasOwnProperty('username')){
            res.end('');
        }

        var steamid = qry.username;

        // Make a best-guess if we only have username
        if(isNaN(steamid)){
            steamid = username_to_steamid[steamid];
        }

        res.end(JSON.stringify(users[steamid]));
    }
 
});
 
// Don't do this...
process.on('uncaughtException', function (err) {
  console.log('Gotta catch em all!: ' + err);
});

console.log('Listening on port ' + PORT);

server.listen(PORT);
