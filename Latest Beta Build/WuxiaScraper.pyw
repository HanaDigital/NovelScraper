import requests
from bs4 import BeautifulSoup
from HanaDocument import HanaDocument

class WuxiaScraper(object):

    def __init__(self, link, volume=0):
        self.link = link
        
        self.HD = HanaDocument()
        self.head = 0
        #Novel Name
        self.novelName = ''
        tempName = self.link.split('/')[4]
        tempName = tempName.split('-')
        for name in tempName:
            self.novelName = self.novelName + name.capitalize() + ' '
        self.novelName = self.novelName[:-1]
        ###########
        self.chapterNum_start = 1
        self.chapterNum_end = 0
        self.chapterCurrent = 1

        self.volume = volume
        if(self.volume != 0):
            self.volume_limit = 1
            self.volumeNum = int(self.volume)
        else:
            self.volume_limit = 0
            self.volumeNum = 0
        self.volume_links = []

        page = requests.get(link)
        self.soup = BeautifulSoup(page.text, 'html.parser')
        self.begin()
        
    def begin(self):
        self.getChapterLinks()
        
    def getMetaData(self, link_start, link_end):
        metaData = []
        
        partsX = link_start.split('/')
        for x in partsX:
            if x != '' and x != 'novel':
                metaData.append(x)
        chapter_start = metaData[1].split('-')
        for chapter in chapter_start:
            if chapter.isdigit():
                self.chapterNum_start = int(chapter)
                break
        self.chapterCurrent = self.chapterNum_start
        
        metaData = []

        partsY = link_end.split('/')
        for y in partsY:
            if y != '' and y != 'novel':
                metaData.append(y)
        chapter_end = metaData[1].split('-')
        for chapter in chapter_end:
            if chapter.isdigit():
                self.chapterNum_end = int(chapter)
                break
                
    def getChapterLinks(self):
        volume_list = self.soup.find_all(class_="panel-body")
        
        if volume_list == []:
            print('WuxiaWorld servers are blocking you, change your IP and try again')
        
        for v in volume_list:
            chapter_links = []
            
            self.HD.stylesConfig('Heading 1', 36)
            self.HD.stylesConfig('Normal', 32)
            
            if v.find(class_="col-sm-6") == None:
                continue
            #TODO add book cover feature
            
            self.HD.sectionConfig(0.5)
            
            if self.volumeNum != 1 and self.volume_limit == 1:
                self.volumeNum-=1
                continue
            
            chapter_html_links = v.find_all(class_="chapter-item")
            for chapter_http in chapter_html_links:
                chapter_links.append(chapter_http.find('a').get('href'))
            
            self.volume_links.append(chapter_links)

            self.getMetaData(chapter_links[0], chapter_links[-1])
            
            self.getChapter()

            self.volume_links = []
            if(self.volume_limit == 1):
                self.HD.saveBook(self.novelName, self.volume, self.chapterNum_start, self.chapterNum_end)
                print('+'*20)
                print('Volume: ' + str(self.volume) + ' compiled!') 
                print('+'*20)
                break
            
            self.volume+=1
            self.HD.saveBook(self.novelName, self.volume, self.chapterNum_start, self.chapterNum_end)
            print('+'*20)
            print('Volume: ' + str(self.volume) + ' compiled!') 
            print('+'*20)
            self.HD = HanaDocument()
            
    
    def getChapter(self):
        for v in self.volume_links:
            for chapters in v:
                chapter_list = []
                page = requests.get('https://www.wuxiaworld.com' + chapters)
                soup = BeautifulSoup(page.text, 'html.parser')
                story_view = soup.find_all(class_='p-15')
                for story_list in story_view:
                    if self.head == 0:
                            self.HD.addHead(story_list.find('h4').get_text())
                            self.head = 1
                    story_text = story_list.find_all('p')
                    for story in story_text:
                        chapter_list.append(story.get_text().replace('\xa0', ' ').replace('Previous Chapter', ''))
                for paragraph in chapter_list:
                    if paragraph != '':
                        self.HD.addPara(paragraph)
                self.HD.addSection()
                self.head = 0
                print('Chapter: ' + str(self.chapterCurrent) + ' compiled!')
                self.chapterCurrent+=1

