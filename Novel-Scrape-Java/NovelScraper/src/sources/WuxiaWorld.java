/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package sources;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import main.Handler;
import nl.siegmann.epublib.domain.Author;
import nl.siegmann.epublib.domain.Book;
import nl.siegmann.epublib.domain.Metadata;
import nl.siegmann.epublib.domain.Resource;
import nl.siegmann.epublib.epub.EpubWriter;
import org.apache.commons.io.FileUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.safety.Whitelist;
import org.jsoup.select.Elements;

/**
 *
 * @author super
 */
//This is the independent class for the WuxiaWorld.com source
public class WuxiaWorld 
{
    
    
    //Declare Variables
    private Handler handler;
    
    private static final String cwd = System.getProperty("user.dir");  //Current working directory
    
    private String novelName; //Holds the name of the novel
    
    private String cover;
    
    private int volumeLimit;    //Defines wether only one or multiple volumes will be compiled
    private int volumeNumber;   //Holds the volume number, (if) defined by the user
    private int volumeCurrentNumber;    //Keeps track of the current volume number
    
    private String url; //Holds the url to the website
    private String chapterUrl;  //Holds the link to the current chapter being scraped
    
    private Document doc;   //Holds the scraped html from the novel home page
    private Document chapterDoc;    //Holds the scraped html from the current chapter being compiled
    
    private Elements volumesHtml;   //Holds the html that contains all the links to the chapters
    private Elements hrefs = null;  //Holds the <href> tags which contain the links to chapters
    private ArrayList<String> links = new ArrayList<String>();  //List of links to chapters
    
    private String chapter; //Holds the html that contains the story of the chapter
    private PrintWriter chapterFile;    //Creates and writes to the current chapter html file
    
    private String chapterStartNumber;  //Holds the chapter number of the first chapter in the volume
    private String chapterEndNumber;    //Holds the chapter number of the last chapter in the volume
    private int chapterCurrentNumber;   //Tracks the current chapter number
    
    private String chapterHead; //Holds the chapter title

    
    //Class constructor
    public WuxiaWorld(String url, String cover, int volumeNumber, Handler handler) throws IOException
    { 
        this.url = url;
        this.cover = cover;
        this.volumeNumber = volumeNumber;
        this.handler = handler;
        
        //Configure volume number settings
        if(this.volumeNumber != 0)
        {
            this.volumeLimit = 1;
            this.volumeCurrentNumber = this.volumeNumber;
        }
        else
        {
            this.volumeLimit = 0;
            this.volumeCurrentNumber = 1;
        }
        
        this.cleanUp();
        this.getLinks();    //Gets all the chapter links and stores them
        this.getMetaData(this.links.get(0), this.links.get(this.links.size() - 1)); //Sets the starting, current
        this.makeChapterFiles();
        this.makeBook();
    }

    
    private void getLinks() throws IOException
    {
        //Connect to the novel page
        this.doc = Jsoup.connect(this.url).get();
        
        //get chapter link of the volume (Currently only gets one link
        this.volumesHtml = this.doc.getElementsByClass("panel-body");
        
        for(Element volume : this.volumesHtml)   //This code reads similar to python: for volume in volumes
        {      
            //Skip over volumes if a specific volume is defined
            if(this.volumeNumber != 1 && this.volumeLimit == 1)
            {
                this.volumeNumber--;
                continue;
            }
                  
            this.hrefs = volume.getElementsByClass("chapter-item");
            
            for(Element href : this.hrefs)
            {
                this.links.add(href.select("a[href]").attr("href"));
            }
            
            if(volumeLimit == 1)
            {
                break;
            }
        }
        
        if(this.links.isEmpty())
        {
            this.logError("Either the volume number isn't correct or there is a connection problem!");
            return;
        }
    }
    
    private void getMetaData(String startLink, String endLink)
    { 
        //Set the novel name
        this.novelName = "";
        String tempName = this.url.split("/")[4];  //Split the link of the website into a list separated by "/" and get the 4th index [eg: http://wuxiaworld/novel/my-novel-name/].
        String[] tempNameSplit = tempName.split("-");  // Split that into another list separated by "-" [eg: my-novel-name].
        for(String name : tempNameSplit)
        {
            this.novelName = this.novelName + name.substring(0, 1).toUpperCase() + name.substring(1) + ' ';
        }
        this.novelName = this.novelName.substring(0, this.novelName.length() - 1);  // Remove the last ' ' from the novel name
        
        //Set the starting chapter number
        ArrayList<String> metaData = new ArrayList<String>();
        int index;
        
        String[] partsX = startLink.split("/");
        for(String parts : partsX)
        {
            if(!parts.equals("") && !parts.equals("novel"))
            {
                metaData.add(parts);
            }
        }
        
        String[] chapterStart = metaData.get(1).split("-");
        index = chapterStart.length - 1;
        while(index >= 0)
        {
            try
            {
                Integer.parseInt(chapterStart[index]);
                this.chapterStartNumber = chapterStart[index];
                this.chapterCurrentNumber = Integer.parseInt(chapterStart[index]);
                break;
            } catch(NumberFormatException e)
            {
                this.logError(e.toString());
            }
            index--;
        }
        
        //Set the last chapter number
        metaData = new ArrayList<String>();
        
        String[] partsY = endLink.split("/");
        for(String parts : partsY)
        {
            if(!parts.equals("") && !parts.equals("novel"))
            {
                metaData.add(parts);
            }
        }
        
        String[] chapterEnd = metaData.get(1).split("-");
        index = chapterEnd.length - 1;
        while(index >= 0)
        {
            try
            {
                Integer.parseInt(chapterEnd[index]);
                this.chapterEndNumber = chapterEnd[index];
                break;
            } catch(NumberFormatException e)
            {
                this.logError(e.toString());
            }
            index--;
        }
    }
    
    private void makeChapterFiles() throws FileNotFoundException, UnsupportedEncodingException, IOException
    {
        //Create a folder to store novel
        File file = new File(this.novelName);
        if (!file.exists()) 
        {
            if (file.mkdir()) 
            {
                this.log("Novel directory created!");
            } else 
            {
                this.logError("Failed to create novel directory!");
                return;
            }
        }

        //Create a temporary folder to store html files
        file = new File(this.novelName + "/temp");
        if (!file.exists()) 
        {
            if (file.mkdir()) 
            {
                this.log("Temp directory created!");
            } else 
            {
                this.logError("Failed to create temp directory!");
                return;
            }
        }
        
        //Gets the story paragraphs from the page and create their html
        for(String link : this.links)
        {
            this.chapterUrl = "https://www.wuxiaworld.com" + link;
            this.chapterDoc = Jsoup.connect(this.chapterUrl).get();
            Elements contents = this.chapterDoc.getElementsByClass("p-15");
            
            for(Element content : contents)
            {
                try
                {
                    this.chapterHead = content.select("h4").text();
                } catch(Exception e)
                {
                    this.chapterHead = "Chapter " + Integer.toString(this.chapterCurrentNumber);
                }
                this.chapter = content.getElementsByClass("fr-view").html();
                this.chapter = Jsoup.clean(this.chapter, Whitelist.relaxed());
                this.chapter = this.chapter.replace("Next Chapter", "").replace("Previous Chapter", "").replace("&nbsp;", "").replace("</br>", "").replace("<br>", "<br></br>");
                
                this.chapterFile = new PrintWriter(this.novelName + "/temp/chapter" + Integer.toString(this.chapterCurrentNumber) + ".xhtml", "UTF-8");
                this.chapterFile.println(this.getHtmlHeader(this.chapterHead, "default_style.css"));
                this.chapterFile.println(this.chapter);
                this.chapterFile.println(this.getPropaganda());
                this.chapterFile.println(this.getHtmlFooter());
                this.chapterFile.close();
                this.log("Added: " + this.chapterHead);
                this.chapterCurrentNumber++;
                break;
            }
        }
        this.chapterCurrentNumber = Integer.parseInt(this.chapterStartNumber);
    }
    
    private void makeBook()
    {
        try 
        {
            // Create new Book
            Book book = new Book();
            Metadata metadata = book.getMetadata();

            // Set the title
            metadata.addTitle(this.novelName);

            // Add an Author
            metadata.addAuthor(new Author("Unknown", "Unknown"));

            // Set cover image
            book.setCoverImage(getResource(this.cover, "cover.png"));

            // Add Chapters
            while(this.chapterCurrentNumber <= Integer.parseInt(this.chapterEndNumber))
            {
                book.addSection("Chapter " + Integer.toString(this.chapterCurrentNumber), getResource(this.novelName + "/temp/chapter" + this.chapterCurrentNumber + ".xhtml", "chapter" + this.chapterCurrentNumber + ".xhtml"));
                this.chapterCurrentNumber++;
            }

            // Add css file
            book.getResources().add(new Resource(getClass().getResourceAsStream("/rsc/default_style.css"), "default_style.css"));

            // Create EpubWriter
            EpubWriter epubWriter = new EpubWriter();

            // Write the Book as Epub
            epubWriter.write(book, new FileOutputStream(this.novelName + "/" + this.novelName + " Vol." + this.volumeNumber + "-" + this.volumeCurrentNumber + ".epub"));
            
            this.log("Your ebook " + this.novelName + " from WuxiaWorld was written to the " + this.novelName + "/ folder.");
            this.log("You can delete the temp/ folder inside the " + this.novelName + "/ folder.");
            this.log("You can support us on our discord: https://discord.gg/Wya4Dst");
            
            this.handler.getGUI().getWuxiaWorldRunButton().setEnabled(true);
            this.handler.getGUI().getWuxiaWorldCoverButton().setEnabled(true);
        } 
        catch (Exception e) 
        {
            this.logError(e.toString());
        }
    }
    
    private void cleanUp() throws IOException
    {
        File folder = new File(this.novelName + "/temp");
        FileUtils.deleteDirectory(folder);
    }
    
    private String getHtmlHeader(String chapterName, String cssFile)
    {
        return  "<?xml version='1.0' encoding='utf-8'?>\n" +
                "<html xmlns=\"http://www.w3.org/1999/xhtml\">\n" +
                "<head>\n" +
                "<title>" + chapterName.replace("<", "&lt;").replace(">", "&gt;") + "</title>\n" +
                "<link href=\"" + cssFile + "\" rel=\"stylesheet\" type=\"text/css\"/>\n" +
                "</head>\n" +
                "<body>\n" +
                "<h2>" + chapterName.replace("<", "&lt;").replace(">", "&gt;") + "</h2>";
    }
    
    private String getPropaganda()
    {
        return  "<p> </p>\n" +
                "<p>Support us by joining our discord: https://discord.gg/Wya4Dst</p>\n" +
                "<p>If any errors occur, open an issue here: github.com/dr-nyt/Translated-Novel-Downloader/issues</p>\n" +
                "<p>You can download more novels using the app here: github.com/dr-nyt/Translated-Novel-Downloader</p>";
    }
    
    private String getHtmlFooter()
    {
        return  "</body>\n" +
                "</html>";
    }
    
    private static InputStream getResource( String path ) throws FileNotFoundException 
    {
        return new FileInputStream( path );
    }
    
    private static Resource getResource( String path, String href ) throws IOException 
    {
        return new Resource( getResource( path ), href );
    }
    
    private void log(String text)
    {
        this.handler.log(text);
    }
    
    private void logError(String text)
    {
        this.handler.logError(text);
    }
}
