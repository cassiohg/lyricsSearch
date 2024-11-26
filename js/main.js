var fs = require('fs');
var path = require('path');

var sL = require('./scoreLyrics.js');

$(document).ready(function () {

$('#search').keydown(function (e) {
	
	if (e.keyCode == 13 && !e.shiftKey)
    {
    	$('#tracks tr').remove();
    	$('#lyrics tr').val('');

    	e.preventDefault();
        var text = $('#search').val();
        var lyricsFound = sL.search(text);
        for (var i = 0; i < lyricsFound.lyric.length; i++) {
        	var lyric = lyricsFound.lyric[i]
        	var trackName = lyricsFound.trackName[i];
        	var score = lyricsFound.score[i]

        	var track = $('#templateTrack').clone().data('lyric', lyric);
        	track.children('.trackName').text(trackName);
        	track.children('.score').text(score);
        	track.appendTo('#tracks');
        	track.show();

        	$('tr.track').click(function () {
        		$('.selected').removeClass('selected')
        		$(this).addClass('selected')
                var words = text.split(' ')
                var lyric = $(this).data('lyric')
                for (var i = 0; i < words.length; i++) {
                    if (words[i].length > 1)
                    lyric = lyric.replace(new RegExp(words[i], 'g'), '>'+words[i]+'<')
                }
				$('#lyrics').val(lyric);
			})
        };
    }
});


})
