/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package main;

import Display.GUI;
import java.io.IOException;
import java.util.ArrayList;
import javax.swing.JFrame;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
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
    
    //This is the main function which is run on start and will be called everytime, you can use this to call and start this class itself
    public static void main(String[] args) throws IOException 
    {
//        GUI gui = new GUI();
//        gui.setVisible(true);
//        gui.setResizable(true);
        
        //Connect to the novel page
        String url = "https://www.wuxiaworld.com/novel/overgeared";
        Document doc = Jsoup.connect(url).get();
        
        //get chapter link of the volume (Currently only gets one link
        Elements volumes = doc.getElementsByClass("chapter-item");
        Elements hrefs = null;
        ArrayList<String> links = new ArrayList<String>();
        
        for(Element volume : volumes)
        {
            hrefs = volume.select("a[href]");
            break;
        }
        for(Element href : hrefs)
        {
            links.add(href.attr("href"));
        }
        
        System.out.println(links);  //print the links list
        
        //Gets the story paragraphs from the page
        for(String link : links)
        {
            url = "https://www.wuxiaworld.com" + link;
            doc = Jsoup.connect(url).get();
            Elements contents = doc.getElementsByClass("p-15");
            for(Element content : contents)
            {
                System.out.println(content.getElementsByClass("fr-view").html().replace("Next Chapter", "").replace("Previous Chapter", ""));
                break;
            }
        }
        
        
        
    }   
}
