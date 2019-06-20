### About
 * Authors: dr_nyt, webdagger
 * Description: This is the re-build of the python based Novel Scraper in Java
 * Java IDLE: Netbeans 8.2 [https://netbeans.org/downloads/8.2/]
 * Currently installed Libs: 
      - jSoup [https://jsoup.org/] 
            - For HTML parsing
            - Docs: https://jsoup.org/cookbook/introduction/parsing-a-document
      - epublib [http://www.siegmann.nl/epublib]
            - For creating epub files.
            - Docs: http://www.siegmann.nl/epublib/example-programs/epub-sample-simple1
      - commonsio [https://commons.apache.org/proper/commons-io/]
            - A simple utility libraray for IO related functions
            - Docs: https://commons.apache.org/proper/commons-io/apidocs/index.html

### Project Logic
 * Currently, the project contains the following packages and classes:
      - Display [This package is designated to contain display related classes.]
      
            - GUI.java  [This class is auto-generated through the netbeans gui library,
                         and builds all of the gui frame of the app.]
            
      - main      [This package is designated to contain classes that run and maintain the connection between classes.]
      
            - NovelScraper.java      [This class is the main class of the project 
                                      that is run when the app starts.]
            - Handler.java    [This class is designed to hold an instance of each class of the project.
                               More on this below.]
            
      - rsc [This package is designated to contain the images, icons, textures etc. used by the project.]
      
      - sources   [This package is designated to contain classes used by each novel website source.]
      
            - NovelPlanet.java
            - WuxiaWorld.java
            - WuxiaWorldCo.java

 * The Handler Class:
      - This class is initially started by the main class of the project [NovelScraper.java]:
      
      ![handler-var-main](https://user-images.githubusercontent.com/41040912/59818275-42371780-9334-11e9-8f34-c46ea891381e.jpg)
      
      - The handler variable is created and will then be sent to every class in the project. This will give all classes access to the handler class.
      
      ![gui-class-constructor](https://user-images.githubusercontent.com/41040912/59818614-a4444c80-9335-11e9-8722-dca6c5264e88.jpg)
      
      ![wuxiaworld-class-constructor](https://user-images.githubusercontent.com/41040912/59818625-af977800-9335-11e9-8560-5ddf5553202c.jpg)
      
      ![wuxiaworldco-class-constructor](https://user-images.githubusercontent.com/41040912/59818628-b2926880-9335-11e9-8eb3-8792be8df47d.jpg)
      
      ![novelplanet-class-constructor](https://user-images.githubusercontent.com/41040912/59818631-b7efb300-9335-11e9-9e02-32386e00fa47.jpg)
      
      - The instance of each is class is created inside the handler class and the handler class then stores that instance as a variable.
      
      - This allows any class with access to handler be able to get any class in the project and run that classes' function methods.
            
      - For example, the wuxiaworld class can now get access to the textbox of the gui class by typing the following code:
      
      `handler.getGUI().getTextBox();`
            
      - Since handler is used to create an instance of each class, it has a variable that stores a link to each class.  
        .getGUI() is a method in the Handler class that returns the variable that stores the link to the GUI.java class 
        and .getTextBox() is a method inside the gui class that returns the variable of the textBox.
      


### Goals/Notes
 * The main goal behind this build is to lay the foundation for the final port to android.
 * The general idea behind this build is to have the sources and the gui independant of each while still maintaining their level of efficiency.
 * When working on this build, a high level of error handling and documentation must be maintained.

