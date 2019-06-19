## How to compile manually
- If you wish to manually run or change the code then you need to follow these steps.
- I will also breifely explain the logic of this project.

#### Pre-Requrements
- This project was made on Python version 3.7 (32-bit) and should work fine on most python 3 versions.
- This project uses multiple external modules:
  - beautifulsoup4
    - To parse the HTML from the webpages so it can be easily manipulated.
    - ref: https://www.crummy.com/software/BeautifulSoup/bs4/doc/
  - cfscrape
    - To bypass the cloudflare anti-bot service blocking on NovelPlanet.com
    - ref: https://pypi.org/project/cfscrape/
  - ebooklib
    - To use the parsed HTML and convert it into a .epub format.
    - ref: https://pypi.org/project/EbookLib/
  -wxpython
    - To create the GUI used by the app.
    - ref: https://wxpython.org/
    
- You can install the required modules in the cmd/terminal:
`pip install wxpython cfscrape beautifulsoup4 ebooklib`

#### Code Logic
- //TO-DO
