import os
import requests
from bs4 import BeautifulSoup
import cfscrape
from HanaDocument import HanaDocument
from tkinter import *
import threading

class NovelPlanetScraper(object):

    def __init__(self, link, chapterStart, chapterEnd, cover):
        self.link = link
        self.cover = cover

        #Initialize connection with NovelPlanet
        self.scraper = cfscrape.create_scraper()
        page = self.scraper.get(link)
        soup = BeautifulSoup(page.text, 'html.parser')

        #Get Novel Name
        self.novelName = soup.find(class_='title').get_text()

        #Get the html that stores links to each chapter
        chapters = soup.find_all(class_='rowChapter')

        #Get all the specified links from the html
        self.chapter_links = []
        for chapter in chapters:
            self.chapter_links.append(chapter.find('a').get('href'))
        self.chapter_links.reverse() #Reverse the list so the first index will be the first chapter and so on

        #Cut down the links if the number of chapters are specified and,
        #Set the starting and last chapter number
        if chapterStart != '':
            self.chapterNum_start = int(chapterStart)
            self.currentChapter = int(chapterStart)
            self.chapter_links = self.chapter_links[self.chapterNum_start - 1:]
        else:
            self.chapterNum_start = 1
            self.currentChapter = 1

        if chapterEnd != '':
            self.chapterNum_end = int(chapterEnd)
            self.chapter_links = self.chapter_links[:abs((int(chapterEnd) + 1) - self.chapterNum_start)]
        else:
            self.chapterNum_end = len(chapters)

        msg("Chapter " + str(self.chapterNum_start) + " to Chapter " + str(self.chapterNum_end) + " will be compiled!")

    def compileNovel(self):
        HD = HanaDocument()
        HD.sectionConfig(0.5)

        #Set the cover if defined by the user
        if self.cover != '':
            HD.addCover(self.cover)
            HD.addSection()

        #Loop through each link
        for chapter_link in self.chapter_links:
            HD.stylesConfig('Heading 1', 36)
            HD.stylesConfig('Normal', 32)

            page = self.scraper.get('https://novelplanet.com' + chapter_link)
            soup = BeautifulSoup(page.text, 'lxml')

            #Add a header for the chapter
            try:
                HD.addHead(soup.find('h4').get_text())
                print(soup.find('h4').get_text())
            except:
                HD.addHead("Chapter "  + str(self.currentChapter))
                print("HERE")

            #Get all the paragraphs from the chapter
            paras = soup.find(id="divReadContent").find_all('p')

            #Add each paragraph to the docx file
            for para in paras:
                HD.addPara(para.get_text())

            HD.addPara(" ")
            HD.addPara("Powered by dr_nyt")
            HD.addPara("If any errors occur, open an issue here: github.com/dr-nyt/Translated-Novel-Downloader/issues")
            HD.addPara("You can download more novels using the app here: github.com/dr-nyt/Translated-Novel-Downloader")
            HD.addSection()

            msg('Chapter: ' + str(self.currentChapter) + ' compiled!')
            self.currentChapter+=1

        HD.saveBook(self.novelName, self.chapterNum_start, self.chapterNum_end)
        msg('+'*20)
        msg(self.novelName + ' has compiled!') 
        msg('+'*20)
        HD = HanaDocument()


###############################
#tkINTER
def msg(text):
    output.config(state='normal')
    output.insert(END, text + '\n')
    output.see(END)
    output.config(state='disabled')

def compiler():
    link = eNovel.get()
    start = eChapterStart.get()
    end = eChapterEnd.get()

    #Checks for invalid input
    if start != '':
        try:
            int(start)
        except:
            msg('+'*20)
            msg('Error Occured!')
            msg('Invalid chapter start number')
            msg('+'*20)
            return
    if end != '':
        try:
            int(end)
        except:
            msg('+'*20)
            msg('Error Occured!')
            msg('Invalid chapter end number')
            msg('+'*20)
            return

    cover = eCover.get()
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
        try:
            Novel = NovelPlanetScraper(link, start, end, cover)
            msg('starting...')
            Novel.compileNovel()
            msg('+'*20)
            msg('ALL DONE!')
            msg('+'*20)
        except Exception as e:
            msg('+'*20)
            msg('Error Occured!')
            msg('+'*20)
            msg(str(e))
            msg("If you continue to have this error then open an issue here:")
            msg("github.com/dr-nyt/Translated-Novel-Downloader/issues")
            msg('+'*20)
            msg('')
    t = threading.Thread(target=callback)
    t.daemon = True
    t.start()

## Window Creator
window = Tk()
window.title("NovelPlanet Scraper")
window.configure(background = "black")

#Canvas 1
canv1 = Canvas(window, highlightthickness=0, relief='ridge')
canv1.configure(background = "black")
canv1.pack(fill=X)

Label(canv1, text="Novel Link: ", bg="black", fg="white", font="none 16").pack(padx=5, side=LEFT)
eNovel = Entry(canv1, width=75, bg="white")
eNovel.pack(padx=5, side=LEFT)
eNovel.bind('<Return>', lambda _: compiler())

#Canvas 2
canv2 = Canvas(window, highlightthickness=0, relief='ridge')
canv2.configure(background = "black")
canv2.pack(fill=X)

Label(canv2, text="Chapter Range [optional]: ", bg="black", fg="white", font="none 10").pack(padx=5, side=LEFT)

eChapterStart = Entry(canv2, width=5, bg="white")
eChapterStart.pack(padx=5, side=LEFT)
eChapterStart.bind('<Return>', lambda _: compiler())

eChapterEnd = Entry(canv2, width=5, bg="white")
eChapterEnd.pack(padx=5, side=LEFT)
eChapterEnd.bind('<Return>', lambda _: compiler())

#Canvas 3
canv3 = Canvas(window, highlightthickness=0, relief='ridge')
canv3.configure(background = "black")
canv3.pack(fill=X)

Label(canv3, text="Cover Page [optional]: ", bg="black", fg="white", font="none 10").pack(padx=5, side=LEFT)

eCover = Entry(canv3, width=20, bg="white")
eCover.pack(padx=5, side=LEFT)
eCover.bind('<Return>', lambda _: compiler())

#Canvas 4
canv4 = Canvas(window, highlightthickness=0, relief='ridge')
canv4.configure(background = "black")
canv4.pack(fill=X)

Button(canv4, text="Compile", width=8, command=compiler).pack(padx=150, side=LEFT)

#Text Boxes
output = Text(window, width=75, height=10, state='disabled', wrap=WORD, background="white")
output.pack(fill=X, side=LEFT)
msg('LOG:')

#Scroll Bars
scroll = Scrollbar(window, width=10, command=output.yview)
output.config(yscrollcommand=scroll.set)
scroll.pack(side=LEFT)

window.mainloop()
