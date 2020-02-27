from bs4 import BeautifulSoup
import cloudscraper
from ebooklib import epub

scrapper = cloudscraper.create_scraper()
page = scrapper.get("https://novelplanet.com/Novel/Soudana-Tashika-ni-Kawaii-Na/v1c4?id=925488")
soup = BeautifulSoup(page.text, 'html.parser')
print(soup)