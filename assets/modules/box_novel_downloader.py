from bs4 import BeautifulSoup
import requests
from ebooklib import epub
import string
import sys
import os

from epub_engine import EpubEngine

class BoxNovel():
    def __init__(self, novel_link, storage_path):
        self.novel_link = novel_link
        self.storage_path = storage_path
    
    def create_novel(self):
        try:
            print("Initializing...")
            response = requests.get(self.novel_link)
            soup = BeautifulSoup(response.text, 'html.parser')

            #Get Novel Name
            self.novel_name = soup.find(class_='post-title').get_text().lstrip().rstrip()
            
            chapters = soup.find_all(class_="wp-manga-chapter")

            chapter_links = []
            for chapter in chapters:
                chapter_links.append(chapter.find('a').get('href'))
            chapter_links.reverse()

            print("Starting...")

            current_chapter = 1
            epub = EpubEngine(self.novel_name, self.storage_path)

            epub.addCover(self.storage_path + "/cover.png")
            print("Added Cover")

            for chapter_link in chapter_links:
                page = requests.get(chapter_link)
                soup = BeautifulSoup(page.text, 'html.parser')

                chapter_head = soup.find(class_="cha-tit")
                if(chapter_head != None):
                    chapter_head = chapter_head.find("h3").get_text()
                    content = f"<h2>{chapter_head}</h2>"
                else:
                    content = ""

                paras = soup.find(class_="cha-words")
                if(paras == None):
                    paras = soup.find(class_="text-left")

                #Remove ads
                for div in paras('div'):
                    div.decompose()
                
                content += paras.prettify()
                
                epub.addChapter(chapter_head, current_chapter, content)
                self.updateGUI("%d" % current_chapter)
                current_chapter += 1
            
            epub.createEpub()
            self.updateGUI('END')

        except Exception as e:
            print(e)
            self.updateGUI('ERROR')

    def updateGUI(self, msg):
        f = open(self.storage_path + '/' + "update.txt","w+")
        f.write("%s" % msg)
        f.close()

bn = BoxNovel("https://boxnovel.com/novel/young-master-mo-are-you-done-kissing/", r"C:\Users\super\Downloads\Novel-Library\Young Master Mo, Are You Done Kissing")
bn.create_novel()