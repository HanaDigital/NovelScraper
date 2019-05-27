import os
import requests
from bs4 import BeautifulSoup
from HanaDocument import HanaDocument
from tkinter import *
import threading
import webbrowser
from functools import partial
from WuxiaCo import WuxiaCoScraper

version = "0.5"

class WuxiaScraper(object):

    def __init__(self, link, cover, volume=0):
        self.link = link    #Holds the link to the novel.
        self.cover = cover

        self.HD = HanaDocument()
        self.head = 0   #Indicator to check if the current chapter has a title.
        #Get Novel Name
        self.novelName = ''
        tempName = self.link.split('/')[4]  #Split the link of the website into a list separated by "/" and get the 4th index [eg: http://wuxiaworld/novel/my-novel-name/].
        tempName = tempName.split('-')  #Split that into another list separated by "-" [eg: my-novel-name].
        for name in tempName:
            self.novelName = self.novelName + name.capitalize() + ' '   #Capatalize each word of the novel name and add a space in between [eg: My Novel Name].
        self.novelName = self.novelName[:-1]    #IDK why I did this but there must be a reason... I'm sure of it!!!
        ###########
        self.chapterNum_start = 1   #The number of the starting chapter is initialized.
        self.chapterNum_end = 0     #This number of the last chapter is initialized.
        self.chapterCurrent = 1     #This is stores the number of the current chapter being compiled.

        self.volume = volume    #Holds the volume number specified, if no volume number is specified then default is 0.
        if(self.volume != 0):   #If the volume is not 0 then only the volume number specified will be downloaded.
            self.volume_limit = 1   #Sets the volume limit so only one volume will be allowed to download.
            self.volumeNum = int(self.volume)   #This variable is only used when only one volume needs to downloaded
        else:   #If the volume number is specified as 0 then all the volumes will be downloaded.
            self.volume_limit = 0   #Removes the volume limit to allow all volumes to be downloaded.
            self.volumeNum = 0  #This is set to 0 because all volumes will be downloaded now.
        self.volume_links = []  #Empty list to store links to the chapters of each volume, one volume at a time.

        page = requests.get(link)   #Connects to the website.
        self.soup = BeautifulSoup(page.text, 'html.parser')     #Gets the html from the website and converts it to readable text.
        
    def start(self):
        self.getChapterLinks()

    #I forgot what exactly this method does but it is something related to setting pointers to the starting and ending chapters of each volume in a novel.
    def getMetaData(self, link_start, link_end):
        metaData = []
        index = -1
        
        partsX = link_start.split('/')
        for x in partsX:
            if x != '' and x != 'novel':
                metaData.append(x)
        chapter_start = metaData[1].split('-')
        while index >= -len(chapter_start):
            if chapter_start[index].isdigit():
                self.chapterNum_start = int(chapter_start[index])
                index = -1
                break
            else:
                index = index - 1
        # for chapter in chapter_start:
        #     if chapter.isdigit():
        #         self.chapterNum_start = int(chapter)
        #         break
        self.chapterCurrent = self.chapterNum_start
        
        metaData = []

        partsY = link_end.split('/')
        for y in partsY:
            if y != '' and y != 'novel':
                metaData.append(y)
        chapter_end = metaData[1].split('-')
        while index >= -len(chapter_end):
            if chapter_end[index].isdigit():
                self.chapterNum_end = int(chapter_end[index])
                index = -1
                break
            else:
                index = index - 1
        # for chapter in chapter_end:
        #     if chapter.isdigit():
        #         self.chapterNum_end = int(chapter)
        #         break

    #This method loops between volumes and calls the getChapter method for each volume's chapters to be compiled and then saves them to a .doc file.   
    def getChapterLinks(self):
        volume_list = self.soup.find_all(class_="panel-body")
        
        if volume_list == []:
            msg('Either the link is invalid or your IP is timed out.')
            msg('In case of an IP timeout, it usually fixes itself after some time.')
            msg('Ping me @ https://github.com/dr-nyt/ if this issue persists')
        
        for v in volume_list:
            chapter_links = []
            
            self.HD.stylesConfig('Heading 1', 36)
            self.HD.stylesConfig('Normal', 32)
            
            if v.find(class_="col-sm-6") == None:
                continue
            
            self.HD.sectionConfig(0.5)
            
            #Skip over volumes if a specific volume is defined
            if self.volumeNum != 1 and self.volume_limit == 1:
                self.volumeNum-=1
                continue

            #Add Coverpage if not already added
            if self.cover != '':
                self.HD.addCover(self.cover)
                self.HD.addSection()
            
            chapter_html_links = v.find_all(class_="chapter-item")
            for chapter_http in chapter_html_links:
                chapter_links.append(chapter_http.find('a').get('href'))
            
            self.volume_links.append(chapter_links)

            self.getMetaData(chapter_links[0], chapter_links[-1])
            
            self.getChapter()

            self.volume_links = []
            if(self.volume_limit == 1):
                self.HD.saveBook(self.novelName, self.volume, self.chapterNum_start, self.chapterNum_end)
                msg('+'*20)
                msg('Volume: ' + str(self.volume) + ' compiled!') 
                msg('+'*20)
                break
            
            self.volume+=1
            self.HD.saveBook(self.novelName, self.volume, self.chapterNum_start, self.chapterNum_end)
            msg('+'*20)
            msg('Volume: ' + str(self.volume) + ' compiled!') 
            msg('+'*20)
            self.HD = HanaDocument()
            
    #This method loops through every chapter of a volume and compiles them properly, adding in headers and separator between each chapter.
    def getChapter(self):
        firstLine = 0
        for v in self.volume_links:
            for chapters in v:
                chapter_list = []
                page = requests.get('https://www.wuxiaworld.com' + chapters)
                soup = BeautifulSoup(page.text, 'lxml')
                story_view = soup.find(class_='p-15')
                if self.head == 0:
                    try:
                        chapterHead = story_view.find('h4').get_text()
                        self.HD.addHead(chapterHead)
                        self.head = 1
                    except:
                        self.HD.addHead("Chapter " + self.chapterCurrent)

                story_view = soup.find(class_='fr-view')
                story_text = []
                story_text.append(story_view.find_all('div'))
                if len(story_text) != 0:
                    for story in story_text:
                        for story2 in story:
                            chapter_list.append(story2.get_text().replace('\xa0', ' ').replace('Previous Chapter', ''))
                            if firstLine == 0 and self.head != 0:
                                if chapterHead.replace(' ', '').replace('-', '').replace('<', '').replace('>', '') in story2.get_text().replace(' ', '').replace('-', '').replace('<', '').replace('>', ''):
                                    chapter_list[0] = ''
                                firstLine = 1

                story_view = soup.find(class_='p-15')
                story_text = story_view.find_all('p')
                if len(story_text) != 0:
                    for story in story_text:
                        chapter_list.append(story.get_text().replace('\xa0', ' ').replace('Previous Chapter', ''))
                        if firstLine == 0 and self.head != 0:
                            if chapterHead.replace(' ', '').replace('-', '').replace('<', '').replace('>', '') in story.get_text().replace(' ', '').replace('-', '').replace('<', '').replace('>', ''):
                                chapter_list[0] = ''
                            firstLine = 1

                for paragraph in chapter_list:
                    if paragraph != '':
                        self.HD.addPara(paragraph)
                self.HD.addPara(" ")
                self.HD.addPara("Powered by dr_nyt")
                self.HD.addPara("If any errors occur, open an issue here: github.com/dr-nyt/WuxiaWorld-Novel-Downloader/issues")
                self.HD.addPara("You can download more novels using the app here: github.com/dr-nyt/WuxiaWorld-Novel-Downloader")
                self.HD.addSection()
                self.head = 0
                firstLine = 0
                msg('Chapter: ' + str(self.chapterCurrent) + ' compiled!')
                self.chapterCurrent+=1

###############################
#TKINTER
#BEYOND THIS POINT IS CHAOS AND DESTRUCTION, DONT EVEN BOTHER...
versionCheck = 0

def updateMsg():
    popup = Tk()
    popup.wm_title("Update")
    popup.configure(background = "black")
    label = Label(popup, text="New Update Available here: ", bg="black", fg="white", font="none 15")
    link = Label(popup, text="Github/WuxiaNovelDownloader", bg="black", fg="lightblue", font="none 12")
    B1 = Button(popup, text="Okay", command=popup.destroy)
    label.pack(padx=10)
    link.pack(padx=10)
    link.bind("<Button-1>", callback)
    link.bind("<Enter>", partial(color_config, link, "white"))
    link.bind("<Leave>", partial(color_config, link, "lightblue"))
    B1.pack()
    popup.call('wm', 'attributes', '.', '-topmost', '1')
    popup.mainloop()

def color_config(widget, color, event):
    widget.configure(foreground=color)

def callback(event):
    webbrowser.open_new(r"https://github.com/dr-nyt/WuxiaWorld-Novel-Downloader")

def versionControl():
    version = "0.5"
    url = 'https://pastebin.com/7HUqzRGT'
    page = requests.get(url)
    soup = BeautifulSoup(page.text, 'lxml')
    checkVersion = soup.find(class_='de1')
    if version not in checkVersion:
        updateMsg()
        

def msg(text):
    output.config(state='normal')
    output.insert(END, text + '\n')
    output.see(END)
    output.config(state='disabled')

def compiler():
    link = eNovel.get()
    volume = eVolume.get()
    cover = eCover.get()
    
    if volume == '':
        volume = 0
        msg('All Volumes will be compiled.')
    else:
        msg('Only Volume: ' + volume + ' will be compiled.')

    if cover == '':
        msg('No cover will be added')
    else:
        exists = os.path.isfile('rsc/' + cover)
        if exists:
            msg('The cover ' + cover + ' will be added from the rsc folder.')
            cover = 'rsc/' + cover
        else:
            msg('+'*20)
            msg('Error Occured!')
            msg('No cover found with the name ' + cover + ' in the rsc folder.')
            msg('Make sure the cover is inside the rsc folder and the name is correct.')
            msg('+'*20)
            return       

    def callback():
        try:
            # check if url is wuxiaworld.com or wuxiaworld.co
            url = eNovel.get().split('/')[2]
            msg(url)
            if url == "m.wuxiaworld.co":
                Novel = WuxiaCoScraper(link, cover)
                msg('starting...')
                Novel.start()
            else:

                Novel = WuxiaScraper(link, cover, volume)
                msg('starting...')
                Novel.start()
                msg('+'*20)
                msg('ALL DONE!')
                msg('+'*20)
        except Exception as e:
            msg('+'*20)
            msg('Error Occured!')
            msg('+'*20)
            msg(str(e))
            msg("If you continue to have this error then open an issue here:")
            msg("github.com/dr-nyt/WuxiaWorld-Novel-Downloader/issues")
            msg('+'*20)
            msg('')
    t = threading.Thread(target=callback)
    t.daemon = True
    t.start()

## Window Creator
window = Tk()
window.title("Hana Novel Scraper")
window.configure(background = "black")

#Labels
Label(window, text="Novel Link: ", bg="black", fg="white", font="none 16").grid(row=0, column=0, sticky=W)

Label(window, text="Volume Num [optional]: ", bg="black", fg="white", font="none 10").grid(row=1, column=0, sticky=W)

Label(window, text="Cover Page [optional]: ", bg="black", fg="white", font="none 10").grid(row=2, column=0, sticky=W)

#Entries
eNovel = Entry(window, width=75, bg="white")
eNovel.grid(row=0, column=1, sticky=W)
eNovel.bind('<Return>', lambda _: compiler())

eVolume = Entry(window, width=5, bg="white")
eVolume.grid(row=1, column=1, sticky=W)
eVolume.bind('<Return>', lambda _: compiler())

eCover = Entry(window, width=20, bg="white")
eCover.grid(row=2, column=1, sticky=W)
eCover.bind('<Return>', lambda _: compiler())

#Buttons
Button(window, text="Compile", width=8, command=compiler).grid(row=3, column=1, sticky=W)

#Text Boxes
output = Text(window, width=75, height=10, state='disabled', wrap=WORD, background="white")
output.grid(row=4, column=0, padx=5, columnspan=2, sticky=W)
msg('LOG:')

#Scroll Bars
scroll = Scrollbar(window, width=10, command=output.yview)
output.config(yscrollcommand=scroll.set)
scroll.grid(row=4, column=1, sticky=E)

if versionCheck == 0:
    versionControl()
    versionCheck = 1

window.mainloop()
