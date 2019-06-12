import wx
import webbrowser
from bs4 import BeautifulSoup
import cfscrape
from ebooklib import epub


class NovelPlanetPanel(wx.Panel):
    def __init__(self, parent):
        wx.Panel.__init__(self, parent, id=wx.ID_ANY)
        self.chapter_range_text = wx.StaticText(self,
                                                             label="Chapter Range [optional]:")
        self.chapter_range_text.SetForegroundColour('WHITE')
        self.chapter_range_min_box = wx.TextCtrl(self, size=(40, 20))
        self.chapter_range_max_box = wx.TextCtrl(self, size=(40, 20))
        self.chapter_sizer = wx.BoxSizer(wx.HORIZONTAL)
        self.chapter_sizer.Add(self.chapter_range_text)
        self.chapter_sizer.Add(self.chapter_range_min_box, wx.ALL, 5)
        self.chapter_sizer.Add((10, 10))
        self.chapter_sizer.Add(self.chapter_range_max_box, wx.ALL, 5)
        self.SetSizer(self.chapter_sizer)

        self.book = epub.EpubBook()
        self.parent = parent
        self.msg = self.parent.msg
        self.current_directory = self.parent.current_directory

    def run(self, link, cover, chapter_start, chapter_end):
        link = link
        cover = cover
        chapter_start = chapter_start
        chapter_end = chapter_end
        self.msg("\n ************* Starting ***************")
        try:
            # Initialize connection with NovelPlanet
            scrapper = cfscrape.create_scraper()
            page = scrapper.get(link)
            soup = BeautifulSoup(page.text, 'html.parser')

            # Get Novel Name
            novel_name = soup.find(class_='title').get_text()
            # Get the html that stores links to each chapter
            chapters = soup.find_all(class_='rowChapter')

            # Get all the specified links from the html
            chapter_links = []
            for chapter in chapters:
                chapter_links.append(chapter.find('a').get('href'))
            chapter_links.reverse()  # Reverse the list so the first index will be the first chapter and so on

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
            self.msg(f"\nChapter {chapter_start}  to Chapter {chapter_end} will be compiled!")
            book = self.book
            # add metadata
            book.set_identifier('dr_nyt')
            book.set_title(novel_name)
            book.set_language('en')
            book.add_author('Unknown')
            book.add_item(default_style)
            # This will  only run of cover == ""
            if cover == "":
                cover = self.current_directory + '/cover.png'
                self.msg("\n\n No cover was chosen"
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
                    c = epub.EpubHtml(title=chapter_head, file_name=f"Chapter_{current_chapter}.xhtml", lang="en")
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
                content += "<p>If any errors occur, open an issue here: github.com/dr-nyt/Translated-Novel-Downloader/issues</p>"
                content += "<p>You can download more novels using the app here: github.com/dr-nyt/Translated-Novel-Downloader</p>"
                c.content = u'%s' % content  # Add the content to the chapter
                chapters.append(c)  # Add the chapter object to the chapter list
                self.msg(f"\nChapter: {current_chapter} compiled!")
                current_chapter += 1

            # Add each chapter object to the book
            for chap in chapters:
                chap.add_item(default_style)  # Links the css file to each chapter html page in epub
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
            self.msg(f"\n{novel_name} has compiled")
            self.msg(f"\n{novel_name} compiled /n saved in {self.current_directory}")
            self.parent.run_button.Enable()
            self.parent.log_report.Enable()
            self.parent.select_cover_dialog_button.Enable()

        except Exception as e:
            if 'Missing Node.js' in str(e):
                    self.msg("Please install nodeJS and restart the app.")
                    self.nodejsUpdate()
            else:
                self.msg('\n\n Error occurred')
                self.msg(f'\n error was:\n{str(e)}')
                self.msg('\n In case of an IP timeout, it usually fixes itself after some time.')
                self.msg('\n Raise an issue @ https://github.com/dr-nyt/Translated-Novel-Downloader/issues if this issue persists')

            self.parent.select_cover_dialog_button.Enable()
            self.parent.run_button.Enable()
            self.parent.log_report.Enable()

    def nodejsUpdate(self):
        message = "Nodejs is a dependency for downloading from NovelPlanet. Please install it and restart the app"
        dlg = wx.MessageDialog(None, message, "Nodejs Required", wx.OK | wx.ICON_EXCLAMATION)
        dlg.ShowModal()
        webbrowser.open_new(r"https://nodejs.org/en/download/")


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
