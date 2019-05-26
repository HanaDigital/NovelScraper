import os
import shutil
import zipfile
from ebooklib import epub

class EpubEngine(object):

    def __init__(self, author, bookName):
      self.book = epub.EpubBook()
      self.book.set_identifier('dr_nyt')
      self.book.set_title(bookName)
      self.book.set_language('en')
      self.book.add_author(author)
      self.chapters = []
      self.index = 0

    def addCover(self, cover):
      self.book.set_cover("image.jpg", open("rsc/" + cover, 'rb').read())

    def addChapter(self, _title, _fileName, chapter):
        chapter = epub.EpubHtml(title=_title, file_name=_fileName + '.xhtml', lang='en')
        chapter.content=u'%s' %  chapter
        self.chapters.append(chapter)
        self.book.add_item(self.chapters[self.index])
        self.index += 1

    def addTOC(self):
      self.book.toc = (self.chapters)

    def style(self):
      self.book.add_item(epub.EpubNcx())
      self.book.add_item(epub.EpubNav())

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
      self.book.add_item(nav_css)

      # create spin, add cover page as first page
      self.book.spine = ['image.jpg', 'nav'] + self.chapters

    def writeBook(self, volumeName):
      epub.write_epub(volumeName + '.epub', self.book, {})