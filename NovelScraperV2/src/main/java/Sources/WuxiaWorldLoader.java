/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package Sources;

import Display.ContentPanel;
import NovelScraperV2.Handler;
import NovelScraperV2.Novel;
import com.gargoylesoftware.htmlunit.BrowserVersion;
import com.gargoylesoftware.htmlunit.WebClient;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
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
import org.jsoup.parser.Parser;
import org.jsoup.select.Elements;

/**
 *
 * @author super
 */

public class WuxiaWorldLoader 
{
    private Handler handler;
    
    private WebClient webClient;
    
    private Document doc;
    private Elements novelList;
    private String latestURL;
    
    private Image image = null;
    private Elements imageElements;
    private int contentSize;
    
    private ArrayList<ContentPanel> contentPanels = new ArrayList<ContentPanel>();
    
    private Novel novel;
    
    public WuxiaWorldLoader(Handler handler)
    {
        try 
        {
            
        this.handler = handler;
        
//        try {
//            webClient = new WebClient();
//            webClient = new WebClient(BrowserVersion.CHROME);
//            webClient.getOptions().setThrowExceptionOnScriptError(false);
//            webClient.getOptions().setJavaScriptEnabled(true);
//            webClient.waitForBackgroundJavaScript(3000);
//            HtmlPage page = webClient.getPage("https://www.wuxiaworld.com/novels");
//            System.out.println(page.asText());
//            
//        } catch (IOException ex ) {
//            ex.printStackTrace();
//        }
        
        this.doc = Jsoup.connect("https://www.wuxiaworld.com/").get().parser(Parser.xmlParser());
        
        for(Element body : this.doc.getElementsByTag("tbody"))
        {
            this.novelList = body.getElementsByTag("tr");
        }
        
//        System.out.println(this.novelList);
        this.contentSize = this.novelList.size();
        
        JPanel panel = new JPanel();
        panel.setLayout(new FlowLayout());
        panel.setBackground(new Color(2,39,87));
        panel.setPreferredSize(new Dimension(790, 185 * this.contentSize));
        panel.setAutoscrolls(true);

        JScrollPane scrollPane = new JScrollPane(panel);
        scrollPane.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
        scrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);
        scrollPane.getVerticalScrollBar().setUnitIncrement(20);
        scrollPane.setBounds(0, 0, 790, 435);
        
        for(int i = 0; i < this.contentSize; i++)
        {
            this.contentPanels.add(new ContentPanel());
            panel.add(contentPanels.get(i));
            this.handler.getGUI().getWuxiaWorldLoadingGif().setVisible(false);
            panel.repaint();
            panel.revalidate();
        }
        
        this.handler.getGUI().getWuxiaWorldContentPanel().add(scrollPane);
            
            for(int i = 0; i < this.contentSize; i++)
            {
                this.novel = new Novel();
                
                Elements items = this.novelList.get(i).getElementsByTag("td");
                novel.setNovelName(items.get(0).select("a").first().text());
                novel.setNovelURL(items.get(0).select("a").first().select("a[href]").attr("href"));
                novel.setLatestChapterName(items.get(1).text());
                novel.setTranslator(items.get(2).text());
                novel.setLastUpdateTime(items.get(3).text());
                
                this.latestURL = "https://www.wuxiaworld.com" + items.get(0).select("a[href]").attr("href");
                this.doc = Jsoup.connect(latestURL).get();
                this.imageElements = this.doc.getElementsByClass("media-object");
                URL url = new URL(imageElements.get(0).absUrl("src"));
                HttpURLConnection httpcon = (HttpURLConnection) url.openConnection(); 
                httpcon.addRequestProperty("User-Agent", "");
                this.image = ImageIO.read(httpcon.getInputStream());
                
//                
                this.novel.setNovelCover(this.image);
                this.contentPanels.get(i).setNovel(this.novel, this.handler);
            }
            
        } catch (Exception ex) {
            Logger.getLogger(WuxiaWorldLoader.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
}
