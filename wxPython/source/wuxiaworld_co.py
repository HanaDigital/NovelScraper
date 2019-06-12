import wx
import requests
from bs4 import BeautifulSoup
from ebooklib import epub


class CoWuxiaPanel(wx.Panel):
    def __init__(self, parent):
        wx.Panel.__init__(self, parent, id=wx.ID_ANY)
        self.parent = parent
        self.msg = self.parent.msg
        self.current_directory = self.parent.current_directory
        self.Hide()

    def run(self, url, cover):
        link = url
        cover = cover
        if cover == "":
            cover = f'{self.current_directory}/cover.png'
            self.msg("\n\n No cover was chosen \nDefault cover will be used")
        try:
            self.msg("\n\n\n ***** Starting *****")
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
            self.msg(f"\n\n The novel being compiled is {novel_name}")
            # Luckily appending /all.html to wuxia.co/novel-name gives a page with all html links
            real_url = link + "/all.html/"
            # TODO reliably handle network failiure to avoid redownloading novel
            page = requests.get(real_url)
            soup = BeautifulSoup(page.text, 'html.parser')

            # Fetch the book
            # My approach is to get all <p> tags since they carry the <a> links we need
            chapter_dictionaries = []  # This dictionary would have the format of ({"chapter_number chapter_name": "link_to")
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
            book.add_item(default_style)
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
                story = f"<h2>{chapter_name}</h2><br/><p>" + str(story_text) + "</p><br/>"
                try:
                    chap = epub.EpubHtml(title=chapter_name, file_name=temp_link + '.xhtml', lang='en')
                    content = story
                except:
                    chap = epub.EpubHtml(title=chapter_name, file_name=temp_link + '.xhtml', lang='en')
                    content = story
                chap.content = u'%s' % content
                chapterList.append(chap)
                self.msg(f"\n Added {chapter_name}")

            for chapter in chapterList:
                chapter.add_item(default_style) #Links the css file to each chapter html page in epub
                book.add_item(chapter)
            book.toc = (chapterList)
            # add navigation files
            book.add_item(epub.EpubNcx())
            book.add_item(epub.EpubNav())

            # add css file
            nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css", content=style)
            book.add_item(nav_css)

            # create spin, add cover page as first page
            book.spine = ['cover', 'nav'] + chapterList
            epub.write_epub(novel_name + '.epub', book, {})
            self.msg(f"\n{novel_name} compiled!  \nSaved in {self.current_directory}")
            self.parent.run_button.Enable()
            self.parent.log_report.Enable()
            self.parent.select_cover_dialog_button.Enable()
        except Exception as e:
            self.msg('\n\n *********Error occurred**********')
            self.msg(f'\n error was:\n{str(e)}')
            self.msg('\n In case of an IP timeout, it usually fixes itself after some time.')
            self.msg(
                '\n Raise an issue @ https://github.com/dr-nyt/Translated-Novel-Downloader/issues if this issue persists')

            self.parent.select_cover_dialog_button.Enable()
            self.parent.run_button.Enable()
            self.parent.log_report.Enable()




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
