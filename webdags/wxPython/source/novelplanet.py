import wx
import requests
from bs4 import BeautifulSoup


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
        self.Hide()
