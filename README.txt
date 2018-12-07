/*
 *	Author: dr_nyt
 *	Description: This is a python based app to automatically compile and download novels from "https://www.wuxiaworld.com".
 *				       It takes the link to a specific novel [eg:"https://www.wuxiaworld.com/novel/martial-god-asura"] and converts 
 *               them to .docx files for every volume separatley.
 *	Version: 0.3
 */

/*Pre-Requisites*/
USE PYTHON 3
Make sure you have pip installed.
Install the following modules using pip:
- requests
- beautifulsoup4
- python-docx

/*Usage*/
Open the "Latest Build/" folder
Launch "run.py"
Paste the link of the novel you want [eg:"https://www.wuxiaworld.com/novel/martial-god-asura"]
Make sure the link starts with https://www.wuxiaworld.com/novel/
If you want to download all the volumes then leave the volume box empty.
If you want a specific volume, then put the volume number you want.
Click compile to let it rip! [The files will be compiled in a way that makes them easily convertable to .epub files]
You can install [calibre] from "https://calibre-ebook.com/download" to easily convert them to .epub files.

/*TO-DO*/
Add a way to add the cover page. [Its ez to do, but I'm lazy...]
Automate the calibre [.docx to .epub], using calibre modules

/*Notes*/
This is just a programme I made for fun and would love for your input,
so feel free to report any issues and I'm open to anyone who wants to improve the code :)
Also this is just educational, and I dont support piracy, nor am I responsible for anything you do with this.
