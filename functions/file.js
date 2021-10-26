const lineReader = require('line-reader'); //To read the queue from a txt file.
const fs = require('fs'); // To store the queue.

module.exports = class File {
	constructor() { }

	read(queue) {
		let index = 0;

		lineReader.eachLine('queue.txt', function(line) {
			console.log(line);
			queue[index] = line;
			index++;
		});
	};

	write(queue) {
		fs.writeFile('queue.txt', getQueue(queue), function(err) {
			if(err) {
				return console.log(err);
			}

			console.log("Cola guarda en queue.txt!");
		});
	};
};

function getQueue(queue) {
	let queueTXT = '';

	queue.forEach(function (i){
		queueTXT = queueTXT + queue[i] + '\n';
	});

	return queueTXT;
}