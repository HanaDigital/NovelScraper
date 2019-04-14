from tkinter import *
import tkinter.ttk
import threading
import queue
import time
from WuxiaScraper import WuxiaScraper

class Window:

    def msg(text):
        output.config(state='normal')
        output.insert(END, text + '\n')
        output.see(END)
        output.config(state='disabled')

    def compiler():
        link = eNovel.get()
        volume = eVolume.get()
        
        if volume == '':
            volume = 0
            self.msg('All Volumes will be compiled.')
        else:
            self.msg('Only Volume: ' + volume + ' will be compiled.')

        try:
            self.msg('starting...')
            Novel = WuxiaScraper(link, volume)
            self.msg('+'*20)
            self.msg('ALL DONE!')
            self.msg('+'*20)
        except:
            self.msg('+'*20)
            self.msg('Error Occured!')
            self.msg('+'*20)
            self.msg('Make sure provided link or volume num is valid.')
            self.msg('+'*20)
            self.msg('')

    def __init__(self):
        ## Window Creator
        self.root = tkinter.Tk()
        self.root.title("Hana Novel Scraper")
        self.root.configure(background = "black")

        #Labels
        Label(self.root, text="Novel Link: ", bg="black", fg="white", font="none 16").grid(row=0, column=0, sticky=W)

        Label(self.root, text="Volume Num [optional]: ", bg="black", fg="white", font="none 10").grid(row=1, column=0, sticky=W)

        #Entries
        eNovel = Entry(self.root, width=75, bg="white")
        eNovel.grid(row=0, column=1, sticky=W)

        eVolume = Entry(self.root, width=5, bg="white")
        eVolume.grid(row=1, column=1, sticky=W)

        #Buttons
        Button(self.root, text="Compile", width=8, command=self.compiler).grid(row=2, column=1, sticky=W)

        #Text Boxes
        output = Text(self.root, width=75, height=10, state='disabled', wrap=WORD, background="white")
        output.grid(row=3, column=0, padx=5, columnspan=2, sticky=W)
        #self.msg("LOG:")

        #Scroll Bars
        scroll = Scrollbar(self.root, width=10, command=output.yview)
        output.config(yscrollcommand=scroll.set)
        scroll.grid(row=3, column=1, sticky=E)
        
    def main(self):
        self.root.mainloop()


window = Window()
window.main()
