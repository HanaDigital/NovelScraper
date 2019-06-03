import os
import subprocess
import sys
from tkinter import *
from tkinter import ttk
import threading
import requests
from bs4 import BeautifulSoup
import webbrowser
from functools import partial
import time

version = "0.7" #Defines the current version

#install packages
def install(package):
    subprocess.call([sys.executable, "-m", "pip", "install", package])

###################################################
#Tkinter for visualising the install of dependecies
window = Tk()
window.title("Hana Novel Scraper")
window.iconbitmap(r"rsc/icon.ico")
window.configure(background = "black")

Label(window, text="Checking for dependecies...", bg="black", fg="white", font="none 12").pack()
progress = ttk.Progressbar(orient="horizontal", length=200, mode="determinate")
progress.pack()
progress["value"] = 10
progress["maximum"] = 60

def callback():
    install('requests')
    progress["value"] += 10
    install('beautifulsoup4')
    progress["value"] += 10
    install('python-docx')
    progress["value"] += 10
    install('cfscrape')
    progress["value"] += 10
    install('ebooklib')
    progress["value"] += 10
    window.destroy()

t = threading.Thread(target=callback)
t.daemon = True
t.start()

window.mainloop()
###################################################

versionCheck = 0 #Boolean to check if we have already checked for a newer version or not.

# This function makes a pop up box if the current version is out of date.
def updateMsg():
    popup = Tk()
    popup.wm_title("Update")
    popup.iconbitmap(r"rsc/icon.ico")
    popup.configure(background = "black")
    label = Label(popup, text="New Update Available here: ", bg="black", fg="white", font="none 15")
    link = Label(popup, text="Github/WuxiaNovelDownloader", bg="black", fg="lightblue", font="none 12")
    B1 = Button(popup, text="Okay", command=popup.destroy)
    label.pack(padx=10)
    link.pack(padx=10)
    link.bind("<Button-1>", callback)
    link.bind("<Enter>", partial(color_config, link, "white"))
    link.bind("<Leave>", partial(color_config, link, "lightblue"))
    B1.pack()
    popup.call('wm', 'attributes', '.', '-topmost', '1')
    popup.mainloop()

def color_config(widget, color, event):
    widget.configure(foreground=color)

# Open the link to the novel on a browser
def callback(event):
    webbrowser.open_new(r"https://github.com/dr-nyt/WuxiaWorld-Novel-Downloader")

#Checks if this is the latest version
def versionControl():
    url = 'https://pastebin.com/7HUqzRGT'
    page = requests.get(url)
    soup = BeautifulSoup(page.text, 'lxml')
    checkVersion = soup.find(class_='de1')
    if version not in checkVersion:
        updateMsg()

def okButtonClick():
    if tkvar.get() == "NovelPlanet":
        def callback():
            os.system('python NovelPlanetScraper.py')    
        t = threading.Thread(target=callback)
        t.daemon = True
        t.start()
    elif tkvar.get() == "WuxiaWorld":
        def callback():
            os.system('python WuxiaScraper.py')
        t = threading.Thread(target=callback)
        t.daemon = True
        t.start()
    elif tkvar.get() == "m.Wuxiaworld.Co":
        def callback():
            os.system('python WuxiaCoScraper.py')
        t = threading.Thread(target=callback())
        t.daemon = True
        t.start()
        
############################################################################
#Tkinter
window = Tk()
window.title("Hana Novel Scraper")
window.iconbitmap(r"rsc/icon.ico")
window.configure(background = "black")

# Create a Tkinter variable
tkvar = StringVar(window)

# Dictionary with options
choices = {'NovelPlanet', 'WuxiaWorld.com', 'm.Wuxiaworld.Co'}
tkvar.set('NovelPlanet') # set the default option

# Drop down menu
dropMenu = OptionMenu(window, tkvar, *choices)
Label(window, text="Select Source: ", bg="black", fg="white", font="none 16").grid(row=0, column=0, sticky=W, padx=5, pady=10)
dropMenu.grid(row=0, column=1, sticky=W, padx=10, pady=10)

canv1 = Canvas(window, highlightthickness=0, relief='ridge')
canv1.configure(background="black")
canv1.grid(row=1, column=0, columnspan=2)

Button(canv1, text="OK", width=8, command=okButtonClick).pack(pady=5)

# link function to change dropdown
# tkvar.trace('w', change_dropdown)

if versionCheck == 0:
    versionControl()
    versionCheck = 1

window.mainloop()
################################################################################
