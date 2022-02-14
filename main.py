from flask import Flask, render_template, url_for
from flask import request, redirect, send_from_directory
import os
import json
import hashlib
import random
import datetime
from apscheduler.schedulers.background import BackgroundScheduler

class WordManager:
    def __init__(self):
        self.words = json.load(open('words.json'))
        self.current_word = None
        self.changeWord()

    def start_scheduler(self):
        print("Scheduler started!")
        self.scheduler = BackgroundScheduler(timezone="Europe/Berlin")
        self.scheduler.add_job(
            self.changeWord, 
            'interval', 
            hours=6,
            start_date=datetime.datetime.now().replace(minute=0))
        self.scheduler.start()

    def changeWord(self):
        self.current_word = random.choice(self.words)
        print(f"Current word is - {self.current_word}!")

    def changeSpecificWord(self, word):
        self.current_word = word

    def timeLeft(self):
        return self.scheduler.get_jobs()[0].next_run_time.timestamp()

app = Flask(__name__)
wrd = WordManager()
if not app.debug:
    wrd.start_scheduler()

if app.debug and os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    wrd.start_scheduler()
    print("wrd scheduler called outside main!")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/change', methods=['POST', 'GET'])
def change():
    if request.method == 'POST':
        new_word = request.form['word']
        passw = request.form['password']
        
        # check if password is correct
        hash_object = hashlib.sha256(passw.encode())
        hex_dig = hash_object.hexdigest()
        true_dig = "d5f8e8ce95a223ed099dac2b00ffe65ac61bd7127cfb823fa4f5a2d97a404107"
        if hex_dig == true_dig:
            if new_word in wrd.words:
                wrd.changeSpecificWord(new_word)
                return redirect(url_for('index'))
            else:
                return render_template('change.html', error="Word not found!")
        else:
            return render_template('change.html', error="Wrong password!")
    else:
        return render_template('change.html')

@app.route('/check', methods=['POST'])
def check():
    word = request.form['word']
    if word == wrd.current_word:
        return 'OK'
    if word not in wrd.words:
        return 'NEMA'
    #for every check we do it again
    #because it's a new attempt at guessing
    letter_count = {}
    #for each letter
    for letter in wrd.current_word:
        #try to up its count
        try: letter_count[letter]+=1
        #if there's no count, start at 1
        except: letter_count[letter]=1
    #make a copy of the letter count for the green counting
    #difference is, here we only count when we find a green
    green_count = dict(letter_count)

    snd = []
    for i, letter in enumerate(word):
        if letter == wrd.current_word[i]:
            snd.append("!") # correct letter
            #down the count of that letter
            green_count[letter] -= 1

            #if there's still some of this letter to be found
            if letter_count[letter]:
                #one found, mark it off
                letter_count[letter]-=1

        elif letter in wrd.current_word:
            snd.append("?") # wrong position

            #if there's still some of this letter to be found
            if letter_count[letter]:
                #one found, mark it off
                letter_count[letter]-=1
            #if there's zero remaining
            else:
                #change the false yellow to a grey
                snd[i]="-"
        else:
            snd.append("-") # wrong letter
        
    #make a copy of snd to work on while looping through snd
    snd_copy = list(snd)
    #for each mark in snd
    for s in snd:
        #if that letter in our guess is in the correct word
        if word[snd.index(s)] in green_count:
            #and we guessed all there is of that mark's letter
            if green_count[word[snd.index(s)]] == 0:
                #if the mark is a yellow
                if s == "?":
                    #set it to grey
                    snd_copy[snd.index(s)] = "-"
                #i used nested ifs to limit width of code
                #and increase readability

    return "".join(snd_copy)

@app.route('/time', methods=['POST'])
def time():
    return str(wrd.timeLeft())

@app.route('/hash', methods=['POST'])
def hashWord():
    return str(hash(wrd.current_word))

@app.route('/favicon.ico') 
def favicon(): 
    return send_from_directory(url_for("static", filename="favicon.ico"), "favicon.ico")

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
