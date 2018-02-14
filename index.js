var restify = require('restify');
var builder = require('botbuilder');

var request = require("request");



var fs = require('fs');
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var inMemoryStorage = new builder.MemoryBotStorage();

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.send("Please provide the crop you've harvested.");
        builder.Prompts.choice(session, "Which commodity?", "rice|chikoo|corriander", { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        session.dialogData.crop = results.response;
        callApi(session.dialogData.crop, function (data) {
            builder.Prompts.time(session, "Where do you want to sell your produce?");
        });

    },
    function (session, results) {
        session.dialogData.state = results.response;
        session.send('My advise is to sell ' + session.dialogData.crop + ' for Rs. 5000 ');
        session.endDialog();
    }
]).set('storage', inMemoryStorage); // Register in-memory storage 

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                var reply = new builder.Message()
                    .address(message.address)
                    .text('Hello,Welcome to the 3saeFarming.');
                bot.send(reply);
            }
        });
    }
});

function callApi(crop,callback) {

    var options = {
        method: 'GET',
        url: 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
        qs:
        {
            format: 'json',
            'api-key': '579b464db66ec23bdd00000182645d06de5e416a5772c57af1e3ae49'
        },
        headers:
        {
            'postman-token': 'eb5bfda8-526b-a58a-a736-7ba6024c1029',
            'cache-control': 'no-cache'
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
        callback(body)
    });

}


