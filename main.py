from flask import Flask, render_template, send_from_directory, request
import json
import os
import random
from apscheduler.schedulers.background import BackgroundScheduler

class WordManager:
    def __init__(self):
        self.words = json.load(open('words.json'))
        self.current_word = None
        self.changeWord()

    def start_scheduler(self):
        print("Scheduler started!")
        self.scheduler = BackgroundScheduler(timezone="Europe/Berlin")
        self.scheduler.add_job(self.changeWord, 'interval', hours=12)
        self.scheduler.start()

    def changeWord(self):
        self.current_word = random.choice(self.words)
        print(f"Current word is - {self.current_word}!")

    def timeLeft(self):
        return self.scheduler.get_jobs()[0].next_run_time.timestamp()

app = Flask(__name__)
wrd = WordManager()
wrd.start_scheduler()
print("wrd scheduler called outside main!")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/check', methods=['POST'])
def check():
    word = request.form['word']
    if word == wrd.current_word:
        return 'OK'
    if word not in wrd.words:
        return 'NEMA'

    snd = ""
    for i, letter in enumerate(word):
        if letter == wrd.current_word[i]:
            snd += "!" # correct letter
        else:
            if letter in wrd.current_word:
                snd += "?" # wrong position
            else:
                snd += "-" # wrong letter
    return snd

@app.route('/time', methods=['POST'])
def time():
    return str(wrd.timeLeft())

@app.route('/favicon.ico') 
def favicon(): 
    return "none"

if __name__ == '__main__':
    print("wrd scheduler in main called!")
    wrd.start_scheduler()
    app.run(host='0.0.0.0')