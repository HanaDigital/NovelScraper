/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package Sources;

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;

/**
 *
 * @author super
 */

public class WuxiaWorldLoader 
{
    private Document doc;
    
    public WuxiaWorldLoader()
    {
        try 
        {
            this.doc = Jsoup.connect("https://www.wuxiaworld.com/").get();
            Elements latest = this.doc.getElementsByClass("title");
            System.out.println(latest);
            
        } catch (IOException ex) {
            Logger.getLogger(WuxiaWorldLoader.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
}
