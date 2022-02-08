function generateKeyboard() {
    order = [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace']
    ]
    var keyboard = document.getElementById('keyboard');
    var row;
    var button;
    for (var i = 0; i < order.length; i++) {
        row = document.createElement('div');
        row.className = 'keyrow';
        for (var j = 0; j < order[i].length; j++) {
            button = document.createElement('button');
            button.innerHTML = order[i][j];
            button.className = 'tipka';
            row.appendChild(button);
            button.onclick = function() {
                doLetter(this.innerHTML);
            }
        }
        keyboard.appendChild(row);
    }
    window.addEventListener("keydown", function (e) {
        let key = e.key.toLowerCase();
        if (key == "backspace" || key == "enter" || key.length==1) {
            doLetter(key);
        }
    });
}

var word = "";
var selected_block = 1;
var selected_row = 1;
var showing_stats = false;

if (localStorage.getItem("won") == null) {
    localStorage.setItem("won", 0);
    localStorage.setItem("lost", 0);
}
var won = parseInt(localStorage.getItem("won"));
var lost = parseInt(localStorage.getItem("lost"));

var is_processing = false;

function doLetter(letter) {
    if (selected_row > 6) {
        return;
    }
    var blocks = $(".canvas :nth-child("+selected_row+")")
    if (letter == "enter") {
        if (word.length == 5) {
            if (!is_processing) {
                is_processing = true;
                blocks.find("img").css("visibility", "visible");
                $.post("/check", {
                    word: word
                }, function(data) {
                    var next_row = true;
                    if (data == "OK") {
                        blocks.find("div").addClass("correct")
                        localStorage.setItem(selected_row, word+";"+"!!!!!");
                        localStorage.setItem("won", parseInt(won)+1);
                        won += 1;
                        showStats();
                    } else if (data == "NEMA") {
                        next_row = false;
                        badWordAnimation(blocks);
                    } else {
                        localStorage.setItem(selected_row, word+";"+data);
                        putWord(blocks, word, data);
                    }
                    is_processing = false;
                    blocks.find("img").css("visibility", "hidden");
                    if (next_row) {
                        selected_row++;
                        selected_block = 1;
                        word = "";
                        if (selected_row == 7) {
                            localStorage.setItem("lost", parseInt(lost)+1);
                            lost += 1;
                            showStats();
                        }
                    }
                });
            } else {
                badWordAnimation(blocks);
            }
        } else {
            badWordAnimation(blocks);
        }
    } else if (letter == "backspace") {
        if (is_processing) {
            badWordAnimation(blocks);
        } else {
            if (selected_block > 1) {
                selected_block--;
                var block = blocks.children(":nth-child("+selected_block+")")
                block.html("")
                word = word.substring(0, word.length - 1);
            }
        }
    } else {
        if (selected_block <= 5) {
            var block = blocks.children(":nth-child("+selected_block+")")
            block.html(letter)
            word += letter;
        }
        selected_block++;
        if (selected_block > 6) {
            selected_block = 6;
        }
    }
}


function putWord(blocks, word, data) {
    for (var i = 0; i < data.length; i++) {
        blocks.children(":nth-child("+(i+1)+")").html(word[i]);
        if (data[i] == "!") {
            blocks.find(":nth-child("+(i+1)+")").addClass("correct");
        } else if (data[i] == "?") {
            blocks.find(":nth-child("+(i+1)+")").addClass("place");
        } else {
            blocks.find(":nth-child("+(i+1)+")").addClass("wrong");
            var tipke = $(".tipka").filter(":contains('"+word[i]+"')")
            tipke.each(function() {
                if ($(this).html().length == 1) {
                    $(this).addClass("wrong-tipka");
                }
            });
        }
    }
}

function badWordAnimation(blocks) {
    blocks.filter(".row").removeClass("row-animation")
    blocks.filter(".row").outerWidth();
    blocks.filter(".row").addClass("row-animation")
}

function timeChanger() {
    function timeProcess() {
        var now = new Date().getTime()/1000;
        var diff = nexttime - now;

        if (diff < 0) {
            clearGame();
            clearInterval(timeInterval);
            $.post("/time", function(data) {
                nexttime = parseInt(data);
                timeChanger();
            });
        }

        var final = new Date(diff*1000);
        var hours = final.getUTCHours();
        var minutes = final.getUTCMinutes();
        var seconds = final.getUTCSeconds();

        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        var txt = "Sleceda rec za " + hours + "h " + minutes + "m " + seconds + "s";
        $(".done-block h2").first().html(txt);
        $(".next-word p").html(txt);
    }
    timeProcess();
    var timeInterval = setInterval(timeProcess, 1000);
}

var nexttime = null;
function loadCache() {
    $.post("/hash", function(data) {
        if (localStorage.getItem("hash") != data) {
            clearGame();
            localStorage.setItem("hash", data);
            $.post("/time", function(data) {
                nexttime = parseInt(data);
                localStorage.setItem("time", data);
                timeChanger();
            });
        } else {
            nexttime = parseInt(localStorage.getItem("time"));
            timeChanger();
        }
    });

    //place words
    for (var i = 1; i <= 6; i++) {
        var cache = localStorage.getItem(i);
        if (cache != null) {
            var cache_parts = cache.split(";");
            var word = cache_parts[0];
            var data = cache_parts[1];
            var blocks = $(".canvas :nth-child("+i+")")
            putWord(blocks, word, data);
            if (data == "!!!!!") {
                showStats();
                break;
            }
            if (i == 6) {
                selected_row = 7;
                showStats();
                break;
            }
        } else {
            selected_row = i;
            break;
        }
    }
}

function showStats() {
    if (!showing_stats) {
        $("#won h2").html(won);
        $("#lost h2").html(lost);
        $(".done").css("display", "flex");
        $(".done h2").first().html($(".next-word").html());
    }
}

function hideStats() {
    showing_stats = false;
    $(".done").css("display", "none");
}

function clearGame() {
    hideStats();
    for (var i = 1; i < 7; i++) {
        localStorage.removeItem(i);
    }
    word = "";
    selected_block = 1;
    selected_row = 1;
    $(".canvas").find(".block").html("");
    $(".canvas").find(".block").removeClass("wrong");
    $(".canvas").find(".block").removeClass("correct");
    $(".canvas").find(".block").removeClass("place");
    $("#keyboard").find(".tipka").removeClass("wrong-tipka");
}

//starting point
$(document).ready(function() {
    generateKeyboard();
    loadCache();
});