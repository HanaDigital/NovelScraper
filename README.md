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

Version: _2.0.0_  
Author: _dr-nyt_

## FEATURES

<p align="center">
	<img src="https://user-images.githubusercontent.com/41040912/95752018-74e6eb00-0cb0-11eb-8acb-2cc6fd790ffc.png">
  	<img src="https://user-images.githubusercontent.com/41040912/95752022-76181800-0cb0-11eb-9e9c-2627334b0779.png">
</p>

## CONTRIBUTE

Contributing to this project is very straight forward. This is a step-by-step guide on how to add a source to the app.

**Before getting started there are a few things that you need to be aware of:**

-   You must have a good understanding of HTML, CSS & Javascript. Knowing how to scrape websites is a plus.
-   You must also know how github works. I recommend using the [Github Desktop]() app for beginners.
-   This app is built on [Electron]() and [Angular](). These are javascript frameworks.
-   This app uses typescript, which is a superset of javascript.  
    If you have a good understanding of javascript than this shouldn't be an issue. I recommend watching this [short video on typescript]().
-   If you get stuck, feel free to ping me on [discord]().

### Prerequisites

-   Install [NodeJS]().
-   Check the [Issues]() section on github to see if the source you want to add is requested.  
    If it is, then leave a comment stating that you will work on this source.  
    Otherwise, [create a new issue]() and state which source you will be working on.
-   Fork this repository on [github](https://github.com/HanaDigital/NovelScraper).
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

_When in dev mode, the app will use a new dev library instead of the normal library_

---

### Adding a Source

**We will assume we are adding the source [boxnovel.com]() to show the process**

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

-   Lastly we need to fill out these functions

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
