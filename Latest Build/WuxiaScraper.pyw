import requests
from bs4 import BeautifulSoup
from HanaDocument import HanaDocument
from tkinter import *

class WuxiaScraper(object):

    def __init__(self, link, volume=0):
        self.link = link    #Holds the link to the novel.
        
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

    #This method loops between volumes and calls the getChapter method for each volume's chapters to be compiled and then saves them to a .doc file.   
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
            
    #This method loops through every chapter of a volume and compiles them properly, adding in headers and separator between each chapter.
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

###############################
#TKINTER
#BEYOND THIS POINT IS CHAOS AND DESTRUCTION, DONT EVEN BOTHER...
def msg(text):
    output.config(state='normal')
    output.insert(END, text + '\n')
    output.see(END)
    output.config(state='disabled')

def compiler():
    link = eNovel.get()
    volume = eVolume.get()
    
    if volume == '':
        volume = 0
        msg('All Volumes will be compiled.')
    else:
        msg('Only Volume: ' + volume + ' will be compiled.')

    try:
        Novel = WuxiaScraper(link, volume)
        msg('starting...')
        Novel.start()
        msg('+'*20)
        msg('ALL DONE!')
        msg('+'*20)
    except:
        msg('+'*20)
        msg('Error Occured!')
        msg('+'*20)
        msg('Make sure provided link or volume num is valid.')
        msg('+'*20)
        msg('')

## Window Creator
window = Tk()
window.title("Hana Novel Scraper")
window.configure(background = "black")

#Labels
Label(window, text="Novel Link: ", bg="black", fg="white", font="none 16").grid(row=0, column=0, sticky=W)

Label(window, text="Volume Num [optional]: ", bg="black", fg="white", font="none 10").grid(row=1, column=0, sticky=W)

#Entries
eNovel = Entry(window, width=75, bg="white")
eNovel.grid(row=0, column=1, sticky=W)

eVolume = Entry(window, width=5, bg="white")
eVolume.grid(row=1, column=1, sticky=W)

#Buttons
Button(window, text="Compile", width=8, command=compiler).grid(row=2, column=1, sticky=W)

#Text Boxes
output = Text(window, width=75, height=10, state='disabled', wrap=WORD, background="white")
output.grid(row=3, column=0, padx=5, columnspan=2, sticky=W)
msg('LOG:')

#Scroll Bars
scroll = Scrollbar(window, width=10, command=output.yview)
output.config(yscrollcommand=scroll.set)
scroll.grid(row=3, column=1, sticky=E)

window.mainloop()
