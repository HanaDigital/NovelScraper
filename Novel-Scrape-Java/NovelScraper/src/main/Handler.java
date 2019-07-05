/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package main;

import Display.GUI;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import sources.NovelPlanet;
import sources.WuxiaWorld;
import sources.WuxiaWorldCo;

/**
 *
 * @author super
 */
public class Handler {
    
    private GUI gui;
    private WuxiaWorld wuxiaWorld;
    private NovelPlanet novelPlanet;
    private WuxiaWorldCo wuxiaWorldCo;
    
    public void setWuxiaWorld(String url, String cover, int volumeNumber, Handler handler)
    {
        Thread thread = new Thread(new Runnable() 
        {

            @Override
            public void run() 
            {
                try 
                {
                    wuxiaWorld = new WuxiaWorld(url, cover, volumeNumber, handler);
                } catch (Exception ex) 
                {
                    Logger.getLogger(Handler.class.getName()).log(Level.SEVERE, null, ex);
                    Handler.this.logError(ex.toString());
                }
                
                Handler.this.gui.unLock();
            }

        });

        thread.start();
    }
    
    public void setNovelPlanet(String url, String cover, int volumeNumber, Handler handler) throws IOException
    {
        this.novelPlanet = new NovelPlanet(handler);
    }
    
    public void setWuxiaWorldCo(String url, String cover, int volumeNumber, Handler handler)
    {
        this.wuxiaWorldCo = new WuxiaWorldCo(handler);
    }
    
    public void setGUI(Handler handler)
    {
        gui = new GUI(handler);
    }
    
    public GUI getGUI() {
        return gui;
    }
    
    public void log(String text)
    {
        gui.log(text);
    }
    
    public void logError(String text)
    {
        gui.logError(text);
    }
    
    public WuxiaWorld getWuxiaWorld() {
        return wuxiaWorld;
    }

    public NovelPlanet getNovelPlanet() {
        return novelPlanet;
    }

    public WuxiaWorldCo getWuxiaWorldCo() {
        return wuxiaWorldCo;
    }
}
