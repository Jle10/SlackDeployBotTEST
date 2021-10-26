var Queue = require('../functions/queue.js');

module.exports = class Deploy {
	constructor(response, request) {
		this.response = response;
		this.request = request;
		//this.priority = priority;
		this.queue = new Queue();
	}

	getUser(){
		return  this.request.body.user_name;
	};

	start(user, priority) {
		let time = Math.floor(new Date() / 1000);

		if(!priority) {priority = 0;}

		this.queue.add(this.getUser(), priority);

		if(this.queue.deployQueue[1] === undefined) {
			this.response.status(200).json({
				"response_type": "in_channel",
				"text": "<@" + user + "> ha empezado un deploy/debug en PROD -- *<!date^"+ time +"^{time}|Algo va mal con la fecha>* \nEsto son los turnos: ",
				"attachments": [
					{
						"text": this.show()
					}
				]
			});
		}
		else {
			this.response.status(200).json({
				"response_type": "in_channel",
				"text": "<@" + user + "> ha sido añadido a la cola \nEsto son los turnos: ",
				"attachments": [
					{
						"text": this.show()
					}
				]
			});
		}
	};

	remove() {

	}

	end() {

	}

// ---- SHOW DEPLOY QUEUE ---
	show() {
		let formatQueue = this.queue.printQueue();

		if(formatQueue) {
			this.response.status(200).json({
				"response_type": "in_channel",
				"text": "Esto son los turnos: \n",
				"attachments": [
					{
						"text": formatQueue
					}
				]
			});
		}
		else {
			this.response.send("No hay nadie!! *DEPLOY LIBRE* pero no olvides apuntarte con '/deploy start'");
		}
	}
};