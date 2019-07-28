/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package Sources;

import Display.ContentPanel;
import NovelScraperV2.Handler;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Image;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.imageio.ImageIO;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

/**
 *
 * @author super
 */

public class WuxiaWorldLoader 
{
    private Handler handler;
    
    private Document doc;
    private ArrayList<String> latestURLs = new ArrayList<String>();
    
    public WuxiaWorldLoader(Handler handler)
    {
        this.handler = handler;
        
        try 
        {
            this.doc = Jsoup.connect("https://www.wuxiaworld.com/").get();
            Elements latest = this.doc.getElementsByClass("title");
            
            for(Element href : latest)
            {
                this.latestURLs.add("https://www.wuxiaworld.com" + href.select("a[href]").attr("href"));
            }
//          
            this.doc = Jsoup.connect(latestURLs.get(0)).get();
            Elements imageElement = this.doc.getElementsByClass("media-object");
//            
            System.out.println(imageElement.get(0).absUrl("src"));
            
            Image image = null;
            URL url = new URL(imageElement.get(0).absUrl("src"));
            HttpURLConnection httpcon = (HttpURLConnection) url.openConnection(); 
            httpcon.addRequestProperty("User-Agent", ""); 
//            URL url = new URL("https://cdn.wuxiaworld.com/images/covers/hd.jpg?ver=74da410ed2419079ded044b9bd78b7ca0c5325fc");
            image = ImageIO.read(httpcon.getInputStream());
            image = image.getScaledInstance(180, 180, Image.SCALE_FAST);
            
            JPanel p2 = new JPanel();
            p2.setLayout(new FlowLayout());
            p2.setBackground(new Color(2,39,87));
            p2.setPreferredSize(new Dimension(734, 900));
            p2.setAutoscrolls(true);

            JScrollPane scrollPane = new JScrollPane(p2);
            scrollPane.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
            scrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);
            scrollPane.getVerticalScrollBar().setUnitIncrement(20);
            scrollPane.setBounds(0, 0, 734, 400);

            this.handler.getGUI().getWuxiaWorldContentPanel().add(scrollPane);

            for(int i = 0; i < 20; i++) 
            {
                ContentPanel sp1 = new ContentPanel();
                sp1.setImage(image);
                p2.add(sp1);    
            }
            
        } catch (IOException ex) {
            Logger.getLogger(WuxiaWorldLoader.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
}
