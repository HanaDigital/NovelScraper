import os
import shutil
import zipfile

class EpubEngine(object):

    def __init__(self, volumeName):
        self.epub = zipfile.ZipFile(volumeName + ".epub", "w")

    def meta_inf(self):
        self.epub.writestr("META-INF/container.xml", '''<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
   <rootfiles>
      <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
      
   </rootfiles>
</container>''')

        self.epub.writestr("calibre_bookmarks.txt", "calibre_current_page_bookmark*|!|?|*0*|!|?|*0.0")

    def content(self):
        self.epub.writestr()
    
