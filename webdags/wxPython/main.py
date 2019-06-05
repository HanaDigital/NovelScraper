import os
import wx
import threading
import requests
from random import seed
from random import randint
from bs4 import BeautifulSoup
import cfscrape
from ebooklib import epub
import string

# for the file dialog in the selection of book covers
wildcard = "Image file (*.png)" \
           "All files (*.*)|*.*"

# The launch panel
class LaunchPanel(wx.Panel):

    def __init__(self, parent):
        wx.Panel.__init__(self, parent, id=wx.ID_ANY)

        # widget to hold the text "Enter URL:
        self.enter_url_text = wx.StaticText(self, id=wx.ID_ANY, label = "Enter Url: ")

        # widget to enter the url link
        self.url_box = wx.TextCtrl(self, value="eg https://www.wuxiaworld.com/novel/overgeared")

        # widget for the combo box to select from novelplanet, wuxiaworld or wuxiaco
        self.novel_websites_list = ['NovelPlanet', 'm.Wuxiaworld.co', 'Wuxiaworld.com']
        self.novel_website_box = wx.ComboBox(self, id=wx.ID_ANY, style= wx.CB_READONLY,
                                             choices=self.novel_websites_list)

        # widget for the cover page selector
        self.current_directory = os.getcwd()
        self.cover_path = ""
        self.select_cover_dialog_button = wx.Button(self, label="[optional] Book Cover")
        # button to clear selected image
        self.remove_cover_button = wx.Button(self, label="Remove Image")

        self.cover_sizer = wx.BoxSizer(wx.HORIZONTAL)
        self.cover_sizer.Add(self.select_cover_dialog_button, wx.ALL | wx.ALIGN_LEFT, 5)
        self.cover_sizer.Add(self.remove_cover_button)
        self.remove_cover_button.Hide()

        # Box to display progress report and status
        self.log_report= wx.TextCtrl(self, id=wx.ID_ANY, size=(600, 300),
                          style=wx.TE_MULTILINE|wx.TE_READONLY|wx.VSCROLL, value="Log box")
        self.log = Log(self.log_report)
        # Button to run the progran
        self.run_button = wx.Button(self, label="Compile")

        # Sizers and arrangment
        #
        # Sizer to hold the enter_url_text and the url_box
        self.urls_sizer = wx.BoxSizer(wx.HORIZONTAL)

        self.urls_sizer.Add(self.enter_url_text, wx.ALL|wx.ALIGN_LEFT, 5)
        self.urls_sizer.Add(self.url_box, wx.ALL|wx.EXPAND, 5)

        # Sizer to hold the combo box and the start button
        self.combo_and_start_sizer = wx.BoxSizer(wx.HORIZONTAL)

        self.combo_and_start_sizer.Add(self.run_button, wx.ALL|wx.CENTER, 5)
        self.combo_and_start_sizer.Add(self.novel_website_box, wx.ALL|wx.ALIGN_RIGHT, 5)

        # Unique controls belonging to specific novels
        # Novel planet
        # The panel object has a .Hide() method that makes it easy to show or hide the panel
        self.novel_planet_chapter_panel = wx.Panel(self, wx.ID_ANY)
        self.novel_planet_chapter_range_text = wx.StaticText(self.novel_planet_chapter_panel,
                                                             label="Chapter Range [optional eg 0-100 ]:")
        self.novel_planet_chapter_range_min_box = wx.TextCtrl(self.novel_planet_chapter_panel, size=(40, 20))
        self.novel_planet_chapter_range_max_box = wx.TextCtrl(self.novel_planet_chapter_panel, size=(40, 20))
        self.novel_planet_chapter_sizer = wx.BoxSizer(wx.HORIZONTAL)
        self.novel_planet_chapter_sizer.Add(self.novel_planet_chapter_range_text)
        self.novel_planet_chapter_sizer.Add(self.novel_planet_chapter_range_min_box, wx.ALL, 5)
        self.novel_planet_chapter_sizer.Add((10,10))
        self.novel_planet_chapter_sizer.Add(self.novel_planet_chapter_range_max_box, wx.ALL, 5)
        self.novel_planet_chapter_panel.SetSizer(self.novel_planet_chapter_sizer)

        # WuxiaWorld
        # The panel object has a .Hide() method that makes it easy to show or hide the panel
        self.wuxia_world_panel = wx.Panel(self, id=wx.ID_ANY)
        self.wuxia_world_volume_number = wx.TextCtrl(self.wuxia_world_panel, size=(40, 20))
        self.wuxia_world_volume_text = wx.StaticText(self.wuxia_world_panel, label="Volume Num [optional]:")
        self.wuxia_world_volume_sizer = wx.BoxSizer(wx.HORIZONTAL)
        self.wuxia_world_volume_sizer.Add(self.wuxia_world_volume_text)
        self.wuxia_world_volume_sizer.Add(self.wuxia_world_volume_number)
        self.wuxia_world_panel.SetSizer(self.wuxia_world_volume_sizer)
        self.wuxia_world_panel.Hide()
        # specifics for only wuxia co # TODO This is only a temp fix
        self.chapter_start = None  # The number of the starting chapter is initialized.
        self.chapter_end = None  # This number of the last chapter is initialized.
        self.chapter_current = None  # This is stores the number of the current chapter being compiled.
        self.volume_links = None
        self.chapterList = None

        # WuxiaWorldCo
        self.wuxia_co_panel = wx.Panel(self, id=wx.ID_ANY)
        self.wuxia_co_text = wx.StaticText(self.wuxia_co_panel, label="m.wuxiaworld.co does not require any args")
        self.wuxia_co_sizer = wx.BoxSizer(wx.HORIZONTAL)
        self.wuxia_co_sizer.Add(self.wuxia_co_text)
        self.wuxia_co_panel.SetSizer(self.wuxia_co_sizer)
        self.wuxia_co_panel.Hide()

        # Add all the widgets together with a vertical sizer
        self.main_sizer = wx.BoxSizer(wx.VERTICAL)

        self.main_sizer.Add(self.urls_sizer)
        self.main_sizer.Add(self.combo_and_start_sizer)
        self.main_sizer.Add(self.cover_sizer)
        self.main_sizer.Add(self.novel_planet_chapter_panel)
        self.main_sizer.Add(self.wuxia_world_panel)
        self.main_sizer.Add(self.wuxia_co_panel)
        self.main_sizer.Add(self.log_report, wx.ALL|wx.CENTER|wx.EXPAND, 5)
        self.SetSizer(self.main_sizer)
        #self.main_sizer.Fit(self)

        # Bind Buttons and Actions

        # BIND the novel website selection,  it will allow us to show and hide the panels
        self.novel_website_box.Bind(wx.EVT_COMBOBOX, self.novel_website_panel_changer)

        # BIND the cover page selector button
        self.select_cover_dialog_button.Bind(wx.EVT_BUTTON, self.on_cover_button)
        # BIND the remove cover button
        self.remove_cover_button.Bind(wx.EVT_BUTTON, self.on_remove_cover)

        # BIND the compile button
        self.run_button.Bind(wx.EVT_BUTTON, self.on_run)

    def novel_website_panel_changer(self, event):
        selection = event.GetEventObject()
        if selection.GetValue() == "NovelPlanet":
            self.novel_planet_chapter_panel.Show()
            self.wuxia_co_panel.Hide()
            self.wuxia_world_panel.Hide()
            self.Layout()

        elif selection.GetValue() == "Wuxiaworld.com":
            self.novel_planet_chapter_panel.Hide()
            self.wuxia_co_panel.Hide()
            self.wuxia_world_panel.Show()
            self.Layout()

        elif selection.GetValue() == "m.Wuxiaworld.co":
            self.novel_planet_chapter_panel.Hide()
            self.wuxia_co_panel.Show()
            self.wuxia_world_panel.Hide()
            self.Layout()

    def on_cover_button(self, event):
        dialog = wx.FileDialog(self, message="Choose an Image File",
                               defaultDir=self.current_directory,
                               defaultFile="",
                               wildcard=wildcard,
                               style=wx.FD_OPEN | wx.FD_CHANGE_DIR
                               )
        if dialog.ShowModal() == wx.ID_OK:
            self.cover_path = dialog.GetPath()
            self.log.write(f"\n\n\nYou have chosen the cover located at: \n{self.cover_path}")
            self.remove_cover_button.Show()
            self.Layout()
        dialog.Destroy()

    def on_remove_cover(self, event):
        if self.cover_path != "":
            self.log.write(f"\n\n\nYou have removed the cover located at: \n{self.cover_path}")
            self.remove_cover_button.Hide()
            self.cover_path = ""

    def on_run(self, event):
        url = self.url_box.GetValue()
        cover = self.cover_path
        # wuxiaworld.com added options
        volume = self.wuxia_world_volume_number.GetValue()

        # Novel planet added options
        min_chapter = self.novel_planet_chapter_range_min_box.GetValue()
        max_chapter = self.novel_planet_chapter_range_max_box.GetValue()
        kwargs = {'url': url,
                  'cover': cover,
                  'volume': volume,
                  'min_chapter': min_chapter,
                  'max_chapter': max_chapter
                  }

        which_site = self.novel_website_box.GetValue()
        # disable buttons
        self.select_cover_dialog_button.Disable()
        if self.remove_cover_button.IsEnabled():
            self.remove_cover_button.Disable()
        self.run_button.Disable()

        # Small error handling
        if url == "" or url == "eg https://www.wuxiaworld.com/novel/overgeared":
            self.log.write("\n\n\n You need to enter a valid link")
            self.log.write("\nFor wuxiaworld.com: https://www.wuxiaworld.com/novel/overgeared")
            self.log.write("\nFor m.wuxiaworld.co: https://m.wuxiaworld.co/Reverend-Insanity/")
            self.log.write("\nFor NovelPlanet.com: https://novelplanet.com/Novel/Overgeared")
            self.run_button.Enable()
            self.select_cover_dialog_button.Enable()
            if self.remove_cover_button.IsEnabled():
                pass
            else:
                self.remove_cover_button.Enable()
        else:
            if which_site == "m.Wuxiaworld.co":
                BookThread(self.co_wuxia_world, which_site=which_site, **kwargs)
                #self.co_wuxia_world(url, cover)
            elif which_site == "Wuxiaworld.com":
                BookThread(self.wuxiaworld, which_site=which_site, **kwargs)
            elif which_site == "NovelPlanet":
                BookThread(self.novel_planet, which_site=which_site, **kwargs)

    def co_wuxia_world(self, url, cover):
        link = url
        cover = cover
        if cover == "":
            cover = self.current_directory + '/cover.png'
            self.log.write("\n\n No cover was chosen"
                           "\nDefault cover will be used")
        try:
            self.log.write("\n\n\n ***** Starting *****")
            novel_name = ""
            # Split the link of the website into a list to get novel name, eg https://m.wuxiaworld.co/Reverend-Insanity
            temp_name = link.split('/')[3]
            # To get the name from [eg: Reverend-Insanity]
            temp_name = temp_name.split('-')
            # TODO verify that in the case of a novel with one word name, this works reliably
            for name in temp_name:
                # Capatalize each word of the novel name and add a space in between [eg: My Novel Name].
                novel_name = novel_name + name.capitalize() + " "
            # To remove last whitespace from the novel name
            novel_name = novel_name[:-1]
            self.log.write(f"\n\n The compiled novel name is {novel_name}")
            # Luckily appending /all.html to wuxia.co/novel-name gives a page with all html links
            real_url = link + "/all.html/"
            # TODO reliably handle network failiure to avoid redownloading novel
            page = requests.get(real_url)
            soup = BeautifulSoup(page.text, 'html.parser')

            # Fetch the book
            # My approach is to get all <p> tags since they carry the <a> links we need
            chapter_dictionaries = [] # This dictionary would have the format of ({"chapter_number chapter_name": "link_to")
            for all_links in soup.find_all('a', href=True):
                # Since all wuxia.co valid chapters start with digits, check to see if the string starts with digits
                if all_links['href'][0].isdigit():
                    temp_link = all_links['href']
                    # to get the proper chapter name, and remove the remaing '</a'
                    chapter_title = str(all_links).split('>')[1][:-3]
                    tempDict = {chapter_title: temp_link}
                    chapter_dictionaries.append(tempDict)
            book = epub.EpubBook()
            book.set_identifier('dr_nyt')
            book.set_title(novel_name)
            book.set_language('en')
            book.add_author('Unknown')
            chapterList = []
            # Add cover
            book.set_cover("image.jpg", open(cover, 'rb').read())

            for chapter in chapter_dictionaries:
                # Our list in packed with dicts {:}
                # Unpack properly and get correct variables
                temp_link = list(chapter.values())[0]
                chapter_name = list(chapter.keys())[0]
                url = link + '/' + temp_link
                temp_page = requests.get(url)
                soup = BeautifulSoup(temp_page.text, 'html.parser').find_all("div", id="chaptercontent")
                story_text = str(soup).split('</div>')[1]
                chapter = "<h2>" + str(chapter_name) + "</h2><br/>"
                story = f"<h2>{chapter_name}</h2><br/><p>" + str(story_text) + "</p><br/><br/><br/>"
                try:
                    chap = epub.EpubHtml(title=chapter_name, file_name=temp_link + '.xhtml', lang='en')
                    content = story
                except:
                    chap = epub.EpubHtml(title=chapter_name, file_name=temp_link + '.xhtml', lang='en')
                    content = story
                chap.content = u'%s' % content
                chapterList.append(chap)
                self.log.write(f"\n Added {chapter_name}")

            for chapter in chapterList:
                book.add_item(chapter)
            book.toc=(chapterList)
            # add navigation files
            book.add_item(epub.EpubNcx())
            book.add_item(epub.EpubNav())

            # add css file
            nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css", content=style)
            book.add_item(nav_css)

            # create spin, add cover page as first page
            book.spine = ['cover', 'nav'] + chapterList
            epub.write_epub(novel_name + '.epub', book, {})
            self.log.write(f"/n{novel_name} compiled /n saved in {os.getcwd()}")
            self.run_button.Enable()
            self.select_cover_dialog_button.Enable()
            self.select_cover_dialog_button.Enable()
            if self.remove_cover_button.IsEnabled():
                pass
            else:
                self.remove_cover_button.Enable()
        except Exception as e:
            self.log.write('\n\n Error occurred')
            self.log.write('\n\n Either the link is invalid or your IP is timed out.')
            self.log.write('\n\n In case of an IP timeout, it usually fixes itself after some time.')
            self.log.write('\n\n Raise an issue @ https://github.com/dr-nyt/Translated-Novel-Downloader/issues if this issue persists')
            self.log.write(f'\n\n\n error was:\n{e}')
            self.select_cover_dialog_button.Enable()
            self.run_button.Enable()
            if self.remove_cover_button.IsEnabled():
                pass
            else:
                self.remove_cover_button.Enable()

    def novel_planet(self, link, cover, chapter_start, chapter_end):
        link = link
        cover = cover
        chapter_start = chapter_start
        chapter_end = chapter_end
        self.log.write("\n ************* Starting ***************")
        try:
            # Initialize connection with NovelPlanet
            scrapper = cfscrape.create_scraper()
            page = scrapper.get(link)
            soup = BeautifulSoup(page.text, 'html.parser')

            # Get Novel Name
            novel_name = soup.find(class_= 'title').get_text()
            # Get the html that stores links to each chapter
            chapters = soup.find_all(class_= 'rowChapter')

            # Get all the specified links from the html
            chapter_links = []
            for chapter in chapters:
                chapter_links.append(chapter.find('a').get('href'))
            chapter_links.reverse()  #Reverse the list so the first index will be the first chapter and so on

            # Cut down the links if the number of chapters are specified and,
            # Set the starting and last chapter number
            if chapter_start != "":
                chapter_start = int(chapter_start)
                current_chapter = chapter_start
                # TODO ask @dr-nyt why this is done like this
                chapter_links = chapter_links[chapter_start - 1:]
            else:
                chapter_start = 1
                current_chapter = 1

            if chapter_end != "":
                chapter_end = int(chapter_end)
                chapter_links = chapter_links[:abs(chapter_end)]
            else:
                chapter_end = len(chapters)
            self.log.write(f"\nChapter {chapter_start}  to Chapter {chapter_end} will be compiled!")


            book = epub.EpubBook()
            # add metadata
            book.set_identifier('dr_nyt')
            book.set_title(novel_name)
            book.set_language('en')
            book.add_author('Unknown')
            # This will  only run of cover == ""
            if cover == "":
                cover = self.current_directory + '/cover.png'
                self.log.write("\n\n No cover was chosen"
                               "\nDefault cover will be used")
            book.set_cover("image.jpg", open(cover, 'rb').read())

            # Stores each chapter of the story as an object.
            #  Later used to reference the chapters to the table of content
            chapters = []
            for chapter_link in chapter_links:
                page = scrapper.get(f'https://novelplanet.com{chapter_link}')
                soup = BeautifulSoup(page.text, 'lxml')

                # Add a header for the chapter
                try:
                    chapter_head = soup.find('h4').get_text()
                    c = epub.EpubHtml(title = chapter_head, file_name=f"Chapter_{current_chapter}.xhtml, lang=en")
                    content = f"<h2>{chapter_head}</h2>"
                except:
                    c = epub.EpubHtml(title=f"Chapter {current_chapter}", file_name=f"Chapter_{current_chapter}.xhtml",
                                      lang="en")
                    content = f"<h2>{current_chapter}</h2>"
                # Get all the paragraphs from the chapter
                paras = soup.find(id="divReadContent")
                # Append all paragraph to content which will be added to the .xhtml
                content += paras.prettify()
                content += "<p> </p>"
                content += "<p>Powered by dr_nyt</p>"
                content += "<p>If any errors occur," \
                           " open an issue here: github.com/dr-nyt/Translated-Novel-Downloader/issues</p>"
                content += "<p>You can download more novels using the app here:" \
                           " github.com/dr-nyt/Translated-Novel-Downloader</p>"
                c.content = u'%s' % content #Add the content to the chapter
                chapters.append(c) #Add the chapter object to the chapter list
                self.log.write(f"\nChapter: {current_chapter} compiled!")
                current_chapter += 1

            # Add each chapter object to the book
            for chap in chapters:
                book.add_item(chap)

            # Give the table of content the list of chapter objects
            book.toc = (chapters)
            # add navigation files
            book.add_item(epub.EpubNcx())
            book.add_item(epub.EpubNav())
            # add css file
            nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css", content=style)
            book.add_item(nav_css)

            # create spin, add cover page as first page
            book.spine = ['cover', 'nav'] + chapters
            # create epub file
            epub.write_epub(novel_name + f' {chapter_start}-{chapter_end}.epub', book, {})
            self.log.write(f"\n{novel_name} has compiled")
            self.log.write(f"/n{novel_name} compiled /n saved in {os.getcwd()}")
            self.run_button.Enable()
            self.select_cover_dialog_button.Enable()
            self.select_cover_dialog_button.Enable()
            if self.remove_cover_button.IsEnabled():
                pass
            else:
                self.remove_cover_button.Enable()

        except Exception as e:
            self.log.write('\n\n Error occurred')
            self.log.write('\n\n Either the link is invalid or your IP is timed out.')
            self.log.write('\n\n In case of an IP timeout, it usually fixes itself after some time.')
            self.log.write('\n\n Raise an issue @ https://github.com/dr-nyt/Translated-Novel-Downloader/issues if this issue persists')
            self.log.write(f'\n\n\n error was:\n{e}')
            self.select_cover_dialog_button.Enable()
            self.run_button.Enable()
            if self.remove_cover_button.IsEnabled():
                pass
            else:
                self.remove_cover_button.Enable()



    def wuxiaworld(self, link, cover, volume=0):
        link = link
        cover = cover
        volume = volume
        if volume != 0:
            volume_limit = 1
            volume_number = int(volume)
        else:
            volume_limit = 0
            volume_number = 1

        # if volume != 0:  # If the volume is not 0 then only the volume number specified will be downloaded.
        #     volume_limit = 1  # Sets the volume limit so only one volume will be allowed to download.
        #     volume_number = int(volume)  # This variable is only used when only one volume needs to downloaded
        # else:  # If the volume number is specified as 0 then all the volumes will be downloaded.
        #     volume_limit = 0  # Removes the volume limit to allow all volumes to be downloaded.
        #     volume_number = 0  # This is set to 0 because all volumes will be downloaded now.

        self.log.write("\n ************* Starting ***************")

        try:
            head = 0
            novel_name = ""
            temp_name = link.split('/')[4]  #Split the link of the website into a list separated by "/" and get the 4th index [eg: http://wuxiaworld/novel/my-novel-name/].
            temp_name = temp_name.split('-')  #Split that into another list separated by "-" [eg: my-novel-name].
            for name in temp_name:
                novel_name = novel_name + name.capitalize() + ' '
            novel_name = novel_name[:-1]  # Remove the last ' ' from the novel name
            self.chapter_start = 1  #The number of the starting chapter is initialized.
            self.chapter_end = 0  #This number of the last chapter is initialized.
            self.chapter_current = 1  #This is stores the number of the current chapter being compiled.
            self.volume_links = []  # Empty list to store links to the chapters of each volume, one volume at a time.
            page = requests.get(link)
            soup = BeautifulSoup(page.text, 'html.parser')
            volume_list = soup.find_all(class_="panel-body")
            valid_chars = "-_.() %s%s" % (string.ascii_letters,
                                          string.digits)  # Characters allowed in a file name [Characters such as $%"" are not allowed as file names in windows]

            if volume_list == []:
                self.log.write("\nEither the link is invalid or your IP is timed out.")
                self.log.write("\nIn case of an IP timeout, it usually fixes itself after some time.")
                self.log.write("\nRaise an issue @ "
                               "https://github.com/dr-nyt/Translated-Novel-Downloader/issues if this issue persists")
            self.book = epub.EpubBook()
            self.book.set_identifier('dr_nyt')
            self.book.set_title(f"{novel_name} Vol {str(volume)} {self.chapter_start} - {self.chapter_end}")
            self.book.set_language('en')
            self.book.add_author('Unknown')
            self.chapterList = []
            # This will  only run of cover == ""
            if cover == "":
                cover = self.current_directory + '/cover.png'
                self.log.write("\n\n No cover was chosen"
                                   "\nDefault cover will be used")
            self.book.set_cover("image.jpg", open(cover, 'rb').read())
            for v in volume_list:
                chapter_links = []
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
                self.getMetaData(chapter_links[0], chapter_links[-1])

                #######
                self.getChapter()
                ################
                if volume_limit == 1:
                    self.log.write(f'\nVolume: {str(volume)} compiled!')
                    epub.write_epub(novel_name + '.epub', self.book, {})
                    break
                volume += 1
                self.log.write(f'\nVolume: {str(volume)} compiled!')
                epub.write_epub(novel_name + '.epub', self.book, {})
                self.log.write(f'\nVolume: {str(volume)} compiled!')
            self.log.write(f"\n{novel_name} has compiled")
            self.log.write(f"/n{novel_name} compiled /n saved in {os.getcwd()}")
            self.run_button.Enable()
            self.select_cover_dialog_button.Enable()
            self.select_cover_dialog_button.Enable()
            if self.remove_cover_button.IsEnabled():
                pass
            else:
                self.remove_cover_button.Enable()

        except Exception as e:
            self.log.write('\n\n Error occurred')
            self.log.write('\n\n Either the link is invalid or your IP is timed out.')
            self.log.write('\n\n In case of an IP timeout, it usually fixes itself after some time.')
            self.log.write(
                '\n\n Raise an issue @ https://github.com/dr-nyt/Translated-Novel-Downloader/issues if this issue persists')
            self.log.write(f'\n\n\n error was:\n{e}')
            self.select_cover_dialog_button.Enable()
            self.run_button.Enable()
            if self.remove_cover_button.IsEnabled():
                pass
            else:
                self.remove_cover_button.Enable()

    def getChapter(self):
        first_line = 0
        for volume in self.volume_links:
            for chapters in volume:
                page = requests.get('https://www.wuxiaworld.com' + chapters)
                soup = BeautifulSoup(page.text, 'lxml')
                story_view = soup.find(class_='p-15')
                # ISSUE the name that's used to save the .xhtml needs to have a random seed
                # make them unique even when they clash
                seed(1)
                value = randint(0, 10)
                try:
                    chapter_head = story_view.find('h4').get_text()
                    c = epub.EpubHtml(title=chapter_head, file_name=f'Chapter_{self.chapter_current}_{value}.xhtml',
                                  lang='en')
                    content = f'<h2>{chapter_head}</h2>'
                except:
                    c = epub.EpubHtml(title=f"Chapter {self.chapter_current}",
                                  file_name=f"Chapter_{self.chapter_current}.xhtml", lang='en')
                    content = f"<h2>{self.chapter_current}</h2>"
                story_view = story_view.find(class_='fr-view')
                content += story_view.prettify().replace('\xa0', ' ').replace('Previous Chapter', '').replace('Next Chapter', '')
                content += "<p> </p>"
                content += "<p>Powered by dr_nyt</p>"
                content += "<p>If any errors occur, open an issue here: github.com/dr-nyt/Translated-Novel-Downloader/issues</p>"
                content += "<p>You can download more novels using the app here: github.com/dr-nyt/Translated-Novel-Downloader</p>"

                c.content = u'%s' % content
                self.chapterList.append(c)
                self.log.write(f'\nChapter:{self.chapter_current}  {chapter_head} compiled!')
                self.chapter_current += 1
        for chap in self.chapterList:
            self.book.add_item(chap)
        self.book.toc = self.chapterList
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



    # I forgot what exactly this method does but it is something related to setting pointers to the starting and ending chapters of each volume in a novel.
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
        # for chapter in chapter_start:
        #     if chapter.isdigit():
        #         self.chapterNum_start = int(chapter)
        #         break
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
        # for chapter in chapter_end:
        #     if chapter.isdigit():
        #         self.chapterNum_end = int(chapter)
        #         break
    # wuxiaworld specific TODO Clean this up better



class MainFrame(wx.Frame):

    # the style= wx.DEFAULT_FRAME_STYLE & ~(wx.RESIZE_BORDER | wx.MAXIMIZE_BOX) makes the frame non-resizable
    def __init__(self, parent):
        wx.Frame.__init__(self, parent=parent, style=wx.DEFAULT_FRAME_STYLE & ~(wx.RESIZE_BORDER | wx.MAXIMIZE_BOX),
                          title="dr-nyt's Novel Downloader")
        panel = LaunchPanel(self)
        self.Center()
        self.Show()


class Log(object):

    def __init__(self, wxTextCtrl):
        self.out = wxTextCtrl

    def write(self, string):
        wx.CallAfter(self.out.WriteText, string)


class BookThread(threading.Thread):
    def __init__(self,book_function, which_site, **kwargs):
        threading.Thread.__init__(self)
        self.which_site = which_site
        self.url = kwargs['url']
        self.cover = kwargs['cover']
        self.min_chapter = kwargs['min_chapter']
        self.max_chapter = kwargs['max_chapter']
        self.volume = kwargs['volume']
        self.book_function = book_function
        self.start()

    def run(self):
        if self.which_site == "m.Wuxiaworld.co":
            self.book_function(self.url, self.cover)
        elif self.which_site == "Wuxiaworld.com":
            if self.volume == "":
                self.book_function(self.url, self.cover)
            else:
                self.book_function(self.url, self.cover, self.volume)
        elif self.which_site == "NovelPlanet":
            self.book_function(self.url, self.cover, self.min_chapter, self.max_chapter)



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


if __name__ == "__main__":
    app = wx.App()
    frame = MainFrame(parent=None)
    app.MainLoop()



