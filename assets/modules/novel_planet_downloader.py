from bs4 import BeautifulSoup
import cfscrape
from ebooklib import epub
import string
import sys
import os

from epub_engine import EpubEngine

class NovelPlanet():
    def __init__(self, novel_link, storage_path):
        self.novel_link = novel_link
        self.storage_path = storage_path
    
    def create_novel(self):
        try:
            print("Initializing...")
            scrapper = cfscrape.create_scraper()
            page = scrapper.get(self.novel_link)
            soup = BeautifulSoup(page.text, 'html.parser')

            # Get Novel Name
            self.novel_name = soup.find(class_='title').get_text()

            # Get the html that stores links to each chapter
            chapters = soup.find_all(class_='rowChapter')

            # Get all the specified links from the html
            chapter_links = []
            for chapter in chapters:
                chapter_links.append(chapter.find('a').get('href'))
            chapter_links.reverse()  # Reverse the list so the first index will be the first chapter

            print("Starting...")

            current_chapter = 1
            epub = EpubEngine(self.novel_name, self.storage_path)

            epub.addCover(self.storage_path + "/cover.png")
            print("Added Cover")

            # Stores each chapter of the story as an object.
            #  Later used to reference the chapters to the table of content
            for chapter_link in chapter_links:
                # print(chapter_link)
                page = scrapper.get(f'https://novelplanet.com{chapter_link}')
                soup = BeautifulSoup(page.text, 'lxml')

                # Add a header for the chapter
                try:
                    chapter_head = soup.find('h4').get_text()
                    content = f"<h2>{chapter_head}</h2>"
                except:
                    chapter_head = f"Chapter {current_chapter}"
                    content = f"<h2>{current_chapter}</h2>"

                # Get all the paragraphs from the chapter
                paras = soup.find(id="divReadContent")

                #Remove ads
                for div in paras('div'):
                    div.decompose()
                    
                content += paras.prettify()

                epub.addChapter(chapter_head, current_chapter, content)
                self.update_gui("%d" % current_chapter)
                current_chapter += 1
                
                if(self.get_alert() == "cancel"):
                    self.update_gui("CANCEL")
                    return
            
            epub.createEpub()
            self.update_gui('END')

        except Exception as e:
            if 'Missing Node.js' in str(e):
                self.update_gui("NODEJS")
            else:
                print(e)
                self.update_gui('ERROR')

    def update_gui(self, msg):
        f = open(self.storage_path + '/' + "update","w+")
        f.write("%s" % msg)
        f.close()
    
    def get_alert(self):
        f = open(self.storage_path + '/' + "alert","r+")
        alert = f.readline()
        f.close()
        return alert