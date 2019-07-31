/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package NovelScraperV2;

import java.awt.Image;

/**
 *
 * @author ASUS
 */
public class Novel 
{
    
    private String novelName;
    private String novelURL;
    private Image novelCover;
    private String latestChapterName;
    private String author;
    private String Translator;
    private String lastUpdateTime;

    public String getNovelName() {
        return this.novelName;
    }

    public void setNovelName(String novelName) {
        this.novelName = novelName;
    }
    
    public String getNovelURL()
    {
        return this.novelURL;
    }
    
    public void setNovelURL(String novelURL)
    {
        this.novelURL = novelURL;
    }
    
    public Image getNovelCover() {
        return this.novelCover;
    }

    public void setNovelCover(Image novelCover) {
        this.novelCover = novelCover;
    }

    public String getLatestChapterName() {
        return this.latestChapterName;
    }

    public void setLatestChapterName(String latestChapterName) {
        this.latestChapterName = latestChapterName;
    }

    public String getAuthor() {
        return this.author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getTranslator() {
        return this.Translator;
    }

    public void setTranslator(String Translator) {
        this.Translator = Translator;
    }

    public String getLastUpdateTime() {
        return this.lastUpdateTime;
    }

    public void setLastUpdateTime(String lastUpdateTime) {
        this.lastUpdateTime = lastUpdateTime;
    }
}
