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
            button.id = "kkk-" + order[i][j];
            button.setAttribute("tabindex", "-1");
            row.appendChild(button);
            button.onclick = function() {
                doLetter(this.innerHTML);
                this.blur();
            }
        }
        keyboard.appendChild(row);
    }
    window.addEventListener("keydown", function (e) {
        let key = e.key.toLowerCase().replace(/ /g,'');
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

var wrong_words = [];

function doLetter(letter) {
    if (selected_row > 6) {
        return;
    }
    var blocks = $(".canvas :nth-child("+selected_row+")")
    if (letter == "enter") {
        if (word.length == 5) {
            if (!is_processing && !wrong_words.includes(word)) {
                is_processing = true;
                blocks.find("img").css("visibility", "visible");
                $.post("/check", {
                    word: word
                }, function(data) {
                    var next_row = true;
                    if (data == "OK") {
                        blocks.find("img").css("visibility", "hidden");
                        var tl = anime.timeline({
                            easing: 'easeOutExpo',
                            duration: 500,
                            complete: function() {
                                localStorage.setItem(selected_row, word+";"+"!!!!!");
                                localStorage.setItem("won", parseInt(won)+1);
                                won += 1;
                                showStats();
                            }
                        });
                        for (var i = 0; i < word.length; i++) {
                            tl.add({
                                targets: blocks.find(":nth-child("+(i+1)+")")[0],
                                backgroundColor: "#00ff00",
                                borderRadius: "5px",
                                borderColor: "#00ff00"
                            });
                        }
                        return
                    } else if (data == "NEMA") {
                        next_row = false;
                        wrong_words.push(word);
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
                            anime({
                                targets: '.block',
                                translateX: anime.stagger(25, {grid: [5, 6], from: 'center', axis: 'x'}),
                                translateY: 1000,
                                rotateZ: anime.stagger([0, 45], {grid: [5, 6], from: 'center', axis: 'x'}),
                                delay: anime.stagger(150, {grid: [5, 6], start: 250, from: "last"}),
                                easing: 'easeInOutQuad',
                                complete: function() {
                                    showStats();
                                }
                            });
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
                anime({
                    targets: [block[0], "#kkk-"+letter],
                    scale: [1, 0.9],
                    direction: 'alternate',
                    duration: 50,
                    easing: 'linear'
                });
            }
        }
    } else {
        if (selected_block <= 5) {
            var block = blocks.children(":nth-child("+selected_block+")")
            block.html(letter)
            word += letter;
            anime({
                targets: [block[0], "#kkk-"+letter],
                scale: [1, 1.2],
                direction: 'alternate',
                duration: 50,
                easing: 'linear'
            });
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
            $("#kkk-"+word[i]).addClass("wrong-tipka")
        }
    }
}

function badWordAnimation(blocks) {
    var therow = blocks.filter(".row")
    anime({
        targets: therow[0],
        keyframes: [
            {translateX: [0,-10]},
            {translateX: 10}
        ],
        duration: 150,
        easing: 'linear',
        direction: "alternate"
    })
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
    loadWordsFromCache();
}

function loadWordsFromCache() {
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

    //title animation
    var textWrapper = document.querySelector('header h1');
    textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");

    anime({
        targets: '.letter',
        translateY: [-100,0],
        easing: "easeOutElastic",
        duration: 1500,
        delay: anime.stagger(250, {start: 300})
    })
});