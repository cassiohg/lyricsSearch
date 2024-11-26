var fs = require('fs');

var natural = require('natural'),
    tokenizer = new natural.WordTokenizer()
    metaphone = natural.Metaphone;

// var snowball = require('node-snowball');
var clj_fuzzy = require('clj-fuzzy');

var tracks = JSON.parse(fs.readFileSync("lyrics.json"));
var stemsHash = JSON.parse(fs.readFileSync("stemsHash.json"));
var stemsArray = stemsArray = Object.keys(stemsHash);

var fullPoint = 2; // points for tracks that have a stem in the seach query that exists in the hash of all stems.
var halfPoint = 1; // points for tracks that have a stem close to one in the search query.

var stemmerFunctions = [natural.PorterStemmer.stem]
var levenshteinCosts = {insertion_cost: 1, deletion_cost: 2, substitution_cost: 2}

exports.search = function (string) {

            
            // var searchStrings = ["when we control the sunlight breath me in",
            //                 "your eyes open all that we care to find simple so awaken your heart your mind by you",
            //                 "you get to yourself turning circles if you shine go"];

            // var searchString = searchStrings[searchStrings.length-1].toLowerCase();
            var searchString = string.toLowerCase();

            //get stemmed tokens for the search string.
            var search = tokenizeAndStem(false, searchString);
            var maxScore = (search.stems.length*2 - 1)*fullPoint;

            // get score for all existing track index, related to current search steams.
            var score = scoringConsecutiveStems(search.stems);

            // order track indexes by score
            var ordered = orderScore(score);

            // console.log(ordered[ordered.length-1]);
            

            var lyricsFound = {tokens: [], stems: [], score: [], trackName: [], lyric: []};

            var bestTracksIndexes = ordered[ordered.length-1];
            if (bestTracksIndexes) {
                bestTracksIndexes = Object.keys(bestTracksIndexes);
                for (var i = bestTracksIndexes.length - 1; i >= 0; i--) {
                    var trackIndex = bestTracksIndexes[i];
                    var tokens = tokenizer.tokenize(tracks[trackIndex].lyric.toLowerCase());
                    lyricsFound.tokens.push(tokens);
                    lyricsFound.stems.push(applyForEach(tokens, stemmerFunctions));
                    lyricsFound.score.push(ordered[ordered.length-1][trackIndex] + "/" + maxScore);
                    lyricsFound.trackName.push(tracks[trackIndex].track);
                    lyricsFound.lyric.push(tracks[trackIndex].lyric);
                };
            }

            var bestTracksIndexes = ordered[ordered.length-2];
            if (bestTracksIndexes) {
                bestTracksIndexes = Object.keys(bestTracksIndexes);
                for (var i = bestTracksIndexes.length - 1; i >= 0; i--) {
                    var trackIndex = bestTracksIndexes[i];
                    var tokens = tokenizer.tokenize(tracks[trackIndex].lyric.toLowerCase());
                    lyricsFound.tokens.push(tokens);
                    lyricsFound.stems.push(applyForEach(tokens, stemmerFunctions));
                    lyricsFound.score.push(ordered[ordered.length-2][trackIndex] + "/" + maxScore);
                    lyricsFound.trackName.push(tracks[trackIndex].track);
                    lyricsFound.lyric.push(tracks[trackIndex].lyric);
                };
            }

            // var matches = simpleCompareInLyric(lyricsFound, search);

            // for (var i = matches.length - 1; i >= 0; i--) {
            //     console.log(lyricsFound.score[i], lyricsFound.trackName[i])
            //     console.log(matches[i])
            // };

            return lyricsFound;
}

function simpleCompareInLyric (lyricsFound, search) {

	var searchTokens = search.tokens;
	var searchStems = search.stems;

	var wordsFound = []

    for (var i = 0; i < lyricsFound.stems.length; i++) {
    	var lyricStems = lyricsFound.stems[i];
    	var lyricTokens = lyricsFound.tokens[i];

    	wordsFound.push([]);
    	var wordsInLyrics = wordsFound[i];
    	var groupNumberOfFoundWords = 0;
    	var consecutive = false;
    	var followingWords = "";

    	for (var j = 0; j < searchStems.length; j++){
    		var searchStem = searchStems[j]
    		var searchToken = searchTokens[j]
    		
    		var initialK = 0;
    		var bestDistance = 0;

    		for (var k = initialK; k < lyricStems.length; k++) {
    			var lyricStem = lyricStems[k];

    			// console.log(consecutive, k, searchStem, lyricStem)
    			if (consecutive == false){
    				if (searchStem == lyricStem) {
    					bestDistance = 1.0;
    					followingWords = searchToken;
    					wordsInLyrics[groupNumberOfFoundWords] = [followingWords];

    					if (searchStems[j+1] && lyricStems[k+1]) {
    						if (searchStems[j+1] == lyricStems[k+1]) {
    							consecutive = true;
    							initialK = k+1;
    							break;
    						} else {
    							consecutive = false;
    							initialK = 0;
    						}
    					}
	    			} else {
	    				if (natural.LevenshteinDistance(searchStem, lyricStem, levenshteinCosts) < 3) {
	    					var jaroWinkler = natural.JaroWinklerDistance(searchStem, lyricStem);
	    					if (bestDistance < jaroWinkler) {
	    						bestDistance = jaroWinkler;

	    						followingWords = searchToken;
	    						wordsInLyrics[groupNumberOfFoundWords] = [followingWords];

	    						// console.log(searchStem, jaroWinkler, lyricStem)

	    						if (searchStems[j+1] && lyricStems[k+1]) {
									if (searchStems[j+1] == lyricStems[k+1]) {
										consecutive = true;
										initialK = k+1;
										break;
									} else {
										consecutive = false;
										initialK = 0;
									}
								} else {
									consecutive = false;
									initialK = 0;
								}
	    					}
	    				}
	    			}

	    			if (!lyricStems[k+1]) {
						// console.log("full search for:", searchStem);
						groupNumberOfFoundWords++;
					}
    			} else {
    				if (searchStem == lyricStem) {
    					followingWords += " " + searchToken;
    					bestDistance = 1.0;
    					wordsInLyrics[groupNumberOfFoundWords] = [followingWords];

    					if (searchStems[j+1] && lyricStems[k+1]) {
    						if (searchStems[j+1] == lyricStems[k+1]) {
    							consecutive = true;
    							initialK = k+1;
    						} else {
    							consecutive = false;
    							initialK = 0;
    							groupNumberOfFoundWords++;
    						}
    					}
    					break;
    				}
    			}
	    	}

	    	// console.log(groupNumberOfFoundWords, wordsInLyrics)
	    	// console.log("followingWords: " + followingWords);
	    	// wordsInLyrics[searchTokens[j]] = bestDistance
    	}
    };

    return wordsFound;
}

function getTrackIndex(trackName) {
	for (var i = tracks.length - 1; i >= 0; i--) {
		if (tracks[i].track == trackName)
			return i;
	};
}

function findTrack(trackName, orderedScore) {
	for (var i = 0; i < orderedScore.length; i++) {
		var tracksInAScore = orderedScore[i];
		for (trackIndex in tracksInAScore) {
			if (tracks[trackIndex].track == trackName) {
				console.log(tracks[trackIndex].track, tracksInAScore[trackIndex])
			}
		}
	}
}

function orderScore(scoreArray) {
    var orderedScoreArray = [];
    for (var i = 0; i < scoreArray.length; i++) {
    	if (scoreArray[i]){
    		if (!orderedScoreArray[scoreArray[i]]) {
	            orderedScoreArray[scoreArray[i]] = {};
	        }
	        orderedScoreArray[scoreArray[i]][i] = scoreArray[i];
    	}
    };
    var noEmpties = [];
    for (var i =  0; i < orderedScoreArray.length; i++) {
    	if(orderedScoreArray[i])
    		noEmpties.push(orderedScoreArray[i])
    };

    return noEmpties;
}

function scoringConsecutiveStems (searchStems) {
    var scoreArray = [];

    function scoreTracksWithCurrentStem(stem, scorePoints) {
    	var matchedTracks = stemsHash[stem].belongsTo; // get all tracks indexes that have that stem.
        if (matchedTracks){ // if that search string steam actually exists on at least one track.
            for (var j = 0; j < matchedTracks.length; j++) { // for all tracks indexes.
                if (scoreArray[matchedTracks[j]]) { // if that track index exists on 'scoreArray'.
                    scoreArray[matchedTracks[j]] += scorePoints; // increment that index in 'scoreArray'.
                } else { // if it doesn't.
                    scoreArray[matchedTracks[j]] = scorePoints;
                    // set that index' value to 1. if necessary, increase array size to fit it.
                }
            };
        }
    }

    function scoreTracksWithStemThatFollowsStem(stem, followingStem,  scorePoints) {
    	var nextStems = stemsHash[stem].comesBefore; // get all next stems.
        if (nextStems) { // if there's any next stem.
    		var trackIndexesWithNextStem = nextStems[followingStem]; // get all track indexes of the next stem.

    		// if there's any track index (there should always be at this point of the code).
    		if (trackIndexesWithNextStem) {
    			for (var j = 0; j < trackIndexesWithNextStem.length; j++) { // for each track index.
    				if (scoreArray[trackIndexesWithNextStem[j]]) {
    					scoreArray[trackIndexesWithNextStem[j]] += scorePoints;
    				} else {
    					scoreArray[trackIndexesWithNextStem[j]] = scorePoints;
    				}
    			}
    		}
        }
    }

    function scoreTracksWithCloseStems (stem, scorePoints) {
    	var closeStems = []
    	for (var i = stemsArray.length - 1; i >= 0; i--) {
    		var existingStem = stemsArray[i]
    		if (natural.LevenshteinDistance(stem, existingStem, levenshteinCosts) < 3) {
    			closeStems.push(existingStem);
    		}
    	}

    	var lancasterExistingStems = applyForEach(closeStems, [natural.LancasterStemmer.stem]);
		var lancasterStem = natural.LancasterStemmer.stem(stem);

		// console.log(closeStems)

		for (var i = lancasterExistingStems.length - 1; i >= 0; i--) {
			var lancasterExistingStem = lancasterExistingStems[i];

			var jaroWinkler = natural.JaroWinklerDistance(lancasterStem, lancasterExistingStem);
			if (jaroWinkler > 0.8) {
				scoreTracksWithCurrentStem(closeStems[i], scorePoints)
				// console.log(lancasterStem, dice, lancasterExistingStem)
				// strings in 'lancasterExistingStem' are the strings in 'closeStems' that have received the lancaster
				// algorithm. They are both in the same order.
			}
		}
    }

    function scoreTracksWithCloseStemThatFollowsStem(stem, followingStem, scorePoints) {
    	var closeStems = []
    	for (var i = stemsArray.length - 1; i >= 0; i--) {
    		var existingStem = stemsArray[i]
    		if (natural.LevenshteinDistance(followingStem, existingStem, levenshteinCosts) < 3) {
    			closeStems.push(existingStem);
    		}
    	}

    	var lancasterCloseStems = applyForEach(closeStems, [natural.LancasterStemmer.stem]);
		var lancasterfollowingStem = natural.LancasterStemmer.stem(followingStem);

		for (var i = lancasterCloseStems.length - 1; i >= 0; i--) {
			var lancasterCloseStem = lancasterCloseStems[i];

			var jaroWinkler = natural.JaroWinklerDistance(lancasterfollowingStem, lancasterCloseStem);
			if (jaroWinkler > 0.8) {
				scoreTracksWithStemThatFollowsStem(stem, closeStems[i], scorePoints)
				// strings in 'lancasterCloseStems' are the strings in 'closeStems' that have received the lancaster
				// algorithm. They are both in the same order.
			}
		}
    }


    for (var k = 0; k < searchStems.length; k++) { // for each stem on te search string.
    	var stem = searchStems[k];
    	var followingStem = searchStems[k+1]
    	if (stemsHash[stem]) { // if this stem exists in the hash of stems of all lyrics.
    		scoreTracksWithCurrentStem(stem, fullPoint);
    		// console.log(stem, fullPoint);
    		if (followingStem) { // if there's a next stem in the search.
        		if (stemsHash[followingStem]) { // if next stem exists in the hash of stems of all lyrics.
		        	scoreTracksWithStemThatFollowsStem(stem, followingStem, fullPoint);
		        	// console.log("followed by", followingStem, fullPoint);
	        	} else {
	        		scoreTracksWithCloseStemThatFollowsStem(stem, followingStem, halfPoint);
	        		// console.log(followingStem, halfPoint);
	        	}
	        }
        } else { // if this stem doesn't exist in the hash of stems of all lyrics
        	scoreTracksWithCloseStems(stem, halfPoint);
        	// console.log(stem, halfPoint);
        }
        
        // console.log(scoreArray[286]);
    }

    return scoreArray;
}

function tokenizeAndStem (deduplicate, text) {
    var tokens = tokenizer.tokenize(text);

    var stems = applyForEach(tokens, stemmerFunctions);
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
