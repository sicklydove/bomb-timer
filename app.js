http = require('http');
fs = require('fs');
url = require('url')
 
port = 3000;

users = {}
BOMB_SECS = 40

server = http.createServer( function(req, res) {
 
    if (req.method == 'POST') {
        res.writeHead(200, {'Content-Type': 'text/html'});
 
        var body = '';
        req.on('data', function (data) {
            body += data;
        });

        req.on('end', function () {
            obj = JSON.parse(body)
            var username = obj.player.name;
            var ts = obj.provider.timestamp;

            if(!users.hasOwnProperty(username)){
                users[username] = {'planted': false, 'explodes': null};
            }

            player = users[username];

            if(obj.hasOwnProperty('round')){

                // bomb WAS NOT planted and now IS
                if(obj.round.bomb == "planted"){
                    if(!player.planted){
                        player = {
                            "planted": true,
                            "explodes": ts + BOMB_SECS * 1000
                        }
                    }
                }

                // round over - reset bomb status
                if(obj.round.phase == "over"){
                    player = {'planted': false, 'explodes': null};
                }
            }

            console.log(users);

        	res.end( '' );
        });
    }
    else {
        var url_parts = url.parse(req.url, true);
        var qry = url_parts.query

        console.log(JSON.stringify(users[qry.username]));
        res.writeHead(200, {'Content-Type': 'json'});
        res.end(JSON.stringify(users[username]));
    }
 
});
 
server.listen(port);
console.log('Listening on port ' + port);