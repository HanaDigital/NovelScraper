<p align="center">
  	<img width="100%" src="https://user-images.githubusercontent.com/41040912/95695886-f5becc00-0c49-11eb-9f01-15d2b4e70b1c.png">
</p>

<p align="center">
  	<a href="https://github.com/HanaDigital/NovelScraper/releases"><img width="200" src="https://user-images.githubusercontent.com/41040912/95695097-80053100-0c46-11eb-8393-2f97d5f1e63c.png"></a>
	<a href="https://github.com/HanaDigital/NovelScraper/releases"><img width="200" src="https://user-images.githubusercontent.com/41040912/95696675-218f8100-0c4d-11eb-82b9-cddddbe94758.png"></a>
</p>

---

<p align="center">
	<a href="https://hanadigital.github.io/grev/?user=hanadigital&repo=novelscraper"><img src="https://img.shields.io/github/downloads/HanaDigital/NovelScraper/total.svg?style=for-the-badge"></a>
  	<a href="https://github.com/HanaDigital/NovelScraper/stargazers"><img src="https://img.shields.io/github/stars/HanaDigital/NovelScraper?style=for-the-badge"></a>
	<a href="https://github.com/HanaDigital/NovelScraper/stargazers"><img src="https://img.shields.io/github/forks/HanaDigital/NovelScraper?style=for-the-badge"></a>
	<a href="https://github.com/HanaDigital/NovelScraper/stargazers"><img src="https://img.shields.io/github/issues/HanaDigital/NovelScraper?style=for-the-badge"></a>
</p>

---

## TABLE OF CONTENTS

1. [About](#about)
2. [Featrues](#features)
3. [Contribute](#contribute)
4. [Attribution](#attribution)
5. [License](#license)

## ABOUT

_Download translated web/light novels from a list of pirate sites._  
List of supported sites:

-   [BoxNovel](https://boxnovel.com/)
-   [ReadLightNovel](https://www.readlightnovel.org/)
-   [~~NovelPlanet~~](https://novelplanet.com/) _offline_

Author: _dr-nyt_  
Version: _2.0.0_

## FEATURES

<p align="center">
	<img src="https://user-images.githubusercontent.com/41040912/95752018-74e6eb00-0cb0-11eb-8acb-2cc6fd790ffc.png">
  	<img src="https://user-images.githubusercontent.com/41040912/95752022-76181800-0cb0-11eb-9e9c-2627334b0779.png">
</p>

## CONTRIBUTE

Contributing to this project is very straight forward. This is a step-by-step guide on how to add a source to the app.

**Before getting started there are a few things that you need to be aware of:**

-   You must have a good understanding of HTML, CSS & Javascript. Knowing how to scrape websites is a plus.
-   You must also know how github works. I recommend using the [Github Desktop](https://desktop.github.com/) app for beginners.
-   This app is built on [Electron](https://www.electronjs.org/) and [Angular](https://angular.io/). These are javascript frameworks.
-   This app uses typescript, which is a superset of javascript.  
    If you have a good understanding of javascript than this shouldn't be an issue. I recommend watching this [short video on typescript](https://www.youtube.com/watch?v=ahCwqrYpIuM&ab_channel=Fireship).
-   If you get stuck, feel free to ping me on [discord](discord.gg/wya4dst).

### Prerequisites

-   Install [NodeJS](https://nodejs.org/en/download/).
-   Check the [Issues](https://github.com/HanaDigital/NovelScraper/issues) section on github to see if the source you want to add is requested.  
    If it is, then leave a comment stating that you will work on this source.  
    Otherwise, [create a new issue](https://github.com/HanaDigital/NovelScraper/issues/new/choose) and state which source you will be working on.
-   Fork this repository from [github](https://github.com/HanaDigital/NovelScraper).
-   [OPTIONAL] I recommend using [VSCode]() as your IDE.  
    If you use VScode, I suggest using the following extensions:

    -   [Angular Essentials (Version 9)](https://marketplace.visualstudio.com/items?itemName=johnpapa.angular-essentials)
    -   [Highlight](https://marketplace.visualstudio.com/items?itemName=fabiospampinato.vscode-highlight)

-   Clone the forked repository on your machine, and open a terminal at that location.
-   Run the following command to install all the dependencies:
    ```bash
    npm install
    ```
-   After all the dependencies install correctly, you can run the following to start the app in dev mode:
    ```bash
    npm start
    ```
-   Pressing `ctrl + shift + i` will toggle the debug console on the app. This is useful for error messages or if you `console.log()`

_When in dev mode, the app will use a new dev library instead of the normal library_

---

### Adding a Source

**We will assume we are adding the source [boxnovel.com](https://boxnovel.com/) to show the process**

-   Create a 150x150 png image for the source and save it in this directory `src/assets/img/sources/`.

    Boxnovel does not have a logo, so I used its initial letter to create a logo `src/assets/img/sources/boxnovel-logo.png`.  
    Here are a few examples:

<p align="center">
	<img width="200" src="https://user-images.githubusercontent.com/41040912/95757580-600e5580-0cb8-11eb-9ee9-36500f3b94a5.png">
  	<img width="200" src="https://user-images.githubusercontent.com/41040912/95757581-613f8280-0cb8-11eb-9488-9efb6997b86d.png">
	<img width="200" src="https://user-images.githubusercontent.com/41040912/95757585-61d81900-0cb8-11eb-94f8-b1eaa8b7c1c5.png">
  	<img width="200" src="https://user-images.githubusercontent.com/41040912/95757582-613f8280-0cb8-11eb-9753-d9b9a76f1aeb.png">
</p>

-   To add your source to the sourceList, open `src/app/resources/sourceList.ts` and add this line.

    ```typescript
    export const sources: sourcesList = [
    	{ name: "ReadLightNovel", link: "https://www.readlightnovel.org", icon: "assets/img/sources/readlightnovel-logo.png" },
    	...,
    	/////////////////////////////////////////  THIS LINE  ///////////////////////////////////////////
    	{ name: "BoxNovel", link: "https://boxnovel.com", icon: "assets/img/sources/boxnovel-logo.png" },
    	/////////////////////////////////////////////////////////////////////////////////////////////////
    ];
    ```

    -   `name`: Name of the source with every initial letter capitalized.
    -   `link`: Link to the source website. Make sure the link does not end with the `/` character.
    -   `icon`: This is the path to the icon you just added. The path will always start with `assets/img/sources/`.

-   So far so good, the source should now appear in the sources page of the app!

---

### Creating a Source Service

_The Source Service will handle how to scrape the novels from a source._

-   To create the service for a source we will run the following in the terminal.  
    _Note, you will only change the last part of this command and the name of the source needs to be lowercase_  
    In my case, I will run:

    ```javascript
    ng g s services/sources/boxnovel
    ```

    This will create a new file in `src/app/services/sources/` called `boxnovel.service.ts`.

-   Now we need to let the app know that this new service exists.  
    Open `src/app/services/sources/source-service-manager.service.ts`.
    -   Import the service you just created at the top of the file. In my case, I will import:
    ```typescript
    import { BoxnovelService } from "./boxnovel.service";
    ```
    -   Add the import to the construct of the class so it can access it:
    ```javascript
    constructor(..., public boxnovelService: BoxnovelService) { }
    ```
    -   In the `getService()` function, add an `else if()` statement for your source:  
        _Note, the `sourceName` must match the source name you added in the `sourceList`._
        In my case I will add:
        ```typescript
        getService(sourceName: string): sourceService {
        	...
        	...
        	else if (sourceName === "ReadLightNovel") return this.readlightnovelService;
        	/////////////////////////////////////////  THIS LINE  ///////////////////////////////////////////
        	else if(sourceName === "BoxNovel") return this.boxnovelService;
        	/////////////////////////////////////////////////////////////////////////////////////////////////
        	else return undefined;
        }
        ```
-   Now the app should be able to recognize the source service you created.

---

### Implementing a Source Service

-   Open the source service you created. In my case: `src/app/services/sources/boxnovel.service.ts`
-   Add these imports to the top of the file:
    ```typescript
    import { chapterObj, novelObj } from "app/resources/types";
    import { DatabaseService } from "../database.service";
    import { NovelFactoryService } from "../novel-factory.service";
    import { sourceService } from "./sourceService";
    ```
-   You need to extend this class to gain more functionality:
    ```typescript
    export class BoxnovelService extends sourceService {
    ```
-   Change the constructor of the class so it looks like this:
    ```javascript
    constructor(public database: DatabaseService, public novelFactory: NovelFactoryService) {
    	super(database);
    }
    ```
-   Now we just need to create three functions inside this class.

    -   `searchWIthLink`: This function will search for a novel with a given link.
    -   `searchWithName`: This function will search for a novel with a given name.
    -   `download`: The function will download the novel chapters.

    Your class should look something like this:

    ```javascript
    import { Injectable } from "@angular/core";
    import { chapterObj, novelObj } from "app/resources/types";
    import { DatabaseService } from "../database.service";
    import { NovelFactoryService } from "../novel-factory.service";
    import { sourceService } from "./sourceService";

    @Injectable({
    	providedIn: "root",
    })
    export class BoxnovelService extends sourceService {
    	constructor(public database: DatabaseService, public novelFactory: NovelFactoryService) {
    		super(database);
    	}

    	async searchWIthLink(link: string, source: string, updatingInfo: boolean): Promise<novelObj> {

    	}

    	async searchWithName(name: string, source: string): Promise<void> {

    	}

    	async download(novel: novelObj, downloadID: number): Promise<void> {

    	}
    }
    ```

### searchWithLink()

**This function will run when a user searches for a novel in this source with a link.**

-   Add the following code inside the `searchWithLink()` function:  
    **All you have to worry about is the section between `YOUR CODE STARTS HERE` and `YOUR CODE ENDS HERE`.**

    ```typescript
    async searchWIthLink(link: string, source: string, updatingInfo: boolean): Promise<novelObj> {
    	this.error = false;
    	this.searching = true;

    	let novel: novelObj = {};		// Declare novel object

    	// Check if the novel exists in the database
    	novel = this.database.getNovel(link)
    	if (novel && !updatingInfo) {
    		this.sourceNovels.unshift(novel);
    		return novel;
    	} else if (!updatingInfo) {
			novel = {};
		}

    	try {
    		const html = await this.getHtml(link);		// Get HTML from the link

    		// Link
    		if (!updatingInfo) novel.link = link;

    		// Source
    		if (!updatingInfo) novel.source = source;

    		// InLibrary
    		if (!updatingInfo) novel.inLibrary = false;	// Set as false to distinguish between novels already present

    		//////////////////////// YOUR CODE STARTS HERE ///////////////////////////////

    		// FIXME: Name
    		novel.name = html.getElementsByClassName('title')[0].textContent;

    		// FIXME: LatestChapter
    		novel.latestChapter = html.getElementsByClassName('wp-manga-chapter')[0].getElementsByTagName('a')[0].innerText.trim();

    		// FIXME: Cover
    		novel.cover = html.getElementsByClassName('summary_image')[0].getElementsByTagName('img')[0].src;

    		// FIXME: TotalChapters
    		novel.totalChapters = html.getElementsByClassName('wp-manga-chapter').length;

    		// FIXME: Author(s)
    		novel.author = html.getElementsByClassName('author-content')[0].getElementsByTagName('a')[0].text;

    		// FIXME: Genre(s)
    		novel.genre = html.getElementsByClassName('genres-content')[0].getElementsByTagName('a')[0].text;

    		// FIXME: Summary
    		novel.summary = html.getElementsByClassName('summary__content')[0].getElementsByTagName('p')[0].textContent;

    		//////////////////////// YOUR CODE ENDS HERE /////////////////////////////////

    		this.pushOrUpdateNovel(novel, updatingInfo);
    	} catch (error) {
    		console.error(error);
    		this.errorMessage = "ERROR FETCHING NOVEL";
    		this.error = true;
    	}

    	this.searching = false;
    	return novel;
    }
    ```

    -   You have access to the `html` variable. It holds the html for the novel page.

        For example if a user searched for [`https://boxnovel.com/novel/bringing-culture-to-a-different-world/`](https://boxnovel.com/novel/bringing-culture-to-a-different-world/), the `html` variable will contain the html of that page.

    -   The name of the novel on [`https://boxnovel.com/novel/bringing-culture-to-a-different-world/`](https://boxnovel.com/novel/bringing-culture-to-a-different-world/) exists in
        ```html
        <div class="post-title">
        	<h3>Bringing Culture to a Different World</h3>
        </div>
        ```
        So we change the code to look something like this:
        ```typescript
        novel.name = html.getElementsByClassName("post-title")[0].textContent;
        console.log(novel.name); // Check if you got the right name
        ```
        Continue to do this for all the remaining `novel` attributes.  
        If any of the attributes don't exist; for example if the summary doesn't exist in the page html then you can do the following:
        ```typescript
        novel.summary = "N/A";
        ```
    -   If everything works, you should now be able to find any novel using a link!

### searchWithName()

**This function will run when a user searches for a novel name.**  
This is a bit more complex than the previous function

-   Add the following code in the `searchWithName()` function:  
    **This function has multiple places where the code needs to be changed and each code block is labelled with a number.**

    ```typescript
    async searchWithName(name: string, source: string): Promise<void> {
    	this.error = false;
    	this.searching = true;

    	//////////////////////// [1] YOUR CODE STARTS HERE ///////////////////////////////

    	// FIXME: Generate the search link from novel name
    	name = encodeURI(name.replace(/ /g, '+'));	// Replace spaces in novel name to a + for creating the search link
    	const searchLink = "https://mysource.com/?s=" + name;	// Search link that will find the novels of this name

    	//////////////////////// YOUR CODE ENDS HERE /////////////////////////////////

    	const foundNovels: novelObj[] = [];	// Will store the novels found from this name

    	try {
    		const html = await this.getHtml(searchLink);
    		let novel: novelObj;
    		//////////////////////// [2] YOUR CODE STARTS HERE ///////////////////////////////

    		// FIXME: Get the list of all search result elements
    		const novelList = html.getElementsByClassName('c-tabs-item__content');

    		//////////////////////// YOUR CODE ENDS HERE /////////////////////////////////

    		for (let i = 0; i < novelList.length; i++) {
    			novel = {};

    			// Source
    			novel.source = source;

    			//////////////////////// [3] YOUR CODE STARTS HERE ///////////////////////////////

    			// FIXME: Link
    			novel.link = novelList[i].getElementsByClassName('post-title')[0].getElementsByTagName('a')[0].href;

    			// FIXME: Name
    			novel.name = html.getElementsByClassName('title')[0].textContent;

    			// FIXME: LatestChapter
    			novel.latestChapter = html.getElementsByClassName('wp-manga-chapter')[0].getElementsByTagName('a')[0].innerText.trim();

    			// FIXME: Cover
    			novel.cover = html.getElementsByClassName('summary_image')[0].getElementsByTagName('img')[0].src;

    			// FIXME: TotalChapters
    			novel.totalChapters = 0;	// If totalChapters is unknown, set it to 0 as it will not accept a string

    			// FIXME: Author(s)
    			novel.author = "unknown";

    			// FIXME: Genre(s)
    			novel.genre = "unknown";

    			// FIXME: Summary
    			novel.summary = "unknown";

    			//////////////////////// YOUR CODE ENDS HERE /////////////////////////////////

    			// Check if novel is already in the searched novel list and remove it
    			this.sourceNovels = this.sourceNovels.filter(sourceNovel => sourceNovel.link !== novel.link);

    			// Check if the novel exists in the database
    			const libNovel = this.database.getNovel(novel.link);
    			if (libNovel) {
    				foundNovels.push(libNovel);
    				continue;
    			} else {
    				foundNovels.push(novel);
    			}

    			// Source
    			novel.source = source;
    		}
    	} catch (error) {
    		console.error(error)
    		this.errorMessage = "ERROR SEARCHING FOR NOVEL";
    		this.error = true;
    	}

    	this.searching = false;
    	this.sourceNovels = [...foundNovels, ...this.sourceNovels];
    }
    ```

-   For code block `[1] YOUR CODE STARTS HERE` you have access to the novel name the user searched for.  
    You must create a search link using this name and this it's easier than you think.

    First you must check how your source website behaves when searching for a novel:

    Goto the website. In my case I will open [`https://boxnovel.com/`](https://boxnovel.com/) and search for `Martial God Asura` (or anything) in the search bar.

    BoxNovel takes me to a new page: [`https://boxnovel.com/?s=martial+god+asura&post_type=wp-manga`](https://boxnovel.com/?s=martial+god+asura&post_type=wp-manga)  
    _If your source doesn't take you to a new page then this section will not apply to you. Read the end of this section._

    This means the highlighted part of the link: `https://boxnovel.com/?s=`martial+god+asura`&post_type=wp-manga` remains constant and all we have to do is take the name the user searched for, `Martial God Asura` and convert it to `martial+god+asura` and add it to the constant search link like so:

    ```typescript
    //////////////////////// [1] YOUR CODE STARTS HERE ///////////////////////////////

    // Replace spaces in novel name to + for creating the search link
    name = encodeURI(name.replace(/ /g, "+"));
    // Search link that will find the novels of this name
    const searchLink =
    	"https://boxnovel.com/?s=" + name + "&post_type=wp-manga";

    //////////////////////// YOUR CODE ENDS HERE /////////////////////////////////
    ```

    **[ALTERNATIVE] If your source doesn't generate a new link when searching, then it is probably not possible to search with a novel name so just change the function to look like the following and skip this whole section:**

    ```typescript
    async searchWithName(name: string, source: string): Promise<void> {
    	this.errorMessage = "THIS SOURCE REQUIRES A DIRECT LINK TO THE NOVEL YOU WANT TO SEARCH";
    	this.error = true;
    }
    ```

-   For code block `[2] YOUR CODE STARTS HERE` you have access to the html of the page you just generated a link for.

    For example searching for `Martial God Asura` takes me to [`https://boxnovel.com/?s=martial+god+asura&post_type=wp-manga`](https://boxnovel.com/?s=martial+god+asura&post_type=wp-manga).

    This page has a list of novels that match the name we searched for and we need to get all of them into an array to loop over them:
    <p align="center">
    	<img src="https://user-images.githubusercontent.com/41040912/96117673-8112b880-0efb-11eb-8693-ff362cb48df8.png">
    </p>

    Each of these novels is wrapped in a div element:

    ```html
    <div class="c-tabs-item__content">...</div>
    ```

    So we just add the following line

    ```typescript
    //////////////////////// [2] YOUR CODE STARTS HERE ///////////////////////////

    // Get the list of all searched novel elements
    const novelList = html.getElementsByClassName("c-tabs-item__content");

    //////////////////////// YOUR CODE ENDS HERE /////////////////////////////////
    ```

-   For code block `[3] YOUR CODE STARTS HERE` you are inside a loop that is looping through each of the novel elements you found earlier.  
    Like you have done earlier, just fill the fields correctly like so:

    ```typescript
    //////////////////////// [3] YOUR CODE STARTS HERE ///////////////////////////////

    // FIXME: Link
    novel.link = novelList[i].getElementsByClassName("post-title")[0];

    // FIXME: Name
    novel.name = html.getElementsByClassName("title")[0].textContent;

    // FIXME: LatestChapter
    novel.latestChapter = html
    	.getElementsByClassName("chapter")[0]
    	.innerText.trim();

    // FIXME: Cover
    novel.cover = html.getElementsByTagName("img")[0].src;

    // FIXME: TotalChapters
    novel.totalChapters = 0; // If totalChapters is unknown, set it to 0 as it will not accept a string

    // FIXME: Author(s)
    novel.author = "N/A";

    // FIXME: Genre(s)
    novel.genre = "N/A";

    // FIXME: Summary
    novel.summary = "N/A";

    //////////////////////// YOUR CODE ENDS HERE /////////////////////////////////
    ```

-   Thats it! Now you should be able to search for novels with a name in the app.

### download()

**This function will download / update the novel.**

-   Add the following code to the download function:

    ```typescript
    async download(novel: novelObj, downloadID: number): Promise<void> {
    	let downloadedChapters: chapterObj[] = [];	// List of download chapters

    	try {
    		const html = await this.getHtml(novel.link);

    		//////////////////////// [1] YOUR CODE STARTS HERE ///////////////////////////////

    		// FIXME: Get the list of all chapter elements from the html
    		const chapters = html.getElementsByClassName('wp-manga-chapter');

    		// FIXME: For each element get the link to the chapter page and the name of the chapter
    		let chapterLinks = [];
    		let chapterNames = [];
    		for (let i = 0; i < chapters.length; i++) {
    			// FIXME: You will probably only need to update the lines below
    			chapterLinks.push(chapters[i].getElementsByTagName('a')[0].getAttribute('href'));
    			chapterNames.push(chapters[i].getElementsByTagName('a')[0].innerText.trim().replace(/(\r\n|\n|\r)/gm, ""));
    		}
    		// FIXME: In some cases the chapters are in descending order, we will reverse the lists to make them ascending
    		// FIXME: If your chapters are already in ascending order then remove the two lines below
    		chapterLinks.reverse();
    		chapterNames.reverse();

    		//////////////////////// YOUR CODE ENDS HERE /////////////////////////////////

    		const update = this.update(novel, chapterLinks.length);
    		if (update.startIndex === -1) {
    			this.database.cancelDownload(downloadID);
    			this.database.updateDownloading(novel.link, false);
    			return;
    		}
    		else if (update.startIndex !== 0) {
    			downloadedChapters = update.updateChapters;
    			chapterLinks = chapterLinks.slice(update.startIndex);
    			chapterNames = chapterNames.slice(update.startIndex);
    		}

    		// Download each chapter at a time
    		for (let i = 0; i < chapterLinks.length; i++) {
    			if (this.database.isCanceled(downloadID)) {
    				this.database.updateDownloading(novel.link, false);
    				console.log('Download canceled!')
    				return;
    			}

    			const html = await this.getHtml(chapterLinks[i]);

    			//////////////////////// [2] YOUR CODE STARTS HERE ///////////////////////////////

    			// FIXME: you have the html of the chapter page
    			// Get the element that wraps all the paragraphs of the chapter
    			const chapterHtml = html.getElementsByClassName('entry-content')[0];

    			//////////////////////// YOUR CODE ENDS HERE /////////////////////////////////

    			const chapterTitle = chapterNames[i];

    			let chapterBody = "<h3>" + chapterTitle + "</h3>";
    			chapterBody += chapterHtml.outerHTML;


    			const chapter = this.prepChapter(novel, downloadID, chapterTitle, chapterBody, i, chapterLinks.length);
    			downloadedChapters.push(chapter);
    		}

    		this.novelFactory.generateEpub(novel, downloadedChapters, downloadID);

    	} catch (error) {
    		this.database.cancelDownload(downloadID);
    		this.database.updateDownloading(novel.link, false);
    		console.error(error);
    	}
    }
    ```

-   For code block `[1] YOUR CODE STARTS HERE` you have the html for the novel page. You must add the novel name and link to an array.

    In my case, for boxnovel, I assume the page novel being downloaded is: [`https://boxnovel.com/novel/versatile-mage/`](https://boxnovel.com/novel/versatile-mage/)
    This page has all the novels listed like so:

    <p align="center">
    	<img src="https://user-images.githubusercontent.com/41040912/96132590-a3143700-0f0b-11eb-9452-f335e527e76d.png">
    </p>

    Each of these chapters is wrapped in a div:

    ```html
    <li class="wp-manga-chapter">
    	<a href="https://boxnovel.com/novel/versatile-mage/chapter-1565">
    		Chapter 1565 - The Living Human In The Stomach
    	</a>
    </li>

    <li class="wp-manga-chapter">
    	<a href="https://boxnovel.com/novel/versatile-mage/chapter-1565">
    		Chapter 1564 - Tearing The Medusa Apart In Rage!
    	</a>
    </li>

    <li class="wp-manga-chapter">
    	<a href="https://boxnovel.com/novel/versatile-mage/chapter-1565">
    		Chapter 1563 - Treating Everything With Contempt
    	</a>
    </li>

    ...
    ```

    So we get all of these chapter classes and get the name and link from them:

    ```javascript
    //////////////////////// [1] YOUR CODE STARTS HERE ///////////////////////////////

    // FIXME: Get the list of all chapter elements from the html
    const chapters = html.getElementsByClassName("wp-manga-chapter");

    // For each element get the link to the chapter page and the name of the chapter
    let chapterLinks = [];
    let chapterNames = [];
    for (let i = 0; i < chapters.length; i++) {
    	// FIXME: You will probably only need to update the lines below
    	chapterLinks.push(
    		chapters[i].getElementsByTagName("a")[0].getAttribute("href")
    	);
    	chapterNames.push(chapters[i].getElementsByTagName("a")[0].innerText);
    }
    // FIXME: In some cases the chapters are in descending order, we will reverse the lists to make them ascending
    // FIXME: If your chapters are already in ascending order then remove the two lines below
    chapterLinks.reverse();
    chapterNames.reverse();

    //////////////////////// YOUR CODE ENDS HERE /////////////////////////////////
    ```

    **The chapters are ordered in descending order on the page, so we reverse the array, but you may choose to not reverse the array if they are ascending be default**

-   Lastly for code block `[2] YOUR CODE STARTS HERE` you are in a loop and have the html for the current chapter page.

    In my case, I assume I'm on `Chapter 1` of `Versatile Mage` [`https://boxnovel.com/novel/versatile-mage/chapter-1`](https://boxnovel.com/novel/versatile-mage/chapter-1)

    The main html element that contains all the chapter paragraphs on this page is:

    ```html
    <div class="entry-content">
    	<p>
    		“Mo Fan, six points!” After the Math teacher—Deng Yongchuan—had said
    		this, the class began to laugh loudly. Nearly everyone turned their
    		heads around to look at the short, black-haired youth who was
    		sitting at the very back of the classroom. This youth was Mo Fan,
    		the one who only got a single-digit score on the exam.
    	</p>
    	...
    </div>
    ```

    So we just get this element like so:

    ```typescript
    //////////////////////// [2] YOUR CODE STARTS HERE ///////////////////////////////

    // FIXME: you have the html of the chapter page
    // Get the element that wraps all the paragraphs of the chapter
    const chapterHtml = html.getElementsByClassName("entry-content")[0];

    //////////////////////// YOUR CODE ENDS HERE /////////////////////////////////
    ```

-   **YOU ARE DONE!** :tada:

### Create a Pull Request

**If you know what you are doing, make sure you DON'T send the pull request to master, but the branch `version-2.0.0`.**

If you need guidance:

-   The last thing to do is create a pull request to merge the code to the main repository.
-   If you are using `Github Desktop` commit all the changes and push to origin.
-   Open your Github fork in the browser and goto the `Pull requests` section.
-   Click on `New pull request` and then make sure:
    -   `base repository: HanaDigital/Novelscraper`
    -   `base: version-2.0.0`

<p align="center">
    <img src="https://user-images.githubusercontent.com/41040912/96147162-18860480-0f18-11eb-8eef-5957a5d08b8f.png">
</p>

## ATTRIBUTION

## LICENSE

```
MIT License

Copyright (c) 2020 dr-nyt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
