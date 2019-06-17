/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package main;

import Display.GUI;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import javax.swing.JFrame;
import nl.siegmann.epublib.domain.Author;
import nl.siegmann.epublib.domain.Book;
import nl.siegmann.epublib.domain.Metadata;
import nl.siegmann.epublib.domain.Resource;
import nl.siegmann.epublib.domain.TOCReference;
import nl.siegmann.epublib.epub.EpubWriter;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.safety.Whitelist;
import org.jsoup.select.Elements;

/**
 *
 * @author dr_nyt
 */
//This class is for the main GUI which will then call the classes in the sources tab. This is to keep everything clean and independant when porting to android
public class NovelScraper 
{

    /**
     * @param args the command line arguments
     */
    private String url; //Holds the url to the website
    private String chapterUrl;  //Holds the link to the current chapter being scraped
    
    private Document doc;   //Holds the scraped html from the novel home page
    private Document chapterDoc;    //Holds the scraped html from the current chapter being compiled
    
    private Elements volumes;   //Holds the html that contains all the links to the chapters
    private Elements hrefs = null;  //Holds the <href> tags which contain the links to chapters
    private ArrayList<String> links = new ArrayList<String>();  //List of links to chapters
    
    private String chapter; //Holds the html that contains the story of the chapter
    private PrintWriter chapterFile;
    
    private void getNovel() throws IOException
    {
        //Connect to the novel page
        this.url = "https://www.wuxiaworld.com/novel/overgeared";
        this.doc = Jsoup.connect(url).get();
        
        //get chapter link of the volume (Currently only gets one link
        this.volumes = this.doc.getElementsByClass("chapter-item");
        
        for(Element volume : volumes)   //This code reads similar to python: for volume in volumes
        {
            this.hrefs = volume.select("a[href]");
            break;  //stops after getting the first link
        }
        for(Element href : this.hrefs)
        {
            this.links.add(href.attr("href"));
        }
        
        System.out.println(this.links);  //print the links list
        
        //Gets the story paragraphs from the page
        for(String link : links)
        {
            this.chapterUrl = "https://www.wuxiaworld.com" + link;
            this.chapterDoc = Jsoup.connect(this.chapterUrl).get();
            Elements contents = this.chapterDoc.getElementsByClass("p-15");
            for(Element content : contents)
            {
                this.chapter = content.getElementsByClass("fr-view").html().replace("Next Chapter", "").replace("Previous Chapter", "").replace("&nbsp;", "").replace("</br>", "").replace("<br>", "");
                
                this.chapterFile = new PrintWriter("chapter1.xhtml", "UTF-8");
                this.chapterFile.println(this.getHtmlHeader("Chapter 1", "default_style.css"));
                this.chapterFile.println(Jsoup.clean(this.chapter, Whitelist.relaxed()));
                this.chapterFile.println(this.getHtmlFooter());
                this.chapterFile.close();
                break;
            }
        }
        
    }
    
    private String getHtmlHeader(String chapterName, String cssFile)
    {
        return  "<?xml version='1.0' encoding='utf-8'?>\n" +
                "<html xmlns=\"http://www.w3.org/1999/xhtml\">\n" +
                "<head>\n" +
                "<title>" + chapterName + "</title>\n" +
                "<link href=\"" + cssFile + "\" rel=\"stylesheet\" type=\"text/css\"/>\n" +
                "</head>\n" +
                "<body>";
    }
    
    private String getHtmlFooter()
    {
        return  "</body>\n" +
                "</html>";
    }
    
    private static InputStream getResource( String path ) 
    {
        return NovelScraper.class.getResourceAsStream( path );
    }
    
    private static Resource getResource( String path, String href ) throws IOException 
    {
        return new Resource( getResource( path ), href );
    }
    
    //This is the main function which is run on start and will be called everytime, you can use this to call and start this class itself
    public static void main(String[] args) throws IOException 
    {
        //        GUI gui = new GUI();
//        gui.setVisible(true);
//        gui.setResizable(true);
        
        NovelScraper ns = new NovelScraper();
        ns.getNovel();
        
        try 
        {
            // Create new Book
            Book book = new Book();
            Metadata metadata = book.getMetadata();

            // Set the title
            metadata.addTitle("Epublib test book 1");

            // Add an Author
            metadata.addAuthor(new Author("Joe", "Tester"));

            // Set cover image
            book.setCoverImage(getResource("/book1/cover.png", "cover.png"));

            // Add Chapter 1
            book.addSection("Introduction", getResource("/book1/chapter1.xhtml", "chapter1.xhtml"));

            // Add css file
            book.getResources().add(getResource("/book1/book1.css", "default_style.css"));

            // Add Chapter 2
            TOCReference chapter2 = book.addSection("Second Chapter", getResource("/book1/chapter2.html", "chapter2.xhtml"));

            // Add image used by Chapter 2
            book.getResources().add(getResource("/book1/flowers_320x240.jpg", "flowers.jpg"));

            // Add Chapter2, Section 1
            book.addSection(chapter2, "Chapter 2, section 1", getResource("/book1/chapter2_1.html", "chapter2_1.xhtml"));

            // Add Chapter 3
            book.addSection("Conclusion", getResource("/book1/chapter3.html", "chapter3.xhtml"));

            // Create EpubWriter
            EpubWriter epubWriter = new EpubWriter();

            // Write the Book as Epub
            epubWriter.write(book, new FileOutputStream("test1_book1.epub"));
        } 
        catch (Exception e) 
        {
            e.printStackTrace();
        }
        
        
        
        
        
    }   
}
