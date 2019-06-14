import os
import shutil
import wx
import requests
import string
from bs4 import BeautifulSoup
from ebooklib import epub


class WuxiaWorldPanel(wx.Panel):

    def __init__(self, parent):
        wx.Panel.__init__(self, parent, id=wx.ID_ANY)
        self.volume_number = wx.TextCtrl(self, size=(40, 20))
        self.volume_text = wx.StaticText(self, label="Volume Num [optional]:")
        self.volume_text.SetForegroundColour('WHITE')
        self.volume_sizer = wx.BoxSizer(wx.HORIZONTAL)
        self.volume_sizer.Add(self.volume_text)
        self.volume_sizer.Add(self.volume_number)
        self.SetSizer(self.volume_sizer)

        self.parent = parent
        self.msg = self.parent.msg
        self.current_directory = self.parent.current_directory
        self.Hide()

        self.chapter_start = None  # The number of the starting chapter is initialized.
        self.chapter_end = None  # This number of the last chapter is initialized.
        self.chapter_current = None  # This is stores the number of the current chapter being compiled.
        self.volume_links = None
        self.chapterList = None

    def run(self, link, cover, directory, volume=0):
        os.chdir(directory)   #Set the correct working directory

        link = link
        cover = cover
        volume = volume
        if volume != 0:
            volume_limit = 1
            volume_number = int(volume)
        else:
            volume_limit = 0
            volume_number = 1
        self.msg("\n ************* Starting ***************")

        try:
            head = 0
            novel_name = ""
            temp_name = link.split('/')[
                4]  # Split the link of the website into a list separated by "/" and get the 4th index [eg: http://wuxiaworld/novel/my-novel-name/].
            temp_name = temp_name.split('-')  # Split that into another list separated by "-" [eg: my-novel-name].
            for name in temp_name:
                novel_name = novel_name + name.capitalize() + ' '
            novel_name = novel_name[:-1]  # Remove the last ' ' from the novel name
            self.chapter_start = 1  # The number of the starting chapter is initialized.
            self.chapter_end = 0  # This number of the last chapter is initialized.
            self.chapter_current = 1  # This is stores the number of the current chapter being compiled.
            self.volume_links = []  # Empty list to store links to the chapters of each volume, one volume at a time.
            page = requests.get(link)
            soup = BeautifulSoup(page.text, 'html.parser')
            volume_list = soup.find_all(class_="panel-body")
            valid_chars = "-_.() %s%s" % (string.ascii_letters,
                                      string.digits)  # Characters allowed in a file name [Characters such as $%"" are not allowed as file names in windows]
            if volume_list == []:
                self.msg("\nEither the link is invalid or your IP is timed out.")
                self.msg("\nIn case of an IP timeout, it usually fixes itself after some time.")
                self.msg("\nRaise an issue @ github.com/dr-nyt/Translated-Novel-Downloader/issues if this issue persists")

            # This will  only run of cover == ""
            if cover == "":
                cover = self.current_directory + '/rsc/Novel Cover.png'
                self.msg("\n\n No cover was chosen"
                         "\nDefault cover will be used")
            for v in volume_list:
                chapter_links = []

                # Skips over empty html tags
                if v.find(class_="col-sm-6") == None:
                    continue

                # Skip over volumes if a specific volume is defined
                if volume_number != 1 and volume_limit == 1:
                    volume_number -= 1
                    continue
                chapter_html_links = v.find_all(class_="chapter-item")
                for chapter_http in chapter_html_links:
                    chapter_links.append(chapter_http.find('a').get('href'))
                self.volume_links.append(chapter_links)

                self.getMetaData(chapter_links[0], chapter_links[-1])  # Sets starting and ending chapter numbers

                self.book = epub.EpubBook()
                self.book.set_identifier('dr_nyt')
                self.book.set_title(f"{novel_name} Vol {str(volume)} {self.chapter_start} - {self.chapter_end}")
                self.book.set_language('en')
                self.book.add_author('Unknown')
                self.book.set_cover("image.jpg", open(cover, 'rb').read())
                self.book.add_item(default_style)

                self.chapterList = []  # Resets the chapter list for the new volume
                ################
                self.getChapter()
                ################
                # If a specific volume is asked then it saves that volume and breaks
                if volume_limit == 1:
                    self.saveBook(novel_name, volume)
                    self.msg(f'\nVolume: {str(volume)} compiled!')
                    break

                volume += 1
                self.saveBook(novel_name, volume)
                self.msg(f'\nVolume: {str(volume)} compiled!')

            self.msg(f"\n{novel_name} has compiled")
            self.msg(f"/n{novel_name} compiled /n saved in {self.current_directory}")
            self.parent.run_button.Enable()
            self.parent.log_report.Enable()
            self.parent.select_cover_dialog_button.Enable()
        except Exception as e:
            self.msg('\n\n *********Error occurred**********')
            self.msg('\n In case of an IP timeout, it usually fixes itself after some time.')
            self.msg('\n Raise an issue @ https://github.com/dr-nyt/Translated-Novel-Downloader/issues if this issue persists')
            self.msg(f'\n error was:\n{e}')
            self.parent.select_cover_dialog_button.Enable()
            self.parent.run_button.Enable()
            self.parent.log_report.Enable()

    def getChapter(self):
        first_line = 0
        for volume in self.volume_links:
            for chapters in volume:
                page = requests.get('https://www.wuxiaworld.com' + chapters)
                soup = BeautifulSoup(page.text, 'lxml')
                story_view = soup.find(class_='p-15')
                # ISSUE the name that's used to save the .xhtml needs to have a random seed
                # make them unique even when they clash
                # seed(1)
                # value = randint(0, 10)
                try:
                    chapter_head = story_view.find('h4').get_text().replace('<', '').replace('>', '')
                    c = epub.EpubHtml(title=chapter_head, file_name='Chapter_' + str(self.chapter_current) + '.xhtml', lang='en')
                    content = f'<h2>{chapter_head}</h2>'
                except:
                    chapter_head = f"Chapter {self.chapter_current}"
                    c = epub.EpubHtml(title=chapter_head, file_name='Chapter_' + str(self.chapter_current) + '.xhtml', lang='en')
                    content = f"<h2>{self.chapter_current}</h2>"

                story_view = story_view.find(class_='fr-view')
                content += story_view.prettify().replace('\xa0', ' ').replace('Previous Chapter', '').replace('Next Chapter', '')  # Removes unecessary clutter from the text
                content += "<p> </p>"
                content += "<p>Support us by joining our discord: https://discord.gg/Wya4Dst</p>"
                content += "<p>If any errors occur, open an issue here: github.com/dr-nyt/Translated-Novel-Downloader/issues</p>"
                content += "<p>You can download more novels using the app here: github.com/dr-nyt/Translated-Novel-Downloader</p>"

                c.content = u'%s' % content
                c.add_item(default_style)  # Links the css file to each chapter html page in epub

                self.chapterList.append(c)
                self.msg(f'\n Added: {chapter_head}')
                self.chapter_current += 1
                
        # Add each chapter to the book
        for chap in self.chapterList:
            self.book.add_item(chap)

        # Add Table of content
        self.book.toc = self.chapterList

        # add navigation files
        self.book.add_item(epub.EpubNcx())
        self.book.add_item(epub.EpubNav())

        # add css file
        nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css",
                                content=style)
        self.book.add_item(nav_css)
        # create spin, add cover page as first page
        self.book.spine = ['cover', 'nav'] + self.chapterList

        self.volume_links = []  # Resets the list to remove all chapter links for the previous volume

    # This method sets the starting and ending chapters, aswell as the current chapter.
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
                self.chapter_start = int(chapter_start[index])
                index = -1
                break
            else:
                index = index - 1
        self.chapter_current = self.chapter_start

        metaData = []

        partsY = link_end.split('/')
        for y in partsY:
            if y != '' and y != 'novel':
                metaData.append(y)
        chapter_end = metaData[1].split('-')
        while index >= -len(chapter_end):
            if chapter_end[index].isdigit():
                self.chapter_end = int(chapter_end[index])
                index = -1
                break
            else:
                index = index - 1

    def saveBook(self, novel_name, volume):
        #Make a valid file name using novel name and chapter information
        valid_chars = "-_.() %s%s" % (string.ascii_letters, string.digits)  #Characters allowed in a file name [Characters such as $%"" are not allowed as file names in windows]

        file = novel_name + 'Vol.' + str(volume) + '.epub'
        file = ''.join(c for c in file if c in valid_chars)

        folder = ''.join(c for c in novel_name if c in valid_chars)

        # create epub file
        epub.write_epub(file, self.book, {})

        #check if the folder exists or not
        if not os.path.exists(folder):
            os.mkdir(folder)

        #Move the .epub file from the current directory to a new folder named under the novel name
        shutil.move(file, folder + '/' + file)

style = '''
        @namespace epub "http://www.idpf.org/2007/ops";
        body {
            font-family: Cambria, Liberation Serif, Bitstream Vera Serif, Georgia, Times, Times New Roman, serif;
        }
        h2 {
             text-align: center;
             text-transform: uppercase;
             font-weight: 500;     
        }
         p {
            margin-bottom:1px;
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
default_style = epub.EpubItem(uid="style_default", file_name="style/default.css", media_type="text/css", content=style)

