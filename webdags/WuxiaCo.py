# Objective ? To be able to crawl wuxia.co websites as well.
from icecream import ic
import requests
from bs4 import BeautifulSoup
version = "0.1"

class WuxiaCoScraper(object):
    def __init__(self, link, cover):
        self.link = link  # Holds the link to the novel
        self.cover = cover
        #self.HD = HanaDocument()
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
        ic(self.novelName)

        # Luckily appending /all.html to wuxia.co/novel-name gives a page with all html links
        self.new_link = self.link + '/all.html/'

        # Get the page
        page = requests.get(self.new_link)
        ic(page)
        self.soup = BeautifulSoup(page.text, 'html.parser')

    def start(self):
        self.buildChapterLinks()

    def buildChapterLinks(self):
        # My approach is to get all <p> tags since they carry the <a> links we need
        chapter_dictionaries = []  # This dictionary would have the format of ({"chapter_number chapter_name": "link_to")
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
            url = requests.get(link)
            soup = BeautifulSoup(url.text, 'html.parser')
            story_text = self.get_page(soup)
            # build a single html file with all the chapters and stories
            chapter = "<h1>" + str(chapter_name) + "</h1><br/>"
            story = "<p>" + str(story_text) + "</p><br/><br/><br/>"
            html_page = html + chapter + story
            ic(html_page)
        ic(html)



    def get_page(self, soup):
        page = soup.find_all("div", id="chaptercontent")
        text = str(page).split('</div>')[1]
        return text

    def save_html(self, html):
        if not os.path.exists(self.novelName):
            os.mkdir(self.novelName)



newts = WuxiaCoScraper(link = "https://m.wuxiaworld.co/Reverend-Insanity/", cover=0)

newts.start()