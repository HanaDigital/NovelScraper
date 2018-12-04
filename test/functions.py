import requests
from bs4 import BeautifulSoup
import os
import zipfile


def find_between(file):
    f = open(file, "r", encoding = "utf8")
    soup = BeautifulSoup(f, 'html.parser')
    return soup.title


def download(link, file_name):
    page = requests.get(link).text
    file = open(file_name, "w", encoding="utf8")
    file.write(page)
    file.close()


def clean(file_name_in, file_name_out):
    raw = open(file_name_in, "r", encoding="utf8")
    soup = BeautifulSoup(raw, "html.parser")
    soup = soup.find(itemprop="articleBody")
    text = soup.text
    text = text.replace("Previous Chapter", "").replace("Next Chapter", "")
    text = text.lstrip().rstrip()
    chapter_title = text.split('\n', 1)[0]
    text = text.replace(chapter_title, "")
    text = text.lstrip().rstrip()
    text = text.split("\n\r")[0]
    text = text.replace("\n", "</p>\n<p>")
    raw.close()
    file = open(file_name_out, "w", encoding="utf8")
    file.write('<html xmlns="http://www.w3.org/1999/xhtml">')
    file.write("\n<head>")
    file.write("\n<title>" + chapter_title + "</title>")
    file.write("\n</head>")
    file.write("\n<body>")
    file.write("\n<strong>" + chapter_title + "</strong>" + "\n<p>")
    file.write(text)
    file.write("</p>")
    file.write("\n</body>")
    file.write("\n</html>")
    os.remove(file_name_in)


def generate(html_files, novelname, author, chapter_s, chapter_e):
    epub = zipfile.ZipFile(novelname + "_" + chapter_s + "-" + chapter_e + ".epub", "w")
    epub.writestr("META-INF/container.xml", '''<container version="1.0"
    xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
      <rootfiles>
        <rootfile full-path="OEBPS/Content.opf" media-type="application/oebps-package+xml"/>
      </rootfiles>
    </container>''')

    index_tpl = '''<package version="3.1"
    xmlns="http://www.idpf.org/2007/opf">
      <metadata>
        %(metadata)s
          </metadata>
            <manifest>
              %(manifest)s2
            </manifest>
            <spine>
              <itemref idref="toc" linear="no"/>
              %(spine)s
            </spine>
    </package>'''

    manifest = ""
    spine = ""
    metadata = '''<dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">%(novelname)s</dc:title>
      <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:ns0="http://www.idpf.org/2007/opf" ns0:role="aut" ns0:file-as="NaN">%(author)s</dc:creator>
        <meta xmlns:dc="http://purl.org/dc/elements/1.1/" name="calibre:series" content="%(series)s"/>''' \
    % {
          "novelname": novelname + ": " + chapter_s + "-" + chapter_e, "author": author, "series": novelname}
    toc_manifest = '<item href="toc.xhtml" id="toc" properties="nav" media-type="application/xhtml+xml"/>'

    for i, html in enumerate(html_files):
        basename = os.path.basename(html)
        manifest += '<item id="file_%s" href="%s" media-type="application/xhtml+xml"/>' % (
            i + 1, basename)
        spine += '<itemref idref="file_%s" />' % (i + 1)
        epub.write(html, "OEBPS/" + basename)

    epub.writestr("OEBPS/Content.opf", index_tpl % {
                  "metadata": metadata,
                  "manifest": manifest + toc_manifest,
                  "spine": spine, })

    toc_start = '''<?xml version='1.0' encoding='utf-8'?>
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
        <head>
            <title>%(novelname)s</title>
        </head>
            <body>
                <section class="frontmatter TableOfContents">
            <header>
                <h1>Contents</h1>
            </header>
                <nav id="toc" role="doc-toc" epub:type="toc">
                    <ol>
                        %(toc_mid)s
                        %(toc_end)s'''
    toc_mid = ""
    toc_end = '''</ol></nav></section></body></html>'''

    for i, y in enumerate(html_files):
        chapter = find_between(html_files[i])
        chapter = str(chapter)
        toc_mid += '''<li class="toc-Chapter-rw" id="num_%s">
        <a href="%s">%s</a>
        </li>''' % (i, html_files[i], chapter)

    epub.writestr("OEBPS/toc.xhtml", toc_start % {"novelname": novelname, "toc_mid": toc_mid, "toc_end": toc_end})
    epub.close()

    for x in html_files:
        os.remove(x)
