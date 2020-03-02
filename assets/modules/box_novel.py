from bs4 import BeautifulSoup
import requests
from ebooklib import epub
import string
import sys
import os
import logging

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

            total_chapters = len(chapter_links)

            print("Starting...")

            current_chapter = 1
            epub = EpubEngine(self.novel_name, self.storage_path)

            epub.addCover(self.storage_path + "/cover.png")
            print("Added Cover")

            for chapter_link in chapter_links:
                print(current_chapter)
                page = requests.get(chapter_link)
                soup = BeautifulSoup(page.text, 'html.parser')

                content = ""
                chapter_head = soup.find(class_="cha-tit")

                if(chapter_head != None):
                    if(chapter_head.find("h3") != None):
                        chapter_head = chapter_head.find("h3").get_text()
                        content = f"<h2>{chapter_head}</h2>"
                        print(content)

                    elif(chapter_head.find("h2") != None):
                        chapter_head = chapter_head.find("h2").get_text()
                        content = f"<h2>{chapter_head}</h2>"
                        print(content)

                    else:
                        chapter_head = "Chapter Title Missing"
                        print(chapter_head + " a")
                else:
                    chapter_head = "Chapter Title Missing"
                    print(chapter_head + " b")

                paras = soup.find_all(class_="cha-words")
                if(len(paras) == 2):
                    paras = paras[1]
                else:
                    paras = soup.find(class_="cha-words")

                if(paras == None):
                    paras = soup.find(class_="text-left")

                    if(paras.find("h3") != None):
                        chapter_head = paras.find("h3").get_text()
                        content = f"<h2>{chapter_head}</h2>"
                        print(content)

                    elif(paras.find("h2") != None):
                        chapter_head = paras.find("h2").get_text()
                        content = f"<h2>{chapter_head}</h2>"
                        print(content)


                #Remove ads
                for div in paras('div'):
                    if(div.get("class")):
                        continue
                    div.decompose()

                content += paras.prettify()
                
                epub.addChapter(chapter_head, current_chapter, content)
                self.update_gui("%s" % int((int(current_chapter) / total_chapters) * 100))
                print("%s" % int((int(current_chapter) / total_chapters) * 100))
                current_chapter += 1
                
                if(self.get_alert() == "cancel"):
                    self.update_gui("CANCEL")
                    return
            
            epub.createEpub()
            self.update_gui('END')

        except Exception as e:
            print(e)
            logging.exception("message")
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

# 0: "https://boxnovel.com/novel/paradise-of-demonic-gods/"
# 1: "A:\Downloads/Novel-Library/Paradise of Demonic Gods"
# 2: "boxnovel"
# 3: "false"

# bn = BoxNovel("https://boxnovel.com/novel/paradise-of-demonic-gods/", r"A:/Downloads/Novel-Library/Paradise of Demonic Gods")
# bn.create_novel()