import os
import requests
from bs4 import BeautifulSoup
from HanaDocument import HanaDocument
from tkinter import *
import threading

firstLine = 0
chapterCurrent = 1
head = 0
HD = HanaDocument()

chapter_list = []
page = requests.get('https://www.wuxiaworld.com/novel/stop-friendly-fire/sff-chapter-4')
soup = BeautifulSoup(page.text, 'lxml')
story_view = soup.find(class_='p-15')
if head == 0:
    try:
        chapterHead = story_view.find('h4').get_text()
        HD.addHead(chapterHead)
        head = 1
    except:
        HD.addHead("Chapter " + self.chapterCurrent)

story_view = soup.find(class_='fr-view')
story_text = []
story_text.append(story_view.find_all('div'))
if len(story_text) != 0:
    for story in story_text:
        for story2 in story:
            chapter_list.append(story2.get_text().replace('\xa0', ' ').replace('Previous Chapter', ''))
            if firstLine == 0 and head != 0:
                if chapterHead.replace(' ', '').replace('-', '').replace('<', '').replace('>', '') in story2.get_text().replace(' ', '').replace('-', '').replace('<', '').replace('>', ''):
                    chapter_list[0] = ''
                firstLine = 1

story_view = soup.find(class_='p-15')
story_text = story_view.find_all('p')
if len(story_text) != 0:
    for story in story_text:
        chapter_list.append(story.get_text().replace('\xa0', ' ').replace('Previous Chapter', ''))
        if firstLine == 0 and head != 0:
            HD.addPara(str(story_text))
            if chapterHead.replace(' ', '').replace('-', '').replace('<', '').replace('>', '') in story.get_text().replace(' ', '').replace('-', '').replace('<', '').replace('>', ''):
                chapter_list[0] = ''
            firstLine = 1

for paragraph in chapter_list:
    if paragraph != '':
        HD.addPara(paragraph)
HD.addPara(" ")
HD.addPara("Powered by dr_nyt")
HD.addPara("If any errors occur, open an issue here: github.com/dr-nyt/WuxiaWorld-Novel-Downloader/issues")
HD.addPara("You can download more novels using the app here: github.com/dr-nyt/WuxiaWorld-Novel-Downloader")
HD.addSection()
HD.saveBook('test', 'test', 'test', 'test')