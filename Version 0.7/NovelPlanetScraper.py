import os
import shutil
import requests
from bs4 import BeautifulSoup
import cfscrape
from tkinter import *
import threading
from ebooklib import epub

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
        book = epub.EpubBook()
        # add metadata
        book.set_identifier('dr_nyt')
        book.set_title(self.novelName)
        book.set_language('en')
        book.add_author('Unknown')

        #Set the cover if defined by the user
        if self.cover != '':
            book.set_cover("image.jpg", open(self.cover, 'rb').read())

        chapters = [] #Stores each chapter of the story as an object. Later used to reference the chapters to the table of content

        #Loop through each link
        for chapter_link in self.chapter_links:

            page = self.scraper.get('https://novelplanet.com' + chapter_link)
            soup = BeautifulSoup(page.text, 'lxml')

            #Add a header for the chapter
            try:
                chapterHead = soup.find('h4').get_text()
                c = epub.EpubHtml(title=chapterHead, file_name='Chapter_' + str(self.currentChapter) + '.xhtml', lang='en')
                content = '<h2>' + chapterHead + '</h2>'
            except:
                c = epub.EpubHtml(title="Chapter "  + str(self.currentChapter), file_name='Chapter_' + str(self.currentChapter) + '.xhtml', lang='en')
                content = "<h2> Chapter "  + str(self.currentChapter) + "</h2>"

            #Get all the paragraphs from the chapter
            paras = soup.find(id="divReadContent")

            #Append all paragraph to content which will be added to the .xhtml
            content += paras.prettify()

            content += "<p> </p>"
            content += "<p>Powered by dr_nyt</p>"
            content += "<p>If any errors occur, open an issue here: github.com/dr-nyt/Translated-Novel-Downloader/issues</p>"
            content += "<p>You can download more novels using the app here: github.com/dr-nyt/Translated-Novel-Downloader</p>"

            c.content = u'%s' % content #Add the content to the chapter
            chapters.append(c) #Add the chapter object to the chapter list

            msg('Chapter: ' + str(self.currentChapter) + ' compiled!')
            self.currentChapter+=1

        #Add each chapter object to the book
        for chap in chapters:
            book.add_item(chap)

        #Give the table of content the list of chapter objects
        book.toc = (chapters)

        # add navigation files
        book.add_item(epub.EpubNcx())
        book.add_item(epub.EpubNav())

        # define css style
        style = '''
    @namespace epub "http://www.idpf.org/2007/ops";
    body {
        font-family: Cambria, Liberation Serif, Bitstream Vera Serif, Georgia, Times, Times New Roman, serif;
    }
    h2 {
         text-align: left;
         text-transform: uppercase;
         font-weight: 200;     
    }
    ol {
            list-style-type: none;
    }
    ol > li:first-child {
            margin-top: 0.3em;
    }
    nav[epub|type~='toc'] > ol > li > ol  {
        list-style-type:square;
    }
    nav[epub|type~='toc'] > ol > li > ol > li {
            margin-top: 0.3em;
    }
    '''

        # add css file
        nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css", content=style)
        book.add_item(nav_css)

        # create spin, add cover page as first page
        book.spine = ['cover', 'nav'] + chapters

        # create epub file
        epub.write_epub(self.novelName + ' ' + str(self.chapterNum_start) + '-' + str(self.chapterNum_end) + '.epub', book, {})

        if not os.path.exists(self.novelName):
            os.mkdir(self.novelName)

        shutil.move(self.novelName + ' ' + str(self.chapterNum_start) + '-' + str(self.chapterNum_end) + '.epub', self.novelName + '/' + self.novelName + ' ' + str(self.chapterNum_start) + '-' + str(self.chapterNum_end) + '.epub')

        msg('+'*20)
        msg(self.novelName + ' has compiled!') 
        msg('+'*20)


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
        msg('The default cover will be added')
        cover = 'rsc/Novel Cover.png'
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
            msg('Connecting to NovelPlanet...')
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