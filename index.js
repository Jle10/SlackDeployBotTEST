// Import express and request modules
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser'); //Para poder leer los POST que hagan
var urlencodedParser = bodyParser.urlencoded({ extended: false });

//Import commands
const Help = require('./commands/help.js');
const Deploy = require('./commands/deploy.js');
const Queue = require('./functions/queue.js');

//Apollo URL: http://18.194.23.56:5000/
const PORT=5002;

// Store our app's ID and Secret. These we got from Step 1. 
// For this tutorial, we'll keep your API credentials right here. But for an actual app, you'll want to  store them securely in environment variables. 
var clientId = '2334790112.629113793923';
var clientSecret = 'bcb9211ab8a2256b583bfb899e8a8600';

// Instantiates Express and assigns our app variable to it
var app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// Lets start our server
app.listen(PORT, function () {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("deployQueueAPP ejecutada con exito en el puerto: " + PORT);
});

// This route handles GET requests to our root ngrok address and responds with the same "Ngrok is working message" we used before
app.get('/', function(req, res) {
    res.send('Ngrok esta funcionando bb: ' + req.url);
});

// This route handles get request to a /oauth endpoint. We'll use this endpoint for handling the logic of the Slack oAuth process behind our app.
app.get('/oauth', function(req, res) {
    // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
    if (!req.query.code) {
        res.status(500);
        res.send({"Error": "Looks like we're not getting code."});
        console.log("Looks like we're not getting code.");
    } else {
        // If it's there...

        // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
        request({
            url: 'https://slack.com/api/oauth.access', //URL to hit
            qs: {code: req.query.code, client_id: clientId, client_secret: clientSecret}, //Query string data
            method: 'GET', //Specify the method

        }, function (error, response, body) {
            if (error) {
                console.log(error);
            } else {
                res.json(body);

            }
        })
    }
});

//TODO: Cambiar todo los "var XXX = function() por "function XXX()"

// var deployQ = [];
var queue = new Queue();
var deployQ = queue.deployQueue;

// *********************** FUNCTIONS ***********************************
//------- STORE QUEUE (as a .txt file) -----------
// var storeQueue = function() {
// 	queue.storeQueue();
// };

//------- GET DEPLOY QUEUE (as A STRING LIST) -----------
var printQueue = function() {
	return queue.printQueue(deployQ);
};

//------- GET DEPLOY QUEUE (as A STRING LIST) -----------
// var getQueue = function() {
// 	var queueTXT = '';
// 	for(i=0; i < deployQ.length; i++) {
// 		queueTXT = queueTXT + deployQ[i] + '\n';
// 	}
// 	return queueTXT;
// };

//------- REMOVE user FROM DEPLOY QUEUE ----------------
var remove = function(user) {
	var index = deployQ.indexOf(user);

	if (index < 0) {
		return false;
	}

	console.log('Se ha borrado a -> ' + deployQ[0] + ' de la cola');
	deployQ.splice(index, 1);
	console.log('El siguiente es ->' + deployQ[0]);

	storeQueue(); //Actualice the queue.txt

	return true;
};

//------- REMOVE user FROM QUEUE and WARNS the CHAT that the turn is over ----------------
var endDeploy = function(req, res, user){

	if(deployQ[0] === user && deployQ[1] !== undefined) {
		remove(user);
		res.status(200).json({
			"response_type": "in_channel",
			"text": '<@' + user + '> ha terminado!',
			"attachments": [
				{
					"text":'¡Es tu turno <@' + deployQ[0] + '>!'
				}
			]
		});
		//TODO: Notificar al siguiente, si lo hubiera, por privado

		// res.status(200).json({
		// 	  "channel": deployQ[0],
		// 	  "message": {
		// 	    "attachments": [
		// 	      {
		// 	        "fallback": "This is an attachment's fallback",
		// 	        "id": 1,
		// 	        "text": "This is an attachment"
		// 	      }
		// 	    ],
		// 	    "bot_id": "AJH3BPBT5",
		// 	    "subtype": "bot_message",
		// 	    "text": "Here's a message for you",
		// 	    "ts": time,
		// 	    "type": "message",
		// 	    "username": "deployQueue"
		// 	  },
		// 	  "ok": true,
		// 	  "ts": time
		// });
	} else if(remove(user)) {
		if(deployQ[0] === undefined) {
			res.status(200).json({
				"response_type": "in_channel",
				"text": "¡No hay nadie en la cola! ",
				"attachments": [
					{
						"text": "*DEPLOY LIBRE*",
						"color": "#00fb04"
					}
				]
			});
		} else {
			res.send('Tu siguiente turno ha sido eliminado de la cola con exito');
		}
	} else {
		res.status(200).json({
			"text": "¡No tienes turno en la cola!",
			"attachments": [
				{
					"text": "Puedes apuntarte con *'/deploy start'*"
				}
			]
		});
	}
};

//------- REMOVE user FROM DEPLOY QUEUE ----------------
var removeDeploy = function(req, res, user) {
	res.status(200).json({
		"text": 'Este comando ha sido eliminado! Prueba con */deploy end*',
	});
};

// ---- SHOW DEPLOY QUEUE ---
var showDeploy = function(req, res) {
	if(queue.printQueue(deployQ)) {
		res.status(200).json({
			"response_type": "in_channel",
			"text": "Esto son los turnos: \n",
			"attachments": [
				{
					"text": queue.printQueue(deployQ),
					"color": "#0011bd"
				}
			]
		});
	}
	else {
		res.send("No hay nadie!! *DEPLOY LIBRE* pero no olvides apuntarte con '/deploy start'");
	}
};

var reorderQueue = function(params) {
	return true
	//TODO: Reordenar la cola
};

// ---- GET /deploy params ---
var getParams = function(req){
	var str = req.body.text;
	var params = str.split(" ");

	return(params);
};

// ---- ADD TO QUEUE ---
var deploy = function(req, res, user) {
	var time = Math.floor(new Date() / 1000);
	var params = getParams(req);

	if(params > 1){
		reorderQueue(params);
	}

	deployQ.push(user); //Insert new User's deploy turn
	queue.storeQueue(); //Actualice the queue.txt

	if(deployQ[1] === undefined) {
		res.status(200).json({
			"response_type": "in_channel",
			"text": "<@" + user + "> ha empezado un deploy/debug en PROD -- *<!date^"+ time +"^{time}|Algo va mal con la fecha>* \nEsto son los turnos: ",
			"attachments": [
				{
					"text": queue.printQueue(deployQ),
					"color": "#0011bd"
				}
			]
		});
	}
	else {
		res.status(200).json({
			"response_type": "in_channel",
			"text": "<@" + user + "> ha sido añadido a la cola \nEsto son los turnos: ",
			"attachments": [
				{
					"text": queue.printQueue(deployQ),
					"color": "#0011bd"
				}
			]
		});
	}
};

//Manage the slash commands that will generate button responses
var voteYes = 0;
var voteNo = 0;
var zkcrew = [];

var clearQueue = function(req, res) {
	res.status(200).end(); //Parece que segun la API es la mejor practica para devolver un 200
	voteYes = 0;//Reset values after the vote starts
	voteNo = 0;
	zkcrew = [];

	var responseURL = req.body.response_url;
	if (req.body.token !== 'yOjuxAxUt3k1apbTiH1JW9r9') { //Testeando validacion de token
		res.status(403).end("Acceso Denagado")
	} else if(deployQ !== undefined) {
		var message = {
			'response_type': 'in_channel',
			'text': '<!channel> *Empieza la votacion para limpiar la cola!*',
			'attachments': [
				{
					'text': 'Se necesitan un mínimo de *3 VOTOS* "SI"',
					'fallback': 'Whooops! Algo no va bien',
					'callback_id': 'vote_buttons',
					'color': '#5baaa1',
					'attachment_type': 'default',
					'actions': [
						{
							'name'  : 'si',
							'text'  : 'SI!',
							'type' : 'button',
							'value' : 'yes'
						},
						{
							'name'  : 'no',
							'text'  : 'NO, PLEASE NO!!',
							'type' : 'button',
							'value' : 'no',
							'style' : 'danger'
						}
					]
				}
			]
		};
		sendMessageToSlack(message, responseURL);
	} else {
		message = {
			'attachments': [
				{
					'text': 'No hay cola de deploy que borrar CABESA!!!',
					'fallback': 'Whooops! Algo no va bien',
					'callback_id': 'vote_buttons',
					'color': '#aa0003',
					'attachment_type': 'default',
				}
			]
		};
		sendMessageToSlack(message, responseURL)
	}
};

var sendMessageToSlack = function(message, url){
	var sendPost = {
		method: 'POST',
		header: {
			'Content-type': 'application/json'
		},
		json: message
	};

	request(url, sendPost);
};

// *********************** SLASH COMMANDS ***********************************
app.post('/actions', urlencodedParser, function(req, res){
	res.status(200).end();

	var actionJSONPayload = JSON.parse(req.body.payload); // parse URL-encoded payload JSON string

	var check = ':negative_squared_cross_mark: ';
	if(actionJSONPayload.actions[0].name === 'si') {
		check = ':ballot_box_with_check:';
	}

	var message = {
		"text": check + " Has votado: *" + actionJSONPayload.actions[0].name + "*!!",
		"replace_original": false
	};

	console.log('VOTACIÓN: ' + actionJSONPayload.user.name + " votó: " + actionJSONPayload.actions[0].name);

	if(actionJSONPayload.callback_id === 'vote_buttons') {

		if(zkcrew.indexOf(actionJSONPayload.user.name) === -1) {
			zkcrew.push(actionJSONPayload.user.name);

			if (voteYes === 2) {
				message = {
					"response_type": "in_channel",
					"attachments": [
						{
							"text": "Se han conseguido 3 votos! se BORRA la cola del deploy!!\n" +
									"Se cierra la votación: *DEPLOY LIBRE!*",
							"color": "#16ff00"
						}
					],
					"replace_original": true
				};

				deployQ = [];
				storeQueue();

			} else if(voteNo === 2) {
				message = {
					"response_type": "in_channel",
					"attachments": [
						{
							"text": "Se ha votado *NO* 3 veces! no se BORRARÁ la cola del deploy!!\n" +
									"Se cierra la votación",
							"color": "#ff0000"
						}
					],
					"replace_original": true
				};

			} else {
				if(actionJSONPayload.actions[0].name === 'si') {
					voteYes++;
				} else {
					voteNo++;
				}
			}
		} else {
			message = {
				"text": "Ya has votado :sweat_smile:!! Espera a que termine la votación para saber el resultado :wink:",
				"replace_original": false
			};
		}

		sendMessageToSlack(message, actionJSONPayload.response_url);

		console.log('Acumulados ' + voteYes + ' Sí');
		console.log('Acumulados ' + voteNo + ' No');
	}
});

app.post('/deploy', function(req, res) {
	var user = req.body.user_name;
	var params = req.body.text.split(" ");

	var help = new Help(res);
	//var deploy = new Deploy(res, req);

	switch(params[0]){
		case 'start':
			// deploy.start(user, params[1]);
			deploy(req, res, user);
			break;
		case 'end':
			endDeploy(req, res, user);
			break;
		case 'remove':
			removeDeploy(req, res, user);
			break;
		case 'show':
			showDeploy(req, res);
			// deploy.show();
			break;
		case 'help':
			help.send();
			break;
		case 'store':
			storeQueue();
			break;
		case 'load':
			queue.loadQueue();
			break;
		case 'clear':
			clearQueue(req, res);
			break;
		default:
			help.send();
	}
});

