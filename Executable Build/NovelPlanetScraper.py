import os
import shutil
import requests
from bs4 import BeautifulSoup
import cfscrape
from tkinter import *
import threading
from ebooklib import epub

class NovelPlanetScraper(object):

    #The __init__ function only manages the GUI
    #The actual novel code starts in the getNovel() function
    def __init__(self, window):
        self.window = window
        self.window.title("NovelPlanet Scraper")
        self.window.configure(background = "black")

        #Canvas 1
        self.canv1 = Canvas(self.window, highlightthickness=0, relief='ridge')
        self.canv1.configure(background = "black")
        self.canv1.pack(fill=X)

        Label(self.canv1, text="Novel Link: ", bg="black", fg="white", font="none 16").pack(padx=5, side=LEFT)
        self.eNovel = Entry(self.canv1, width=75, bg="white")
        self.eNovel.pack(padx=5, side=LEFT)
        self.eNovel.bind('<Return>', lambda _: self.compiler())

        #Canvas 2
        self.canv2 = Canvas(self.window, highlightthickness=0, relief='ridge')
        self.canv2.configure(background = "black")
        self.canv2.pack(fill=X)

        Label(self.canv2, text="Chapter Range [optional]: ", bg="black", fg="white", font="none 10").pack(padx=5, side=LEFT)

        self.eChapterStart = Entry(self.canv2, width=5, bg="white")
        self.eChapterStart.pack(padx=5, side=LEFT)
        self.eChapterStart.bind('<Return>', lambda _: self.compiler())

        self.eChapterEnd = Entry(self.canv2, width=5, bg="white")
        self.eChapterEnd.pack(padx=5, side=LEFT)
        self.eChapterEnd.bind('<Return>', lambda _: self.compiler())

        #Canvas 3
        self.canv3 = Canvas(self.window, highlightthickness=0, relief='ridge')
        self.canv3.configure(background = "black")
        self.canv3.pack(fill=X)

        Label(self.canv3, text="Cover Page [optional]: ", bg="black", fg="white", font="none 10").pack(padx=5, side=LEFT)

        self.eCover = Entry(self.canv3, width=20, bg="white")
        self.eCover.pack(padx=5, side=LEFT)
        self.eCover.bind('<Return>', lambda _: self.compiler())

        #Canvas 4
        self.canv4 = Canvas(self.window, highlightthickness=0, relief='ridge')
        self.canv4.configure(background = "black")
        self.canv4.pack(fill=X)

        Button(self.canv4, text="Compile", width=8, command=self.compiler).pack(padx=150, side=LEFT)

        #Text Boxes
        self.output = Text(self.window, width=75, height=10, state='disabled', wrap=WORD, background="white")
        self.output.pack(fill=X, side=LEFT)
        self.msg('LOG:')

        #Scroll Bars
        self.scroll = Scrollbar(self.window, width=10, command=self.output.yview)
        self.output.config(yscrollcommand=self.scroll.set)
        self.scroll.pack(side=LEFT)

    def msg(self, text):
        self.output.config(state='normal')
        self.output.insert(END, text + '\n')
        self.output.see(END)
        self.output.config(state='disabled')

    def compiler(self):
        link = self.eNovel.get()
        start = self.eChapterStart.get()
        end = self.eChapterEnd.get()

        #Checks for invalid input
        if start != '':
            try:
                int(start)
            except:
                self.msg('+'*20)
                self.msg('Error Occured!')
                self.msg('Invalid chapter start number')
                self.msg('+'*20)
                return
        if end != '':
            try:
                int(end)
            except:
                self.msg('+'*20)
                self.msg('Error Occured!')
                self.msg('Invalid chapter end number')
                self.msg('+'*20)
                return

        cover = self.eCover.get()
        if cover == '':
            self.msg('The default cover will be added')
            cover = 'rsc/Novel Cover.png'
        else:
            exists = os.path.isfile('rsc/' + cover)
            if exists:
                self.msg('The cover ' + cover + ' will be added from the rsc folder.')
                cover = 'rsc/' + cover
            else:
                self.msg('+'*20)
                self.msg('Error Occured!')
                self.msg('No cover found with the name ' + cover + ' in the rsc folder.')
                self.msg('Make sure the cover is inside the rsc folder and the name is correct.')
                self.msg('+'*20)
                return       

        def callback():
            try:
                self.msg('Connecting to NovelPlanet...')
                self.getNovel(link, start, end, cover)
                self.msg('starting...')
                self.compileNovel()
                self.msg('+'*20)
                self.msg('ALL DONE!')
                self.msg('+'*20)
            except Exception as e:
                self.msg('+'*20)
                self.msg('Error Occured!')
                self.msg('+'*20)
                self.msg(str(e))
                self.msg("If you continue to have this error then open an issue here:")
                self.msg("github.com/dr-nyt/Translated-Novel-Downloader/issues")
                self.msg('+'*20)
                self.msg('')
        t = threading.Thread(target=callback)
        t.daemon = True
        t.start()

    def getNovel(self, link, chapterStart, chapterEnd, cover):
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

        self.msg("Chapter " + str(self.chapterNum_start) + " to Chapter " + str(self.chapterNum_end) + " will be compiled!")

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

        chapters = []
        #Loop through each link
        for chapter_link in self.chapter_links:

            page = self.scraper.get('https://novelplanet.com' + chapter_link)
            soup = BeautifulSoup(page.text, 'lxml')

            #Add a header for the chapter
            try:
                chapterHead = soup.find('h4').get_text()
                c = epub.EpubHtml(title=chapterHead, file_name='Chapter_' + str(self.currentChapter) + '.xhtml', lang='en')
                content = '<h2>' + chapterHead + '</h4>'
            except:
                c = epub.EpubHtml(title="Chapter "  + str(self.currentChapter), file_name='Chapter_' + str(self.currentChapter) + '.xhtml', lang='en')
                content = "<h2> Chapter "  + str(self.currentChapter) + "</h4>"

            #Get all the paragraphs from the chapter
            paras = soup.find(id="divReadContent").find_all('p')

            #Add each paragraph to the docx file
            for para in paras:
                content += para.prettify()

            content += "<p> </p>"
            content += "<p>Powered by dr_nyt</p>"
            content += "<p>If any errors occur, open an issue here: github.com/dr-nyt/Translated-Novel-Downloader/issues</p>"
            content += "<p>You can download more novels using the app here: github.com/dr-nyt/Translated-Novel-Downloader</p>"

            c.content = u'%s' % content
            chapters.append(c)

            self.msg('Chapter: ' + str(self.currentChapter) + ' compiled!')
            self.currentChapter+=1

        for chap in chapters:
            book.add_item(chap)

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

        self.msg('+'*20)
        self.msg(self.novelName + ' has compiled!') 
        self.msg('+'*20)


###############################
#tkINTER

## Window Creator
    