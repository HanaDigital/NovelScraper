/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package NovelScraperV2;

import Display.GUI;
import Sources.WuxiaWorldLoader;

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
        wuxiaWorldLoader = new WuxiaWorldLoader(handler);
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
