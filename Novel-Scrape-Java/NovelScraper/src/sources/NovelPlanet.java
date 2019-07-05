/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package sources;

import com.gargoylesoftware.htmlunit.BrowserVersion;
import com.gargoylesoftware.htmlunit.FailingHttpStatusCodeException;
import com.gargoylesoftware.htmlunit.WebClient;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import com.gargoylesoftware.htmlunit.util.Cookie;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import main.Handler;

/**
 *
 * @author dr_nyt
 */
//This is the independent class for the NovelPlanet.com source
public class NovelPlanet {
    
    //Class constructor
    public NovelPlanet(Handler handler) throws IOException
    {
        
        try {
//            try (final WebClient webClient = new WebClient(BrowserVersion.CHROME)) {
//                webClient.getOptions().setThrowExceptionOnFailingStatusCode(false);
//                String url = "https://novelplanet.com/Novel/The-Divine-Nine-Dragon-Cauldron";
//                webClient.waitForBackgroundJavaScript(10000);
//                HtmlPage htmlPage = webClient.getPage(url);
//                System.out.println(htmlPage.asText());
//            }
            ScriptEngineManager manager = new ScriptEngineManager();
            ScriptEngine engine = manager.getEngineByName("javascript");
            engine.eval("var cloudscraper = require('cloudscraper');");
            engine.eval("cloudscraper.get('https://www.wuxiaworld.com/novel/martial-god-asura').then(console.log, console.error);");
            
            
        } catch (ScriptException ex) {
            Logger.getLogger(NovelPlanet.class.getName()).log(Level.SEVERE, null, ex);
        }
        
        
    }
    
}
