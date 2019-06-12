import wx
import requests
from bs4 import BeautifulSoup


class WuxiaWorldPanel(wx.Panel):
    def __init__(self, parent):
        wx.Panel.__init__(self, parent, id=wx.ID_ANY)
        self.volume_number = wx.TextCtrl(self, size=(40, 20))
        self.volume_text = wx.StaticText(self, label="Volume Num [optional]:")
        self.volume_text.SetForegroundColour('WHITE')
        self.volume_sizer = wx.BoxSizer(wx.HORIZONTAL)
        self.volume_sizer.Add(self.volume_text)
        self.volume_sizer.Add(self.volume_number)
        self.SetSizer(self.volume_sizer)
        self.Hide()

        self.chapter_start = None  # The number of the starting chapter is initialized.
        self.chapter_end = None  # This number of the last chapter is initialized.
        self.chapter_current = None  # This is stores the number of the current chapter being compiled.
        self.volume_links = None
        self.chapterList = None
