from ebooklib import epub
import string
import os
import time
from PIL import Image
import io

class EpubEngine():
    def __init__(self, novel_name, storage_path):
        self.novel_name = novel_name
        self.storage_path = storage_path

        self.book = epub.EpubBook()
        # add metadata
        self.book.set_identifier('dr_nyt')
        self.book.set_title(novel_name)
        self.book.set_language('en')
        self.book.add_author('Unknown')
        self.book.add_item(default_style)

        self.chapters = []

    def addCover(self, coverPath):
        self.book.set_cover("image.jpg", open(coverPath, 'rb').read())
    
    def addChapter(self, chapter_header, chapter_number, content):
        chap = epub.EpubHtml(title=chapter_header, file_name=f"Chapter_{chapter_number}.xhtml", lang="en")

        content += '<div id="propoganda">'
        content += "<p>This novel was downloaded using NovelScraper</p>"
        content += "<p>Support us or report issues by joining our discord: https://discord.gg/Wya4Dst</p>"
        content += "</div>"

        chap.content = u'%s' % content
        self.chapters.append(chap)
    
    def addImage(self, file_path, uid):
        # load Image file
        image = Image.open(file_path)
        byte = io.BytesIO()
        image.save(byte, 'jpeg')
        byte_image = byte.getvalue()

        image_item = epub.EpubItem(uid='image_' + uid, file_name='images/image_' + uid + '.jpeg', media_type='image/jpeg', content=byte_image)
        self.book.add_item(image_item)
        
    def createEpub(self):
        # Add each chapter object to the book
        for chap in self.chapters:
            chap.add_item(default_style)  # Links the css file to each chapter html page in epub
            self.book.add_item(chap)
        
        # Give the table of content the list of chapter objects
        self.book.toc = (self.chapters)
        # add navigation files
        self.book.add_item(epub.EpubNcx())
        self.book.add_item(epub.EpubNav())

        # add css file
        nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css", content=style)
        self.book.add_item(nav_css)

        # create spine, add cover page as first page
        self.book.spine = ['cover', 'nav'] + self.chapters

        #Make a valid file name using novel name and chapter information
        valid_chars = "-_.() %s%s" % (string.ascii_letters, string.digits)  #Characters allowed in a file name [Characters such as $%"" are not allowed as file names in windows]

        file = self.novel_name  + '.epub'
        file = ''.join(c for c in file if c in valid_chars)

        # folder = ''.join(c for c in self.novel_name if c in valid_chars)

        #check if the folder exists or not
        # if not os.path.exists(self.storage_path):
        #     os.mkdir(self.storage_path + '/' + folder)

         # create epub file
        epub.write_epub(self.storage_path + '/' + file, self.book, {})
        print("Wrote Epub to: " + self.storage_path + '/' + file)

        

style = '''
        * {
            margin: 0
            padding: 0
        }

        @namespace epub "http://www.idpf.org/2007/ops";
        body {
            font-family: Cambria, Liberation Serif, Bitstream Vera Serif, Georgia, Times, Times New Roman, serif;
        }

        img {
            width: 100%;
            height: auto;
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

        #propoganda {
            text-align: center;
            margin-top: 10px;
            margin-bottom: 10px;
        }
        '''
default_style = epub.EpubItem(uid="style_default", file_name="style/default.css", media_type="text/css", content=style)

# for i in range(10):
#     f = open("../../test.txt","w+")
#     f.write("%s" % i)
#     f.close()
#     time.sleep(1)