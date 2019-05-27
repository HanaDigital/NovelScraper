# Objective ? To be able to crawl m.wuxiaworld.co websites as well.
import os
import requests
from bs4 import BeautifulSoup
#import WuxiaScraper
version = "0.1"


class WuxiaCoScraper(object):

    def __init__(self, link, cover=0):
        self.link = link  # Holds the link to the novel
        self.cover = cover
        # Get novel name
        self.novelName = ''
        # Split the link of the website into a list to get novel name, eg https://m.wuxiaworld.co/Reverend-Insanity
        tempName = self.link.split('/')[3]
        # To get the name from [eg: Reverend-Insanity]
        tempName = tempName.split('-')
        for name in tempName:
            # Capatalize each word of the novel name and add a space in between [eg: My Novel Name].
            self.novelName = self.novelName + name.capitalize() + ' '
        # To remove last whitespace from the novel name
        self.novelName = self.novelName[:-1]

        # Luckily appending /all.html to wuxia.co/novel-name gives a page with all html links
        self.new_link = self.link + '/all.html/'

        # Get the page
        page = requests.get(self.new_link)
        self.soup = BeautifulSoup(page.text, 'html.parser')

    def start(self):
        self.buildChapterLinks()

    def buildChapterLinks(self):
        # My approach is to get all <p> tags since they carry the <a> links we need
        # This dictionary would have the format of ({"chapter_number chapter_name": "link_to")
        chapter_dictionaries = []
        for all_links in self.soup.find_all('a', href=True):
            # Since all wuxia.co valid chapters start with digits, check to see if the string starts with digits
            if all_links['href'][0].isdigit():
                link = all_links['href']
                # to get the proper chapter name, and remove the remaing '</a'
                chapter_title = str(all_links).split('>')[1][:-3]
                tempDict = {chapter_title:link}
                chapter_dictionaries.append(tempDict)

        # Build the book
        html = ""
        for chapter in chapter_dictionaries:
            # Our list in packed with dicts {:}
            # Unpack properly and get correct variables
            tempLink = list(chapter.values())[0]
            chapter_name = list(chapter.keys())[0]
            link = self.link + '/' + tempLink
            # TODO get this printing out in log like dr_nyt's
            print("Getting: {0}".format(chapter_name))
            url = requests.get(link)

            soup = BeautifulSoup(url.text, 'html.parser')
            story_text = self.get_page(soup)
            # build a single html file with all the chapters and stories
            chapter = "<h1>" + str(chapter_name) + "</h1><br/>"
            story = "<p>" + str(story_text) + "</p><br/><br/><br/>"
            html_page = html + chapter + story
        self.save_html(html_page)
        print("Process finished!")



    def get_page(self, soup):
        page = soup.find_all("div", id="chaptercontent")
        text = str(page).split('</div>')[1]
        return text

    def save_html(self, html):
        if not os.path.exists(self.novelName):
            os.mkdir(self.novelName)
        file = open(self.novelName+".html", "w")
        file.write(html)
        file.close()


if __name__ == '__main__':
    pass
