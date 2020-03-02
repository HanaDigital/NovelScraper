# pyinstaller -y -F -w --add-data "A:/Desktop/Github Repos/NovelScraper/assets/modules/box_novel.py";"." --add-data "A:/Desktop/Github Repos/NovelScraper/assets/modules/epub_engine.py";"." --add-data "A:/Desktop/Github Repos/NovelScraper/assets/modules/novel_planet.py";"." --add-data "C:/Users/shehr/AppData/Local/Programs/Python/Python38-32/Lib/site-packages/cloudscraper";"cloudscraper/"  "A:/Desktop/Github Repos/NovelScraper/assets/modules/download_manager.py"
from bs4 import BeautifulSoup
import requests
from ebooklib import epub

page = requests.get("https://boxnovel.com/novel/paradise-of-demonic-gods/chapter-1149/")
soup = BeautifulSoup(page.text, 'html.parser')

content = ""
chapter_head = soup.find(class_="cha-tit")

if(chapter_head != None):
    if(chapter_head.find("h3") != None):
        chapter_head = chapter_head.find("h3").get_text()
        content = f"<h2>{chapter_head}</h2>"

    elif(chapter_head.find("h2") != None):
        chapter_head = chapter_head.find("h2").get_text()
        content = f"<h2>{chapter_head}</h2>"

paras = soup.find_all(class_="cha-words")
if(len(paras) == 2):
    paras = paras[1]
else:
    paras = soup.find(class_="cha-words")

if(paras == None):
    paras = soup.find(class_="text-left")


#Remove ads
for div in paras('div'):
    if(div.get("class")):
        continue
    div.decompose()

content += paras.prettify()

print(content)