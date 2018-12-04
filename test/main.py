import functions

info = {"link": "http://www.wuxiaworld.com/emperor-index/emperor-chapter-",
    "ChapterName": "emperor-chapter-",
    "NovelName": "Emperor's Domination",
    "author": "Yan Bi Xiao Sheng, Bao"}

starting_chapter = input("What chapter do you want to start at?: ")
ending_chapter = input("Till what chapter do you want to read?: ")

link_list = []
for s in range(int(starting_chapter), int(ending_chapter) + 1):
    link_list.append(info["link"] + str(s))

name_counter = int(starting_chapter)
file_list = []
for x in range(len(link_list)):
    functions.download(link_list[x], str(x) + ".html")
    functions.clean(str(x) + ".html", info["ChapterName"] + str(name_counter) + ".xhtml")
    file_list.append(info["ChapterName"] + str(name_counter) + ".xhtml")
    name_counter += 1

functions.generate(file_list, info["NovelName"], info["author"], starting_chapter, ending_chapter)
