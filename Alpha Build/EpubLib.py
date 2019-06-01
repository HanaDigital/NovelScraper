# coding=utf-8

from ebooklib import epub
import cfscrape
import requests
from bs4 import BeautifulSoup

if __name__ == '__main__':
    book = epub.EpubBook()

    # add metadata
    book.set_identifier('sample123456')
    book.set_title('Sample book')
    book.set_language('en')

    book.add_author('Aleksandar Erkalovic')

    # add cover image
    book.set_cover("image.jpg", open('cover.jpeg', 'rb').read())

    chapters = []

    scraper = cfscrape.create_scraper()
    page = scraper.get('https://novelplanet.com/Novel/Overgeared/c2?id=270678')
    soup = BeautifulSoup(page.text, 'lxml')
    paras = soup.find(id="divReadContent").find_all('p')

    content = ''
    for para in paras:
        content += para.prettify()

    # intro chapter
    c = epub.EpubHtml(title='Chapter 2', file_name='Chapter_2.xhtml', lang='en')
    c.content=u'%s' % content
    chapters.append(c)
    # about chapter
    c = epub.EpubHtml(title='About this book', file_name='about.xhtml')
    c.content='<h1>About this book</h1><p>Helou, this is my book! There are many books, but this one is mine.</p><p><img src="image.jpg" alt="Cover Image"/></p>'
    chapters.append(c)
    # add chapters to the book
    for chap in chapters:
        book.add_item(chap)
    
    # create table of contents
    # - add manual link
    # - add section
    # - add auto created links to chapters

    book.toc = (chapters)

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
    book.spine = ['cover', 'nav'] + chapters

    # create epub file
    epub.write_epub('Overgeared.epub', book, {})