/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package NovelScraperV2;

import Display.GUI;
import Sources.WuxiaWorldLoader;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author ASUS
 */
public class Handler 
{
    private Handler handler;
    private GUI gui;
    private WuxiaWorldLoader wuxiaWorldLoader;
    
    public void setHandler(Handler handler)
    {
        this.handler = handler;
    }
    
    public void setGUI()
    {
        this.gui = new GUI();
        this.gui.setHandler(handler);
        this.gui.setVisible(true);
    }
    
    public void setWuxiaWorldLoader()
    {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    wuxiaWorldLoader = new WuxiaWorldLoader(handler);
                } catch (Exception ex) {
                    Logger.getLogger(Handler.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        });

        thread.start();
    }
    
    public void getWuxiaWorldNewContent()
    {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    wuxiaWorldLoader.loadNewContent();
                } catch (Exception ex) {
                    System.out.println(ex.toString());
                    Logger.getLogger(Handler.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        });

        thread.start();
    }
    
    public GUI getGUI()
    {
        return this.gui;
    }
    
    public WuxiaWorldLoader getWuxiaWorldLoader()
    {
        return wuxiaWorldLoader;
    }
    
}
