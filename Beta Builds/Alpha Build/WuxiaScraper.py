import os
import shutil
import requests
from bs4 import BeautifulSoup
from tkinter import *
import threading
import webbrowser
from functools import partial
from EpubEngine import EpubEngine

class WuxiaScraper(object):

    def __init__(self, link, cover, volume=0):
        self.link = link
        self.cover = cover
        self.volume = volume

        #Get the name of the novel from the website or the link
        self.novelName = ''
        page = requests.get(self.link)
        soup = BeautifulSoup(page.text, 'lxml')
        page = soup.find(class_='p-15')
        try:
            self.novelName = story_view.find('h4').get_text()
        except:
            tempName = self.link.split('/')[4]
            tempName = tempName.split('-')
            for name in tempName:
                self.novelName = self.novelName + name.capitalize() + ' '   
            self.novelName = self.novelName[:-1]

        if(self.volume != 0):
            self.volume_limit = 1
            self.volumeNum = int(self.volume)
        else:
            self.volume_limit = 0
            self.volumeNum = 0

        #To stop compiling
        self._break = 0

    def start(self):
        self.getChapterLinks()

    def getChapterLinks(self):
        page = requests.get(self.link)
        soup = BeautifulSoup(page.text, 'html.parser')
        volume_list = soup.find_all(class_="panel-body")

        if volume_list == []:
            msg('Either the link is invalid or your IP is timed out.')
            msg('In case of an IP timeout, it usually fixes itself after some time.')
            msg('If this issue persists, open an issue here:')
            msg('github.com/dr-nyt/WuxiaWorld-Novel-Downloader/issues')

        #Loop through each volume
        for v in volume_list:
            self.chapter_links = []

            if self._break == 1:
                break

            #Find the section on the page where all the chapter links are
            if v.find(class_="col-sm-6") == None:
                continue

            #Skip over volumes if a specific volume is defined
            if self.volumeNum != 1 and self.volume_limit == 1:
                self.volumeNum-=1
                continue

            #Get all the chapter links for this volume
            chapter_html_links = v.find_all(class_="chapter-item")
            for chapter_http in chapter_html_links:
                self.chapter_links.append(chapter_http.find('a').get('href'))

            #Store all the chapter links

            #Get the numbers of the first and last chapter from this function
            self.getMetaData(self.chapter_links[0], self.chapter_links[-1])

            self.makeVolume()


    def getMetaData(self, link_start, link_end):
        metaData = []
        index = -1
        
        #Get the chapter number of the first chapter in the volume
        partsX = link_start.split('/')
        for x in partsX:
            if x != '' and x != 'novel':
                metaData.append(x)
        chapter_start = metaData[1].split('-')
        while index >= -len(chapter_start):
            if chapter_start[index].isdigit():
                self.chapterNum_start = int(chapter_start[index])
                index = -1
                break
            else:
                index = index - 1

        #Set the current starting chapter
        self.chapterCurrent = self.chapterNum_start
        
        metaData = []

        #Get the chapter number of the last chapter in the volume
        partsY = link_end.split('/')
        for y in partsY:
            if y != '' and y != 'novel':
                metaData.append(y)
        chapter_end = metaData[1].split('-')
        while index >= -len(chapter_end):
            if chapter_end[index].isdigit():
                self.chapterNum_end = int(chapter_end[index])
                index = -1
                break
            else:
                index = index - 1


    def makeVolume(self, author="Unknown"):
        book = EpubEngine(author, self.novelName)

        if self.cover != '':
            book.addCover(self.cover)

        head = 0
        for link in self.chapter_links:
            page = requests.get('https://www.wuxiaworld.com' + link)
            soup = BeautifulSoup(page.text, 'lxml')
            story_view = soup.find(class_='p-15')
            if head == 0:
                try:
                    chapterHead = story_view.find('h4').get_text()
                    chapter = soup.find(class_='fr-view')
                    book.addChapter(chapterHead, 'Chapter_' + str(self.chapterCurrent), chapter)
                    print(chapter)
                    break
                except:
                    chapter = soup.find(class_='fr-view')
                    book.addChapter('Chapter ' + str(self.chapterCurrent), 'Chapter_' + str(self.chapterCurrent), chapter)

            head = 1
            msg('Chapter: ' + str(self.chapterCurrent) + ' compiled!')
            self.chapterCurrent+=1

        book.addTOC()
        book.style()
        
        self.volume_links = []
        volumeName = self.novelName + ' Vol.' + str(self.volume) + ' ' + str(self.chapterNum_start) + '-' + str(self.chapterNum_end)

        #If only one volume is to be compiled
        if(self.volume_limit == 1):
            book.writeBook(volumeName)
            shutil.move(volumeName + '.epub', self.novelName + '/' + volumeName + '.epub')
            msg('+'*20)
            msg('Volume: ' + str(self.volume) + ' compiled!') 
            msg('+'*20)
            self._break = 1
        else:
            #Increment the volume number and continue
            self.volume+=1
            book.writeBook(volumeName)
            shutil.move(volumeName + '.epub', self.novelName + '/' + volumeName + '.epub')
            msg('+'*20)
            msg('Volume: ' + str(self.volume) + ' compiled!') 
            msg('+'*20)

###############################
#TKINTER
#BEYOND THIS POINT IS CHAOS AND DESTRUCTION, DONT EVEN BOTHER...
versionCheck = 0

def updateMsg():
    popup = Tk()
    popup.wm_title("Update")
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

def callback(event):
    webbrowser.open_new(r"https://github.com/dr-nyt/WuxiaWorld-Novel-Downloader")

def versionControl():
    version = "0.5"
    url = 'https://pastebin.com/7HUqzRGT'
    page = requests.get(url)
    soup = BeautifulSoup(page.text, 'lxml')
    checkVersion = soup.find(class_='de1')
    if version not in checkVersion:
        updateMsg()
        

def msg(text):
    output.config(state='normal')
    output.insert(END, text + '\n')
    output.see(END)
    output.config(state='disabled')

def compiler():
    link = eNovel.get()
    volume = eVolume.get()
    cover = eCover.get()
    
    if volume == '':
        volume = 0
        msg('All Volumes will be compiled.')
    else:
        msg('Only Volume: ' + volume + ' will be compiled.')

    if cover == '':
        msg('No cover will be added')
    else:
        exists = os.path.isfile('rsc/' + cover)
        if exists:
            msg('The cover ' + cover + ' will be added from the rsc folder.')
            cover = 'rsc/' + cover
        else:
            msg('+'*20)
            msg('Error Occured!')
            msg('No cover found with the name ' + cover + ' in the rsc folder.')
            msg('Make sure the cover is inside the rsc folder and the name is correct.')
            msg('+'*20)
            return       

    def callback():
        #try:
            Novel = WuxiaScraper(link, cover, volume)
            msg('starting...')
            Novel.start()
            msg('+'*20)
            msg('ALL DONE!')
            msg('+'*20)
        #except Exception as e:
            msg('+'*20)
            msg('Error Occured!')
            msg('+'*20)
            msg(str(e))
            msg("If you continue to have this error then open an issue here:")
            msg("github.com/dr-nyt/WuxiaWorld-Novel-Downloader/issues")
            msg('+'*20)
            msg('')
    t = threading.Thread(target=callback)
    t.daemon = True
    t.start()

## Window Creator
window = Tk()
window.title("Hana Novel Scraper")
window.configure(background = "black")

#Labels
Label(window, text="Novel Link: ", bg="black", fg="white", font="none 16").grid(row=0, column=0, sticky=W)

Label(window, text="Volume Num [optional]: ", bg="black", fg="white", font="none 10").grid(row=1, column=0, sticky=W)

Label(window, text="Cover Page [optional]: ", bg="black", fg="white", font="none 10").grid(row=2, column=0, sticky=W)

#Entries
eNovel = Entry(window, width=75, bg="white")
eNovel.grid(row=0, column=1, sticky=W)
eNovel.bind('<Return>', lambda _: compiler())

eVolume = Entry(window, width=5, bg="white")
eVolume.grid(row=1, column=1, sticky=W)
eVolume.bind('<Return>', lambda _: compiler())

eCover = Entry(window, width=20, bg="white")
eCover.grid(row=2, column=1, sticky=W)
eCover.bind('<Return>', lambda _: compiler())

#Buttons
Button(window, text="Compile", width=8, command=compiler).grid(row=3, column=1, sticky=W)

#Text Boxes
output = Text(window, width=75, height=10, state='disabled', wrap=WORD, background="white")
output.grid(row=4, column=0, padx=5, columnspan=2, sticky=W)
msg('LOG:')

#Scroll Bars
scroll = Scrollbar(window, width=10, command=output.yview)
output.config(yscrollcommand=scroll.set)
scroll.grid(row=4, column=1, sticky=E)

if versionCheck == 0:
    versionControl()
    versionCheck = 1

window.mainloop()