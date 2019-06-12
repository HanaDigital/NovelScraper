import os
import platform
import wx
import threading
import requests
import webbrowser
from bs4 import BeautifulSoup
from wuxiaworld_co import CoWuxiaPanel
from wuxiaworld_com import WuxiaWorldPanel
from novelplanet import NovelPlanetPanel


# file dialog, used in the selection of book covers
wildcard = "Image file (*.png)" \
           "All files (*.*)|*.*"
# Version number
version = "0.7.4"
# Platforms
WINDOWS = (platform.system() == "Windows")
LINUX = (platform.system() == "Linux")
MAC = (platform.system() == "Darwin")

# The launch panel
class LaunchPanel(wx.Panel):

    def __init__(self, parent):
        wx.Panel.__init__(self, parent, id=wx.ID_ANY)
        # Check for new version
        self.SetBackgroundColour("BLACK")
        if MAC:
            self.SetForegroundColour("RED")
        else:
            self.SetForegroundColour("WHITE")
        # widget to hold the text "Enter URL:
        self.enter_url_text = wx.StaticText(self, id=wx.ID_ANY, label="Enter Url: ")
        self.enter_url_text.SetFont(
            wx.Font(10, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD, False, "Arial"))
        # widget to enter the url link
        self.url_box = wx.TextCtrl(self)
        # widget for the combo box to select from novelplanet, wuxiaworld or wuxiaco
        self.novel_websites_list = ['NovelPlanet', 'm.Wuxiaworld.co', 'Wuxiaworld.com']
        self.novel_website_box = wx.ComboBox(self, id=wx.ID_ANY, style=wx.CB_READONLY,
                                             choices=self.novel_websites_list)
        # widget for the cover page selector
        self.current_directory = os.getcwd()
        self.cover_path = ""
        self.add_cover_text = wx.StaticText(self, id=wx.ID_ANY, label="Add Cover [optional]: ")
        self.add_cover_text.SetFont(
            wx.Font(8, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD, False, "Arial"))
        self.cover_directory_box = wx.TextCtrl(self, -1, size=(200, -1))
        self.select_cover_dialog_button = wx.Button(self, label="browse")
        self.cover_sizer = wx.BoxSizer(wx.HORIZONTAL)
        self.cover_sizer.Add(self.add_cover_text, wx.ALL | wx.ALIGN_LEFT, 5)
        self.cover_sizer.Add(self.cover_directory_box, wx.ALL | wx.ALIGN_LEFT, 5)
        self.cover_sizer.Add(self.select_cover_dialog_button, wx.ALIGN_LEFT, 5)
        # Box to display progress report and status
        self.log_report = wx.TextCtrl(self, id=wx.ID_ANY, size=(600, 300),
                                      style=wx.TE_MULTILINE | wx.TE_READONLY | wx.VSCROLL | wx.TE_RICH)

        self.msg("Log:")
        # Button to run the progran
        self.run_button = wx.Button(self, label="Compile")
        self.run_button.SetFont(
            wx.Font(10, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD, False, "Arial"))
        # Sizers and arrangment
        #
        # Sizer to hold the enter_url_text and the url_box
        self.urls_sizer = wx.BoxSizer(wx.HORIZONTAL)
        self.urls_sizer.Add(self.enter_url_text, wx.ALL | wx.ALIGN_LEFT, 5)
        self.urls_sizer.Add(self.url_box, wx.ALL | wx.EXPAND, 5)
        # Sizer to hold the combo box that contains all the sources
        self.combo_sizer = wx.BoxSizer(wx.HORIZONTAL)
        self.select_source_text = wx.StaticText(self, label="Select Source: ")
        self.select_source_text.SetFont(
            wx.Font(10, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD, False, "Arial"))
        self.combo_sizer.Add(self.select_source_text, wx.ALL | wx.ALIGN_LEFT, 5)
        self.combo_sizer.Add(self.novel_website_box, wx.ALL | wx.EXPAND, 5)
        # Sizer to hold the run button that starts compiling
        self.start_sizer = wx.BoxSizer(wx.HORIZONTAL)
        self.start_sizer.Add(self.run_button, wx.ALL | wx.ALIGN_LEFT, 5)
        # Panels for novels
        self.novel_planet_panel = NovelPlanetPanel(self)
        self.wuxiaworld_panel = WuxiaWorldPanel(self)
        self.co_wuxiaworld_panel = CoWuxiaPanel(self)

        self.main_sizer = wx.BoxSizer(wx.VERTICAL)

        self.main_sizer.Add(self.combo_sizer)
        self.main_sizer.Add(self.urls_sizer)
        self.main_sizer.Add(self.cover_sizer)
        self.main_sizer.Add(self.novel_planet_panel)
        self.main_sizer.Add(self.wuxiaworld_panel)
        self.main_sizer.Add(self.co_wuxiaworld_panel)
        self.main_sizer.Add(self.start_sizer)
        self.main_sizer.Add(self.log_report, wx.ALL | wx.CENTER | wx.EXPAND, 5)
        self.SetSizer(self.main_sizer)

        # Bind Buttons and Actions

        # BIND the novel website selection,  it will allow us to show and hide the panels
        self.novel_website_box.Bind(wx.EVT_COMBOBOX, self.novel_website_panel_changer)
        # BIND the cover page selector button
        self.select_cover_dialog_button.Bind(wx.EVT_BUTTON, self.on_cover_button)
        # BIND the compile button
        self.run_button.Bind(wx.EVT_BUTTON, self.on_run)

    def novel_website_panel_changer(self, event):
        selection = event.GetEventObject()
        if selection.GetValue() == "NovelPlanet":
            self.novel_planet_panel.Show()
            self.co_wuxiaworld_panel.Hide()
            self.wuxiaworld_panel.Hide()
            self.Layout()

        elif selection.GetValue() == "Wuxiaworld.com":
            self.novel_planet_panel.Hide()
            self.co_wuxiaworld_panel.Hide()
            self.wuxiaworld_panel.Show()
            self.Layout()

        elif selection.GetValue() == "m.Wuxiaworld.co":
            self.novel_planet_panel.Hide()
            self.co_wuxiaworld_panel.Show()
            self.wuxiaworld_panel.Hide()
            self.Layout()

    def on_cover_button(self, event):
        dialog = wx.FileDialog(self, message="Choose an Image File",
                               defaultDir=self.current_directory,
                               defaultFile="",
                               wildcard=wildcard,
                               style=wx.FD_OPEN | wx.FD_CHANGE_DIR
                               )
        if dialog.ShowModal() == wx.ID_OK:
            self.cover_path = dialog.GetPath()
            self.cover_directory_box.SetValue(self.cover_path)
            self.Layout()
        dialog.Destroy()

    def on_run(self, event):
        url = self.url_box.GetValue()
        cover = self.cover_path
        # wuxiaworld.com added options
        volume = self.wuxiaworld_panel.volume_number.GetValue()
        # Novel planet added options
        min_chapter = self.novel_planet_panel.chapter_range_min_box.GetValue()
        max_chapter = self.novel_planet_panel.chapter_range_max_box.GetValue()
        kwargs = {'url': url,
                  'cover': cover,
                  'volume': volume,
                  'min_chapter': min_chapter,
                  'max_chapter': max_chapter
                  }

        which_site = self.novel_website_box.GetValue()
        # disable buttons
        self.select_cover_dialog_button.Disable()
        self.run_button.Disable()
        # Small error handling
        if which_site == "":
            self.msg("\n\n\n Please select a source.")
            self.run_button.Enable()
            self.select_cover_dialog_button.Enable()

        if which_site == "NovelPlanet":
            if 'novelplanet.com' in url:
                BookThread(self.novel_planet_panel.run, which_site=which_site, **kwargs)
            else:
                self.msg("\n\n\n Your link is invalid.")
                self.msg("\nSelect the correct source and enter a valid link.")
                self.msg("\nFor NovelPlanet.com: https://novelplanet.com/Novel/Overgeared")
                self.run_button.Enable()
                self.select_cover_dialog_button.Enable()
        if which_site == "Wuxiaworld.com":
            if 'wuxiaworld.com' in url:
                BookThread(self.wuxiaworld_panel.run, which_site=which_site, **kwargs)
            else:
                self.msg("\n\n\n Your link is invalid.")
                self.msg("\nSelect the correct source and enter a valid link.")
                self.msg("\nFor wuxiaworld.com: https://www.wuxiaworld.com/novel/overgeared")
                self.run_button.Enable()
                self.select_cover_dialog_button.Enable()
        if which_site == "m.Wuxiaworld.co":
            if 'm.wuxiaworld.co' in url:
                BookThread(self.co_wuxiaworld_panel.run, which_site=which_site, **kwargs)
            else:
                self.msg("\n\n\n Your link is invalid.")
                self.msg("\nSelect the correct source and enter a valid link.")
                self.msg("\nFor m.wuxiaworld.co: https://m.wuxiaworld.co/Reverend-Insanity/")
                self.run_button.Enable()
                self.select_cover_dialog_button.Enable()

    def msg(self, string):
        # Todo find how to properly fix the logging, disabling the log and renabling it sometimes leads to crashes
        # Enables and disables the log after writing
        #self.log_report.Enable()
        wx.CallAfter(self.log_report.WriteText, string)
        self.log_report.ShowPosition(self.log_report.GetLastPosition())  # Set the position to the bottom
        #self.log_report.Disable()  # Disable the log after writing


class BookThread(threading.Thread):
    def __init__(self, book_function, which_site, **kwargs):
        threading.Thread.__init__(self)
        self.which_site = which_site
        self.url = kwargs['url']
        self.cover = kwargs['cover']
        self.min_chapter = kwargs['min_chapter']
        self.max_chapter = kwargs['max_chapter']
        self.volume = kwargs['volume']
        self.book_function = book_function
        # Fix's the issue where onclose does not kill the background thread
        self.daemon = True
        self.start()

    def run(self):
        if self.which_site == "m.Wuxiaworld.co":
            self.book_function(self.url, self.cover)
        elif self.which_site == "Wuxiaworld.com":
            if self.volume == "":
                self.book_function(self.url, self.cover)
            else:
                self.book_function(self.url, self.cover, self.volume)
        elif self.which_site == "NovelPlanet":
            self.book_function(self.url, self.cover, self.min_chapter, self.max_chapter)

# I put it in a different thread to prevent it from freezing the UI while it's calling requests
# If there is no network, the frame does not show
class UpdateThread(threading.Thread):
    def __init__(self, parent):
        threading.Thread.__init__(self)
        self.parent = parent
        self.daemon = True
        self.start()
    def run(self):
        MainFrame.version_control(self.parent)


class MainFrame(wx.Frame):

    # the style= wx.DEFAULT_FRAME_STYLE & ~(wx.RESIZE_BORDER | wx.MAXIMIZE_BOX) makes the frame non-resizable
    def __init__(self, parent):
        wx.Frame.__init__(self, parent=parent, style=wx.DEFAULT_FRAME_STYLE & ~(wx.RESIZE_BORDER | wx.MAXIMIZE_BOX),
                          title="Nyt's Novel Downloader")
        panel = LaunchPanel(self)
        #message = wx.MessageBox("Quit program?", "Confirm",
        #                        wx.YES | wx.CANCEL,)
        UpdateThread(self)
        self.Center()
        self.Show()

    def version_control(self):
        url = "https://pastebin.com/7HUqzRGT"
        page = requests.get(url)
        soup = BeautifulSoup(page.text, 'lxml')
        checkVersion = soup.find(class_='de1')
        # TODO dr-nyt please verify if this implementation is correct
        # TODO isn't it beter to use version < checkVersion?
        if version not in checkVersion:
            dlg = wx.MessageDialog(None,"Update found, \n A new version has been found", "Update Found", wx.OK)
            dlg.ShowModal()
            webbrowser.open_new(r"https://github.com/dr-nyt/Translated-Novel-Downloader/releases")







if __name__ == "__main__":
    app = wx.App()
    frame = MainFrame(parent=None)
    app.MainLoop()

