from WuxiaScraper import WuxiaScraper
from tkinter import *

def msg(text, color='black'):
    output.insert(END, text + '\n')

def compiler():
    link = eNovel.get()
    volume = eVolume.get()
    
    if volume == '':
        volume = 0
        msg('All Volumes will be compiled.')
    else:
        msg('Only Volume: ' + volume + ' will be compiled.')

    try:
        Novel = WuxiaScraper(link, volume)
    except:
        msg('Error Occured!', 'red')
        msg('Make sure provided link or volume num is valid.', 'red')
    
    
## Window Creator
window = Tk()
window.title("Hana Novel Scraper")
window.configure(background = "black")

#Labels
Label(window, text="Novel Link: ", bg="black", fg="white", font="none 16").grid(row=0, column=0, sticky=W)

Label(window, text="Volume Num [optional]: ", bg="black", fg="white", font="none 10").grid(row=1, column=0, sticky=W)

#Entries
eNovel = Entry(window, width=75, bg="white")
eNovel.grid(row=0, column=1, sticky=W)

eVolume = Entry(window, width=5, bg="white")
eVolume.grid(row=1, column=1, sticky=W)

#Buttons
Button(window, text="Compile", width=8, command=compiler).grid(row=2, column=1, sticky=W)

#Text Boxes
output = Text(window, width=75, height=10, wrap=WORD, background="white")
output.grid(row=3, column=0, padx=5, columnspan=2, sticky=W)
output.insert(END,'LOG:\n')
