from bs4 import BeautifulSoup
from selenium import webdriver
import urllib.request
from ebooklib import epub
import string
import sys
import os
import errno
import time
import shutil

from epub_engine import EpubEngine

class WebNovel_Manga():
    def __init__(self, manga_link, storage_path, sleep_time):
        self.manga_link = manga_link
        self.storage_path = storage_path

        self.sleep_time = sleep_time
        self.current_manga_chapter = 0
        self.manga_links = []
        self.current_chapter_folder = ""

        # self.driver = webdriver.PhantomJS("assets/modules/phantomjs.exe")
        self.driver = webdriver.Chrome("assets/modules/chromedriver.exe")
        self.driver.get(manga_link)
        time.sleep(self.sleep_time)
        self.manga_name = self.driver.find_element_by_xpath('/html/body/div[1]/div[2]/div/div/div[2]/h2').text

        try:
            os.mkdir(self.storage_path + '/Novel-Library')
            self.storage_path = self.storage_path + '/Novel-Library'
        except OSError as e:
            if e.errno != errno.EEXIST:
                print("error_1")
                print("Error at directory")
                return
            else:
                self.storage_path = self.storage_path + '/Novel-Library'
        
        try:
            os.mkdir(self.storage_path + "/" + self.manga_name)
            self.manga_folder = self.storage_path + "/" + self.manga_name
        except OSError as e:
            if e.errno != errno.EEXIST:
                print("error_2")
                print("Error at directory.")
                return
            else:
                shutil.rmtree(self.storage_path + "/" + self.manga_name)
                os.mkdir(self.storage_path + "/" + self.manga_name)
                self.manga_folder = self.storage_path + "/" + self.manga_name

        self.get_manga_links()

    def get_manga_links(self):
        cover = self.driver.find_element_by_class_name("g_thumb").find_elements_by_tag_name("img")[1].get_attribute("src")
        urllib.request.urlretrieve(cover, self.manga_folder + "/cover.jpg")
        self.manga_cover_path = self.manga_folder + "/cover.jpg";

        self.driver.find_element_by_class_name("j_show_contents").click()
        time.sleep(self.sleep_time)
        link_holders = self.driver.find_element_by_class_name("volume-item").find_elements_by_class_name("c_000")
        # link_holders = self.driver.find_elements_by_xpath('//*[@id="contents"]/div/div[2]/div/ol/li[1]/a')

        for link_holder in link_holders:
            self.manga_links.append(link_holder.get_attribute("href"))
        
        self.create_manga()
        
    def create_manga(self):
        if(len(self.manga_links) == 0):
            print("No links found.")
            return

        quit = False

        epub = EpubEngine(self.manga_name, self.storage_path)
        epub.addCover(self.manga_cover_path)

        self.manga_links = self.manga_links[:3]
        
        for link in self.manga_links:
            if(quit): 
                print("Stopped.")
                break

            self.driver.get(link)
            time.sleep(self.sleep_time)
            page = self.driver.find_element_by_id("comicPageContainer")
            images = page.find_elements_by_class_name("j_comic_img")
            total_images = len(images)

            self.current_manga_chapter = self.current_manga_chapter + 1
            print('Chapter : ' + str(self.current_manga_chapter))
            print('Total Images : ' + str(total_images))

            if(total_images == 0):
                print("No more images on chapter : " + str(self.current_manga_chapter))
                break

            try:
                os.mkdir(self.manga_folder + "/Chapter_" + str(self.current_manga_chapter))
                self.current_chapter_folder = self.manga_folder + "/Chapter_" + str(self.current_manga_chapter)
            except OSError as e:
                if e.errno != errno.EEXIST:
                    print("error_4")
                    print("Error at directory.")
                    break
                else:
                    shutil.rmtree(self.manga_folder + "/Chapter_" + str(self.current_manga_chapter))
                    os.mkdir(self.manga_folder + "/Chapter_" + str(self.current_manga_chapter))
                    self.current_chapter_folder = self.manga_folder + "/Chapter_" + str(self.current_manga_chapter)

            current_image_index = 0
            maximum_image_index = total_images - 1
            missed_position = 0
            max_missed_position = 30

            position = 0
            imageSources = []
            starting_image = False

            content = ""

            while(True):
                page = self.driver.find_element_by_id("comicPageContainer")
                images = page.find_elements_by_class_name("j_comic_img")

                if(images[current_image_index].get_attribute("class") == "j_comic_img j_comic_img_first" and starting_image):
                    epub.addChapter("", self.current_manga_chapter, content)
                    print("Almost went to next chapter")
                    break

                imageSources.append(images[current_image_index].get_attribute("src"))
                imageSrc = images[current_image_index].get_attribute("src")
                
                position = position + int(images[current_image_index].get_attribute("height"))

                self.driver.execute_script("window.scrollTo(0, %s);" % str(position))
                time.sleep(0.4)
                
                try:
                    print(str(current_image_index) + " : " + images[current_image_index].get_attribute("src"))
                except Exception as e:
                    print(e)
                    print("error_5")
                    missed_position = missed_position + 1
                    if(missed_position == max_missed_position):
                        print('Timed out.')
                        quit = True
                        break
                    time.sleep(0.4)
                    continue
                    

                if(images[current_image_index]):
                    try:
                        uid = str(self.current_manga_chapter) + str(current_image_index)
                        urllib.request.urlretrieve(imageSrc, self.current_chapter_folder + "/image_" + str(current_image_index) + ".jpg")
                        epub.addImage(self.current_chapter_folder + "/image_" + str(current_image_index) + ".jpg", uid);
                        content += f'<img src="images/image_{uid}.jpeg">'
                    except Exception as e:
                        print(e)
                        print("error_6")
                        missed_position = missed_position + 1
                        if(missed_position == max_missed_position):
                            print('Timed out.')
                            quit = True
                            break
                        time.sleep(0.4)
                        continue

                    starting_image = True

                    if(current_image_index != maximum_image_index):
                        missed_position = 0
                        current_image_index = current_image_index + 1
                    else:
                        epub.addChapter("", self.current_manga_chapter, content)
                        print('finished')
                        break
                else:
                    missed_position = missed_position + 1
                    if(missed_position == max_missed_position):
                        print('Timed out.')
                        quit = True
                        break
                    else:
                        self.driver.execute_script("window.scrollTo(0, %s);" % str(position + 500))
                        time.sleep(self.sleep_time)
        
        if(quit == False):
            print("Creating EPUB")
            epub.createEpub()
        else:
            print("Not creating EPUB")



    def update_gui(self, msg):
        f = open(self.storage_path + '/' + "update","w+")
        f.write("%s" % msg)
        f.close()
    
    def get_alert(self):
        f = open(self.storage_path + '/' + "alert","r+")
        alert = f.readline()
        f.close()
        return alert

web_novel = WebNovel_Manga("https://www.webnovel.com/comic/13137125206873801/I-Swapped-Bodies-with-My-Idol!", r"C:/Users/super/Downloads", 1)