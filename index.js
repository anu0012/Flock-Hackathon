var flock = require('flockos');
var config = require('./config.js');
var express = require('express');
var fs = require('fs');

flock.setAppId(config.appId);
flock.setAppSecret(config.appSecret);

var app = express();

// Listen for events on /events, and verify event tokens using the token verifier.
app.use(flock.events.tokenVerifier);
app.post('/events', flock.events.listener);

// Read tokens from a local file, if possible.
var tokens;
try {
    tokens = require('./tokens.json');
} catch (e) {
    tokens = {};
}

// save tokens on app.install
flock.events.on('app.install', function (event) {
    tokens[event.userId] = event.token;
});

// delete tokens on app.uninstall
flock.events.on('app.uninstall', function (event) {
    delete tokens[event.userId];
});

// slash commands
flock.events.on('client.slashCommand', function (event) {
	// Text Translation
	const translate = require('google-translate-api');
	const languages = require('google-translate-api/languages');
	var lang = event.text.split('$');
	//console.log(lang);
	var language = 'en';
	var msg = event.text;
	if(lang.length > 1)
	{
		var s = lang[lang.length-1];
		language= languages.getCode(s);
		if(!language)
		{
			language = 'en';
			msg = event.text;
		}
		else
		{
			var li = event.text.split(' ');
			msg = '';
			for(var i=0;i<li.length-1;i++)
			{
			msg += li[i] +' ';
			}
		}
		
	}
	
//console.log(msg);
 	
	translate(msg, {to: language}).then(res => {
    console.log(res.text);
    
	flock.callMethod('chat.sendMessage', tokens[event.userId], {
        to: event.chat,
        text: res.text
    }, function (error, response) {
        if (!error) {
            console.log('uid for message: ' + response.uid);
        } else {
            console.log('error sending message: ' + error);
        }
    });
    
	}).catch(err => {
    console.error(err);
    return "error";
	});
    
    
});

// Start the listener after reading the port from config
var port = config.port || 8080;
app.listen(port, function () {
    console.log('Listening on port: ' + port);

    //var msg = doGet();
    //console.log(msg);

});

// exit handling -- save tokens in token.js before leaving
process.on('SIGINT', process.exit);
process.on('SIGTERM', process.exit);
process.on('exit', function () {
    fs.writeFileSync('./tokens.json', JSON.stringify(tokens));
});