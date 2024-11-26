var path = require('path');
var tracklist = require('tracklist');

var natural = require('natural'),
    tokenizer = new natural.WordTokenizer()
    metaphone = natural.Metaphone;

var clj_fuzzy = require('clj-fuzzy');


var tracks = [];
var stemsHash = {};

tracklist.list(".")
.on('file', function (filePath, tags) {
	if(tags.lyrics) {
		tracks.push({track: path.basename(filePath,'.mp3'),
	                path: filePath,
	                lyric: tags.lyrics.text.text});	
	}
})
.on('end', function () {

    // for each existing track.
    for (var i = tracks.length - 1; i >= 0; i--) {

        // get stemmed tokens for each word in 'tracks[i].lyric'. true is for removing repeated tokens.
        var lyricStems = tokenizeAndStem(false, tracks[i].lyric);

        // add steams from a lyric in the hash that holds all steams of all lyrics.
        addStemsToHash(lyricStems, i);        
    };

    // get stemmed tokens for the search string.
    var searchStems = tokenizeAndStem(false, "promises to me every word");

    // get score for all existing track index, related to current search steams.
    var score = scoringConsecutiveStems(searchStems);

    // order track indexes by score
    var ordered = orderScore(score);

    console.log(score)
    console.log(ordered)
    console.log(tracks[Object.keys(ordered[ordered.length - 1])])
    console.log(stemsHash);
    var fs = require('fs');
    // fs.writeFile('stemsHash.json', JSON.stringify(stemsHash, null, '\t'), function (err) {
    // 	if (err) throw err;
    // 	console.log('saved!');
    // 	console.log(searchStems)
    // });
});

function orderScore(scoreArray) {
    var orderedScoreArray = [];
    for (var i = 0; i < scoreArray.length; i++) {
        if (!orderedScoreArray[scoreArray[i]]) {
            orderedScoreArray[scoreArray[i]] = {};
        }
        orderedScoreArray[scoreArray[i]][i] = scoreArray[i];
    };
    return orderedScoreArray;
}

function scoringConsecutiveStems (searchStems) {
    var scoreArray = [];
    for (var i = 0; i < searchStems.length; i++) { // for each stem on te search string.
        var matchedTracks = stemsHash[searchStems[i]].belongsTo; // get all tracks indexes that have that stem.
        if (matchedTracks){ // if that search string steam actually exists on at least one track.
            for (var j = 0; j < matchedTracks.length; j++) { // for all tracks indexes.
                if (scoreArray[matchedTracks[j]]) { // if that track index exists on 'scoreArray'.
                    scoreArray[matchedTracks[j]] += 1; // increment that index in 'scoreArray'.
                } else { // if it doesn't.
                    scoreArray[matchedTracks[j]] = 1;
                    // set that index' value to 1. if necessary, increase array size to fit it.
                }
            };
        }

        if (searchStems[i+1]) { // if there's a next stem in the search.
	        var nextStems = stemsHash[searchStems[i]].comesBefore; // get all next stems.
	        if (nextStems) { // if there's any next stem.
        		var tracksWithNextStem = nextStems[searchStems[i+1]]; // get all track indexes of the next stem.
        		if (tracksWithNextStem) { // if there's any track index (there should always be at this point of the code).
        			for (var k = 0; k < tracksWithNextStem.length; k++) { // for each track index.
        				if (scoreArray[tracksWithNextStem[k]]) {
        					scoreArray[tracksWithNextStem[k]] += 1;
        				} else {
        					scoreArray[tracksWithNextStem[k]] = 1;
        				}
        			}
        		}
	        }
        }
    }
    return scoreArray;
}

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

    var stems = applyForEach(tokens, natural.PorterStemmer.stem);
    if (deduplicate) {
        stems = deDuplicateInArray(stems);
    }

    var metaphones = applyForEach(stems, metaphone.process)

    return stems;
}

function applyForEach (array, func) {
    var ret = [];
    for (var j = 0; j < array.length; j++) {
        ret.push(func(array[j]));
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