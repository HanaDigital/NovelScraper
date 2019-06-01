import os
import shutil
import requests
from bs4 import BeautifulSoup
from tkinter import *
import threading
import webbrowser
from functools import partial
from EpubEngine import EpubEngine
import os
import shutil
import zipfile
from ebooklib import epub

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
            print('Either the link is invalid or your IP is timed out.')
            print('In case of an IP timeout, it usually fixes itself after some time.')
            print('If this issue persists, open an issue here:')
            print('github.com/dr-nyt/WuxiaWorld-Novel-Downloader/issues')

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
        self.book = epub.EpubBook()
        self.book.set_identifier('dr_nyt')
        self.book.set_title(self.novelName)
        self.book.set_language('en')
        self.book.add_author(author)
        self.chapters = []
        self.index = 0

        if self.cover != '':
            self.book.set_cover("image.jpg", open("rsc/" + self.cover, 'rb').read())

        head = 0
        for link in self.chapter_links:
            page = requests.get('https://www.wuxiaworld.com' + link)
            soup = BeautifulSoup(page.text, 'lxml')
            story_view = soup.find(class_='p-15')
            if head == 0:
                try:
                    chapterHead = story_view.find('h4').get_text()
                    chapter = soup.find(class_='fr-view')
                    chapter = epub.EpubHtml(title=chapterHead, file_name='Chapter_' + str(self.chapterCurrent) + '.xhtml', lang='en')
                    chapter.content=u'%s' %  chapter
                    self.chapters.append(chapter)
                    break
                except:
                    chapter = soup.find(class_='fr-view')
                    chapter = epub.EpubHtml(title='Chapter ' + str(self.chapterCurrent), file_name='Chapter_' + str(self.chapterCurrent) + '.xhtml', lang='en')
                    chapter.content=u'%s' %  chapter
                    self.chapters.append(chapter)

            head = 1
            print('Chapter: ' + str(self.chapterCurrent) + ' compiled!')
            self.chapterCurrent+=1

        self.book.toc = (self.chapters)
        
        self.book.add_item(epub.EpubNcx())
        self.book.add_item(epub.EpubNav())

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
        self.book.add_item(nav_css)

        # create spin, add cover page as first page
        self.book.spine = ['image.jpg', 'nav'] + self.chapters
        
        self.volume_links = []
        volumeName = self.novelName + ' Vol.' + str(self.volume) + ' ' + str(self.chapterNum_start) + '-' + str(self.chapterNum_end)

        #If only one volume is to be compiled
        if(self.volume_limit == 1):
            epub.write_epub(volumeName + '.epub', self.book, {})
            #shutil.move(volumeName + '.epub', self.novelName + '/' + volumeName + '.epub')
            print('+'*20)
            print('Volume: ' + str(self.volume) + ' compiled!') 
            print('+'*20)
            self._break = 1
        else:
            #Increment the volume number and continue
            self.volume+=1
            epub.write_epub(volumeName + '.epub', self.book, {})
            #shutil.move(volumeName + '.epub', self.novelName + '/' + volumeName + '.epub')
            print('+'*20)
            print('Volume: ' + str(self.volume) + ' compiled!') 
            print('+'*20)

###############################
#TKINTER
#BEYOND THIS POINT IS CHAOS AND DESTRUCTION, DONT EVEN BOTHER...

run = WuxiaScraper('https://www.wuxiaworld.com/novel/overgeared', 'cover.jpeg', volume=1)
run.start()