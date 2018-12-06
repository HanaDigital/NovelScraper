import requests
from bs4 import BeautifulSoup

class WuxiaScraper(object):

    def __init__(self, link, volume=0):
        self.link = link
        self.volume = volume
        if(self.volume - 1 != 0):
            self.volume_limit = 1
        else:
            self.volume_limit = 0
        self.volume_links = []

        page = requests.get(link)
        self.soup = BeautifulSoup(page.text, 'html.parser')
            
    def getVolume(self):

        volume_list = soup.find_all(class_="panel-body")

        for v in volume_list:

            chapter_links = []
            
            if v.find(class_="col-sm-6") == None:
                continue

            if self.volume - 1 != 0:
                self.volume-=1
                continue
            
            chapter_html_links = v.find_all(class_="chapter-item")
            for chapter_http in chapter_html_links:
                chapter_links.append(chapter_http.find('a').get('href'))

            self.volume_links.append(chapter_links)

            if(volume_limit != 0):
                break
            
        getChapterLink()
            
    
    def getChapterLink(self):
        for v in self.volume_links:
            for chapters in v:
                page = requests.get('https://www.wuxiaworld.com' + chapters)
                soup = BeautifulSoup(page.text, 'html.parser')
                story_view = soup.find_all(class_='p-15')
                for story_list in story_view:
                    story_text = story_list.find_all('p')
                    for story in story_text:
                        chapter_list.append(story.get_text().replace('\xa0', ' ').replace('Previous Chapter', ''))
                for paragraph in chapter_list:
                    if paragraph != '':
                        
                  
                
        
    
    
