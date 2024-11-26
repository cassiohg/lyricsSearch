var fs = require('fs');
var path = require('path');
var id3 = require ('id3');
var myJSON = require(__dirname + "/node_modules/myjson/myjson"); //json stringifier and parser modified by me!

fs.readFile("mp3Paths.txt", "utf-8", function (err, data) {
	var paths = data.slice(0, data.length - 1).split('\n');

	var tracks = [];

	for (var i = 0; i < paths.length; i++) {
		var trackRelativePath = paths[i];
		var tags = id3(fs.readFileSync(trackRelativePath));
		if (i % 50 == 0) console.log(i);
		if (tags.lyrics) {
			tracks.push({track: path.basename(trackRelativePath,'.mp3'),
	                	path: trackRelativePath,
	                	lyric: tags.lyrics.text.text});
		}
	}

	fs.writeFile('lyrics.json', myJSON.stringify(tracks, null, "\t"), function (err) {
		if (err) throw err;
		console.log('It\'s saved!');
	})
})

// var str = "../../../RECOVERING/Music/The Offspring/The Madison/The Madison - When You (Original Mix).mp3"
// console.log(id3(fs.readFileSync(str)))