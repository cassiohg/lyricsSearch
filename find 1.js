var fs = require('fs');
var path = require('path');
var tracklist = require('tracklist');

var natural = require('natural'),
    tokenizer = new natural.WordTokenizer()
    metaphone = natural.Metaphone
    dm = natural.DoubleMetaphone;

var clj_fuzzy = require('clj-fuzzy');

var snowball = require('node-snowball');

// console.log(natural.LevenshteinDistance("feel", "fellings"))
// console.log(natural.LevenshteinDistance("fellings", "feel"))

// var levenshteinCosts = {insertion_cost: 1, deletion_cost: 2, substitution_cost: 2}
// console.log(natural.LevenshteinDistance("to", "do", levenshteinCosts));

// var tokens = tokenizer.tokenize("when we control the sun light breathe me in");
// for (var i = 0; i < tokens.length; i++) {
//     console.log(natural.PorterStemmer.stem(tokens[i]), " - ", snowball.stemword(tokens[i]));
// }

var str = "gliding";
console.log(natural.PorterStemmer.stem(str))
console.log(snowball.stemword(str))

var tokens = tokenizer.tokenize("I'm gliding in the beautiful sky")
console.log(tokens);
console.log(applyForEach(tokens, [natural.PorterStemmer.stem, snowball.stemword]))

console.log("Your" == "your");

fs.readFile("lyrics.json", function (err, data2) {
    var tracks = JSON.parse(data2);

    // console.log(tokenizeAndStem(tracks[248].lyric.toLowerCase()))

})

function tokenizeAndStem (deduplicate, text) {
    var tokens = tokenizer.tokenize(text);

    // var stems = applyForEach(tokens, [natural.PorterStemmer.stem, snowball.stemword]);
    var stems = applyForEach(tokens, [natural.PorterStemmer.stem]);
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