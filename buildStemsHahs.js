var fs = require('fs');
var myJSON = require(__dirname + "/node_modules/myjson/myjson"); //json stringifier and parser modified by me!

var natural = require('natural'),
    tokenizer = new natural.WordTokenizer()
    metaphone = natural.Metaphone;

var snowball = require('node-snowball');
var clj_fuzzy = require('clj-fuzzy');

var tracks = [];
var stemsHash = {};

fs.readFile("lyrics.json", function (err, data) {
	if (err) throw err;
	tracks = JSON.parse(data);
	
	console.log("A total of " + tracks.length + " tracks");

    // for each existing track.
    for (var i = tracks.length - 1; i >= 0; i--) {

    	if (i % 30 == 0) console.log(i);

        // get stemmed tokens for each word in 'tracks[i].lyric'. true is for removing repeated tokens.
        var lyric = tokenizeAndStem(false, tracks[i].lyric.toLowerCase());

        // add steams from a lyric in the hash that holds all steams of all lyrics.
        addStemsToHash(lyric.stems, i);        
    }

    fs.writeFile('stemsHash.json', myJSON.stringify(stemsHash, null, '\t'), function (err) {
    	if (err) throw err;
    	console.log('saved!');
    })
})

function addStemsToHash (stemsArray, trackIndex) {
    for (var j = 0; j < stemsArray.length; j++) {
        if (!stemsHash[stemsArray[j]]) {
            stemsHash[stemsArray[j]] = {belongsTo: [trackIndex],
            							comesBefore: {},
            							comesAfter: {}};
        } else {
        	if (stemsHash[stemsArray[j]].belongsTo.indexOf(trackIndex) == -1)
            	stemsHash[stemsArray[j]].belongsTo.push(trackIndex);
        }

        if (stemsArray[j+1]) {
		    if (stemsHash[stemsArray[j]].comesBefore[stemsArray[j+1]]) {
		    	var oneFollowingStem = stemsHash[stemsArray[j]].comesBefore[stemsArray[j+1]];
		    	if (oneFollowingStem.indexOf(trackIndex) == -1)
		    		oneFollowingStem.push(trackIndex);
		    } else {
		    	stemsHash[stemsArray[j]].comesBefore[stemsArray[j+1]] = [trackIndex];
		    }
		}

		if (stemsArray[j-1]) {
			if (stemsHash[stemsArray[j]].comesAfter[stemsArray[j-1]]) {
	        	 var onePreviousStem = stemsHash[stemsArray[j]].comesAfter[stemsArray[j-1]];
	        	 if (onePreviousStem.indexOf(trackIndex) == -1)
	        	 	onePreviousStem.push(trackIndex);
	        } else {
	        	stemsHash[stemsArray[j]].comesAfter[stemsArray[j-1]] = [trackIndex];
	        }
		}
    }
}

function tokenizeAndStem (deduplicate, text) {
    var tokens = tokenizer.tokenize(text);

    var stems = applyForEach(tokens, [natural.PorterStemmer.stem]);
    // var stems = applyForEach(tokens, [natural.PorterStemmer.stem]);
    if (deduplicate) {
        stems = deDuplicateInArray(stems);
    }

    var metaphones = applyForEach(stems, [metaphone.process])

	return {tokens: tokens, stems: stems};
}

function applyForEach (array, funcs) {
    var ret = [];
    for (var j = 0; j < array.length; j++) {
    	var stem = array[j];
    	for (var k = 0; k < funcs.length; k++) {
    		var func = funcs[k];
    		var newStem = func(array[j]);
    		if (stem.length > newStem.length) {
    			stem = newStem;	
    		}
    	}
    	ret.push(stem);
    }
    return ret;
}

function deDuplicateInArray (array) {
    var set = {};
    for (var j = 0; j < array.length; j++) {
        if (!set[array[j]])
            set[array[j]] = true;
    };
    return Object.keys(set);
}