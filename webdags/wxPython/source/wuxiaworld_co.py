import wx
import requests
from bs4 import BeautifulSoup


class CoWuxiaPanel(wx.Panel):
    def __init__(self, parent):
        wx.Panel.__init__(self, parent, id=wx.ID_ANY)
        self.Hide()
