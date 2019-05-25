import os
import subprocess
import sys

def install(package):
    subprocess.call([sys.executable, "-m", "pip", "install", package])

# Example
if __name__ == '__main__':
    install('requests')
    install('beautifulsoup4')
    install('python-docx')

os.system('python WuxiaScraper.py')
