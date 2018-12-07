from WuxiaScraper import WuxiaScraper
from tkinter import *

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
        msg('All Volumes will be compiled.')
    else:
        msg('Only Volume: ' + volume + ' will be compiled.')

    try:
        Novel = WuxiaScraper(link, volume)
        Novel.start()
        #bCompile.config(state='disabled')
        msg('+'*20)
        #msg('This can take ALOT of time so be patient')
        #msg('DONOT close the app until you see files created in your directory')
        #msg('+'*20)
    except:
        msg('+'*20)
        msg('Error Occured!')
        msg('+'*20)
        msg('Make sure provided link or volume num is valid.')
        msg('+'*20)
        msg('')

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
output = Text(window, width=75, height=10, state='disabled', wrap=WORD, background="white")
output.grid(row=3, column=0, padx=5, columnspan=2, sticky=W)
msg('LOG:')

#Scroll Bars
scroll = Scrollbar(window, width=10, command=output.yview)
output.config(yscrollcommand=scroll.set)
scroll.grid(row=3, column=1, sticky=E)

window.mainloop()
