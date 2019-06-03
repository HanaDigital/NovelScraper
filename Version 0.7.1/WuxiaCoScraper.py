import os
import shutil
import requests
from bs4 import BeautifulSoup
from tkinter import *
import threading
from ebooklib import epub
import time

class WuxiaCoScraper(object):

    def __init__(self, link, cover):
        self.link = link
        self.cover = cover
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
        msg(self.novelName)

        # Luckily appending /all.html to wuxia.co/novel-name gives a page with all html links
        self.new_link = self.link + '/all.html/'
        retry_count = 0
        #Get the page
        try:
            #error handling in case there is error trying to get the page,
            #  I have slow network
            page = requests.get(self.new_link)
            self.soup = BeautifulSoup(page.text, 'html.parser')
        except Exception as e:
            if retry_count < 3:
                retry_count += 1
                page = requests.get(self.new_link)
                self.soup = BeautifulSoup(page.text, 'html.parser')
            else:
                msg('Error occurred')
                msg('Either the link is invalid or your IP is timed out.')
                msg('In case of an IP timeout, it usually fixes itself after some time.')
                msg('Raise an issue @ https://github.com/dr-nyt/Translated-Novel-Downloader/issues if this issue persists')
                time.sleep(5)
                exit(1)

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
                tempDict = {chapter_title: link}
                chapter_dictionaries.append(tempDict)

        book = epub.EpubBook()
        # add metadata
        book.set_identifier('dr_nyt')
        book.set_title(self.novelName)
        book.set_language('en')
        book.add_author('Unknown')
        chapterList = []

        # Add Coverpage if not already added
        if self.cover != '':
            book.set_cover("image.jpg", open(self.cover, 'rb').read())
        for chapter in chapter_dictionaries:
            # Our list in packed with dicts {:}
            # Unpack properly and get correct variables
            tempLink = list(chapter.values())[0]
            chapter_name = list(chapter.keys())[0]
            link = self.link + '/' + tempLink
            url = requests.get(link)
            soup = BeautifulSoup(url.text, 'html.parser')
            story_text = self.get_page(soup)
            chapter = "<h1>" + str(chapter_name) + "</h1><br/>"
            story = f"<h1>{chapter_name}</h1><br/><p>" + str(story_text) + "</p><br/><br/><br/>"
            try:
                chap = epub.EpubHtml(title=chapter_name, file_name=tempLink + '.xhtml', lang='en')
                content = story
            except:
                chap = epub.EpubHtml(title=chapter_name, file_name=tempLink + '.xhtml', lang='en')
                content = story

            chap.content = u'%s' % content
            chapterList.append(chap)
            msg(f"Added {chapter_name}")

        for c in chapterList:
            book.add_item(c)
        book.toc=(chapterList)
        # add navigation files
        book.add_item(epub.EpubNcx())
        book.add_item(epub.EpubNav())

            # define css style
        style = '''
        @namespace epub "http://www.idpf.org/2007/ops";
        body {
            font-family: Cambria, Liberation Serif, Bitstream Vera Serif, Georgia, Times, Times New Roman, serif;
        }
        h2 {
             text-align: left;
             text-transform: uppercase;
             font-weight: 200;     
        }
        ol {
                list-style-type: none;
        }
        ol > li:first-child {
                margin-top: 0.3em;
        }
        nav[epub|type~='toc'] > ol > li > ol  {
            list-style-type:square;
        }
        nav[epub|type~='toc'] > ol > li > ol > li {
                margin-top: 0.3em;
        }
        '''

        # add css file
        nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css", content=style)
        book.add_item(nav_css)

        # create spin, add cover page as first page
        book.spine = ['cover', 'nav'] + chapterList
        epub.write_epub(self.novelName+'.epub', book, {})
        #shutil.move(self.novelName+'.epub', self.novelName +'/' + self.novelName+'.epub')
        msg('+' * 20)
        msg('Novel: ' + str(self.novelName) + ' compiled!')
        msg('+' * 20)

    def get_page(self, soup):
        page = soup.find_all("div", id="chaptercontent")
        text = str(page).split('</div>')[1]
        return text


###############################
# TKINTER
def msg(text):
    output.config(state='normal')
    output.insert(END, text + '\n')
    output.see(END)
    output.config(state='disabled')


def compiler():
    link = eNovel.get()
    if 'm.wuxiaworld.co' not in link:
        msg('Your link seems to lead to the wrong website.')
        msg('Please make sure you get the novel link from: m.wuxiaworld.co')
        msg("If you continue to have this error then open an issue here:")
        msg("github.com/dr-nyt/Translated-Novel-Downloader/issues")
        return

    cover = eCover.get()

    if cover == '':
        msg('The default cover will be added')
        cover = 'rsc/Novel Cover.png'
    else:
        exists = os.path.isfile('rsc/' + cover)
        if exists:
            msg('The cover ' + cover + ' will be added from the rsc folder.')
            cover = 'rsc/' + cover
        else:
            msg('+' * 20)
            msg('Error Occured!')
            msg('No cover found with the name ' + cover + ' in the rsc folder.')
            msg('Make sure the cover is inside the rsc folder and the name is correct.')
            msg('+' * 20)
            return

    def callback():
        try:
            Novel = WuxiaCoScraper(link, cover)
            msg('starting...')
            Novel.start()
            msg('+' * 20)
            msg('ALL DONE!')
            msg('+' * 20)
        except Exception as e:
            msg('+' * 20)
            msg('Error Occured!')
            msg('+' * 20)
            msg(str(e))
            msg("If you continue to have this error then open an issue here:")
            msg("github.com/dr-nyt/Translated-Novel-Downloader/issues")
            msg('+' * 20)
            msg('')

    t = threading.Thread(target=callback)
    t.daemon = True
    t.start()


## Window Creator
window = Tk()
window.title("WuxiaCo Scrapper")
window.iconbitmap(r"rsc/icon.ico")
window.configure(background="black")

# Labels
Label(window, text="Novel Link: ", bg="black", fg="white", font="none 16").grid(row=0, column=0, sticky=W)

Label(window, text="Volume Num [optional]: ", bg="black", fg="white", font="none 10").grid(row=1, column=0, sticky=W)

Label(window, text="Cover Page [optional]: ", bg="black", fg="white", font="none 10").grid(row=2, column=0, sticky=W)

# Entries
eNovel = Entry(window, width=75, bg="white")
eNovel.grid(row=0, column=1, sticky=W)
eNovel.bind('<Return>', lambda _: compiler())

eCover = Entry(window, width=20, bg="white")
eCover.grid(row=2, column=1, sticky=W)
eCover.bind('<Return>', lambda _: compiler())

# Buttons
Button(window, text="Compile", width=8, command=compiler).grid(row=3, column=1, sticky=W)

# Text Boxes
output = Text(window, width=75, height=10, state='disabled', wrap=WORD, background="white")
output.grid(row=4, column=0, padx=5, columnspan=2, sticky=W)
msg('LOG:')

# Scroll Bars
scroll = Scrollbar(window, width=10, command=output.yview)
output.config(yscrollcommand=scroll.set)
scroll.grid(row=4, column=1, sticky=E)

window.mainloop()

