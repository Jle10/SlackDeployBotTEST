const File = require('./file.js');

module.exports = class Queue {
	constructor() {
		// this.deployQueue = [['', '']];
		this.deployQueue = [];
		this.formatQueue = '';
		this.file = new File();
	};

	add(user, priority){
		//bucle que revise la prioridad y reordene
		//this.deployQueue.push([user, priority]);
		this.deployQueue.push(user);
	};

	getQueue() {

	};

	storeQueue() {
		this.file.write(this.deployQueue);
	};

	loadQueue() {
		this.file.read(this.deployQueue);
	};

	printQueue(deployQ) {
		let formatQ = this.formatQueue;

		deployQ.forEach(function (item, i){
			if(i === 0) {
				formatQ = (i+1) + '.) *' +  item + '*\n';
			}
			else {
				formatQ =  formatQ + (i+1) + '.) *' +  item + '*\n';
			}
		});

		return formatQ;
	};
};