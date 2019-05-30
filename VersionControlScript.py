import os
import requests
from bs4 import BeautifulSoup

version = "0.5"
url = 'https://pastebin.com/7HUqzRGT'
page = requests.get(url)
soup = BeautifulSoup(page.text, 'lxml')
checkVersion = soup.find(class_='de1')
if version in checkVersion:
	print("UPDATED!")

