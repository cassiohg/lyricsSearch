var fs = require('fs');
var path = require('path');

var absolutePathToMusicFolder = "/Users/cassiohg/RECOVERING/Music/";
var relativePathToFolder = path.relative("./", absolutePathToMusicFolder) + "/";


var mp3Files = []
var directoryCounter = 0;

function printAllFiles(pathString) {
	directoryCounter++;
	fs.readdir(pathString, function (err, files) {
		if(err) throw err;

		files.forEach(function (file, i) {
			var relativePath = pathString + file;

			fs.lstat(relativePath, function(err, stats) {
				if (err) throw err;

				if (stats.isFile()) {
					if (path.extname(file) === ".mp3")
						fs.appendFileSync("mp3Paths.txt", relativePath+"\n");
				}
				if (stats.isDirectory()) {
					printAllFiles(relativePath + "/");
				}

				if (i === files.length - 1)
					directoryCounter--;

				// console.log(directoryCounter)
				if (directoryCounter == 0) {
					console.log('finished')
					// console.log(mp3Files)
				}
			});
		});
	});
}

var start = "./";

printAllFiles(relativePathToFolder);
