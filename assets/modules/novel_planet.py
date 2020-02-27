from bs4 import BeautifulSoup
import cloudscraper
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
            scrapper = cloudscraper.create_scraper()
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

            book = EpubEngine(self.novel_name, self.storage_path)

            book.addCover(self.storage_path + "/cover.png")
            print("Added Cover")

            current_chapter = 1
            self.download_chapters(current_chapter, scrapper, chapter_links, book)
            
            book.createEpub()
            self.update_gui('END')

        except Exception as e:
            if 'Missing Node.js' in str(e):
                self.update_gui("NODEJS")
            else:
                print(e)
                self.update_gui('ERROR')
    
    def update_novel(self):
        try:
            print("Initializing...")
            scrapper = cloudscraper.create_scraper()
            page = scrapper.get(self.novel_link)
            soup = BeautifulSoup(page.text, 'html.parser')

            # Get Novel Name
            self.novel_name = soup.find(class_='title').get_text()

            # Get the html that stores links to each chapter
            chapters = soup.find_all(class_='rowChapter')

            valid_chars = "-_.() %s%s" % (string.ascii_letters, string.digits)
            file = self.novel_name  + '.epub'
            file = ''.join(c for c in file if c in valid_chars)
            if(os.path.isfile(r'%s' % self.storage_path + '/' + file) == False):
                self.create_novel()
                return

            old_book = epub.read_epub(r'%s' % self.storage_path + '/' + file)
            
            numOfChaps = 0
            for chap in old_book.get_items_of_type(epub.ebooklib.ITEM_DOCUMENT):
                numOfChaps += 1
            numOfChaps = numOfChaps - 2

            if(numOfChaps == len(chapters)):
                self.update_gui("NO-UPDATE")
                print("NO-UPDATE")
                return
            
            # Get all the specified links from the html
            chapter_links = []
            for chapter in chapters:
                chapter_links.append(chapter.find('a').get('href'))
            chapter_links.reverse()  # Reverse the list so the first index will be the first chapter
            total_chapters = len(chapter_links)
            chapter_links = chapter_links[numOfChaps:]

            print("Starting...")

            current_chapter = 1
            book = EpubEngine(self.novel_name, self.storage_path)
            book.addCover(self.storage_path + "/cover.png")
            print("Added Cover")

            for chap in old_book.get_items_of_type(epub.ebooklib.ITEM_DOCUMENT):
                if(chap.get_name() == "cover.xhtml" or chap.get_name() == "nav.xhtml"):
                    continue

                get_content = chap.get_content().decode("utf-8")
                re_soup = BeautifulSoup(get_content, 'html.parser')
                
                chapter_head = re_soup.find('h2').get_text()
                content = f"<h2>{chapter_head}</h2>"

                # Get all the paragraphs from the chapter
                content += re_soup.find(id="divReadContent").prettify()

                book.addChapter(chapter_head, current_chapter, content)
                self.update_gui("%.2f" % ((int(current_chapter) / total_chapters) * 100))
                current_chapter += 1
                
                if(self.get_alert() == "cancel"):
                    self.update_gui("CANCEL")
                    return

            self.download_chapters(current_chapter, scrapper, chapter_links, book)
            
            book.createEpub()
            self.update_gui('END')

        except Exception as e:
            if 'Missing Node.js' in str(e):
                self.update_gui("NODEJS")
            else:
                print(e)
                self.update_gui('ERROR')

    def download_chapters(self, current_chapter, scrapper, chapter_links, book):
        try:
            total_chapters = len(chapter_links)

            for chapter_link in chapter_links:
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

                book.addChapter(chapter_head, current_chapter, content)
                self.update_gui("%s" % int((int(current_chapter) / total_chapters) * 100))
                print("%s" % int((int(current_chapter) / total_chapters) * 100))
                current_chapter += 1
                
                if(self.get_alert() == "cancel"):
                    self.update_gui("CANCEL")
                    return

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

np = NovelPlanet("https://novelplanet.com/Novel/Soudana-Tashika-ni-Kawaii-Na", r"A:\Downloads\Novel-Library")
np.create_novel();