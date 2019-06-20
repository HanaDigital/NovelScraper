/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package main;

import Display.GUI;
import java.io.IOException;
import sources.WuxiaWorld;

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
        Handler handler = new Handler();
        
        handler.setGUI(handler);
        GUI gui = handler.getGUI();
        gui.setVisible(true);
        gui.setResizable(false);
    }   
}
