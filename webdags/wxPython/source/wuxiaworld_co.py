import wx
import requests
from bs4 import BeautifulSoup


class CoWuxiaPanel(wx.Panel):
    def __init__(self, parent):
        self.current_directory = parent.current_directory
        wx.Panel.__init__(self, parent, id=wx.ID_ANY)
        self.Hide()

    def run(self, url, cover):
        link = url
        cover = cover
        if cover == "":
            cover = f'{self.current_directory}/cover.png'



