const {remote} = require('electron');
const cloudscraper = require('cloudscraper');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const { shell } = require('electron');

const { dialog } = require('electron').remote;

const version = "0.9.3";

const electron = require('electron');
const ipc = electron.ipcRenderer;

//App close handling
ipc.on('app-close', _ => {
    //do something here...
    let json = JSON.stringify(libObj);  //convert it back to json
    fs.writeFile("library.json", json, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("Library saved before app close!");
    });

    ipc.send('closed');
});

//Library Objects
var libObj = {"novels":[]};
fs.access('library.json', fs.F_OK, (err) => {
    if (err) {
        console.log("No Library found. Generating new Library!")
        let json = JSON.stringify(libObj); //convert it back to json
        fs.writeFile("library.json", json, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("New Library generated successfully!");
        }); // write it back 
    }
    // file exists
    fs.readFile('library.json', 'utf8', function data(err, data) {
        if (err){
            console.log(err);
        } else {
            if(data.slice(-2,) === "}}") {
                data = data.slice(0, -1);
            }
            libObj = JSON.parse(data);
            for(x in libObj.novels) {
                libObj.novels[x]['status'] = "none";
                saveLibObj();
            }
        }
    });
});

//Check for updates
var options = {
    method: 'GET',
    url: 'https://pastebin.com/7HUqzRGT',
};

cloudscraper(options)
.then(function (htmlString) {
    var html = new DOMParser().parseFromString(htmlString, 'text/html');
    var onlineVersion = html.getElementById('selectable').getElementsByClassName('de1')[0].innerText;
    if(version !== onlineVersion) {
        let options = {
            type: 'info',
            buttons: ['Update', 'Cancel'],
            defaultId: 0,
            title: 'Update',
            message: 'Update Available',
            detail: 'NovelScraper Version ' + onlineVersion + ' is available. Do you want to update?',
          };
        
        dialog.showMessageBox(null, options, (response) => {
            console.log(response);
            if(response == 0) {
                shell.openExternal('https://github.com/dr-nyt/Translated-Novel-Downloader/releases');
            }
        });
    }
})
.catch(function (err) {
    console.log(err);
});

// NAV BAR
document.getElementById('close').addEventListener('click', closeWindow);
document.getElementById('min').addEventListener('click', minWindow);

//MENU BAR
var homeButton = document.getElementById('homeButton');
var sourcesButton = document.getElementById('sourcesButton');
var libraryButton = document.getElementById('libraryButton');

//Sources
var novelPlanetPage = document.getElementById('novelPlanetHolder');
var boxNovelPage = document.getElementById('boxNovelHolder');

// DECLARE VARIABLES
var pages = document.getElementsByClassName("page");
var menuButtons = document.getElementsByClassName("menuButton");

var buttonHighlight = "rgb(5, 69, 121)";
var menuBackground = "#0c2852";

// ADD EVENT-LISTENERS
homeButton.addEventListener('click', loadHomePage);
sourcesButton.addEventListener('click', loadSourcesPage);
libraryButton.addEventListener('click', loadLibraryPage);
novelPlanetPage.addEventListener('click', loadNovelPlanetPage);
boxNovelPage.addEventListener('click', loadBoxNovelPage);

//Downloader
var storagePath = remote.app.getPath('downloads') + '/' + "Novel-Library";
var downloadTracker = []
var downloadTrackerID = 0

// FUNCTIONS
function closeWindow()
{
    var window = remote.getCurrentWindow();
    window.close();
}

function minWindow()
{
    var window = remote.getCurrentWindow();
    window.minimize();
}

function loadHomePage()
{
    hidePages();
    document.getElementById('homePage').style.display = "block";

    deselectButtons();
    homeButton.style.background = buttonHighlight;
}

function loadSourcesPage()
{
    hidePages();
    document.getElementById('sourcesPage').style.display = "block";
    let len = document.getElementById('sourcesPage').getElementsByClassName('sourceHolder').length;
    for(let x = 0; x < len; x++) {
        document.getElementById('sourcesPage').getElementsByClassName('sourceHolder')[x].classList.add('sourceHolderAnimate');
    }

    deselectButtons();
    sourcesButton.style.background = buttonHighlight;
}

function loadLibraryPage()
{
    hidePages();
    loadLibrary();
    document.getElementById('libraryPage').style.display = "block";

    deselectButtons();
    libraryButton.style.background = buttonHighlight;
}

function loadNovelPlanetPage()
{
    hidePages();
    document.getElementById('novelPlanetPage').style.display = "block";

    refreshNovelPlanetPageData();
}

function loadBoxNovelPage()
{
    hidePages();
    document.getElementById('boxNovelPage').style.display = "block";
    
    refreshBoxNovelPageData();
}

function deselectButtons()
{
    for(let i = 0; i < menuButtons.length; i++)
    {
        menuButtons[i].style.background = menuBackground;
    }
}

function hidePages()
{
    for(i = 0; i < pages.length; i++)
    {
        pages[i].style.display = "none";
    }
    let len = document.getElementById('sourcesPage').getElementsByClassName('sourceHolder').length;
    for(let x = 0; x < len; x++) {
        document.getElementById('sourcesPage').getElementsByClassName('sourceHolder')[x].classList.remove('sourceHolderAnimate');
    }
}

async function downloadNovel(novelName, novelCoverSrc, novelLink, totalChapters, source, update) {
    for(x in libObj.novels) {
        if(libObj.novels[x]['novelLink'] === novelLink) {
            if(libObj.novels[x]['status'] === "downloading") {
                console.log('Already downloading novel: ' + novelName);
                return;
            } else {
                libObj.novels[x]['status'] = "downloading";
            }
            break;
        }
    }
    setTimeout(function() {
        var holder = document.getElementById(novelLink);
        buttonDownloadState(holder, true);

        var folderPath = storagePath + '/' + novelName.replace(/[/\\?%*:|"<>]/g, '');
        var updatePath = folderPath + '/update';
        var alertPath = folderPath + '/alert';

        fs.mkdir(storagePath, function(err) {
            if(err) {
                console.log(err)
            }

            fs.mkdir(folderPath, function(err) {
                if(err) {
                    console.log(err)
                }

                fs.writeFile(updatePath, 0, (err) => {
                    if(err){
                        console.log(err);
                    }

                    var req = request({
                        method: 'GET',
                        uri: novelCoverSrc
                    });

                    var out = fs.createWriteStream(folderPath + '/cover.png');
                    req.pipe(out);
                    
                    var executablePath = 'assets\\modules\\download_manager.exe';
                    var parameters = [novelLink, folderPath, source, update];
                    console.log('Update Status: ' + update);

                    setTimeout(function() {runPy(executablePath, parameters);}, 0);
                    downloadTracker.push(-1);
                    var id = setInterval(function() {getDownloadUpdate(novelName, updatePath, id, downloadTrackerID, novelLink, totalChapters, folderPath);}, 500);
                    downloadTrackerID += 1;
                    for(x in libObj.novels) {
                        if(libObj.novels[x]['novelLink'] === novelLink) {
                            libObj.novels[x]['folderPath'] = folderPath;
                        }
                    }
                });

                fs.writeFile(alertPath, "ok", (err) => {
                    if(err){
                        console.log(err);
                    }
                    holder.getElementsByClassName('libraryCancelButton')[0].style.display = "block";
                    holder.getElementsByClassName('libraryCancelButton')[0].addEventListener('click', function() {cancelDownload(alertPath);});
                });
            });
        });
    }, 0);
}

function runPy(executablePath, parameters) {
    child(executablePath, parameters, function(err, data) {
        console.log(err)
        // console.log(data.toString());
   });
}

function getDownloadUpdate(novelName, updatePath, id, tracker, novelLink, totalChapters, folderPath) {
    var holder = document.getElementById(novelLink);
    fs.readFile(updatePath, 'utf8', function(err, data) {
        if (err){
            console.log(err);
            buttonDownloadState(holder, false);
            resetStatus(novelLink);
            clearInterval(id);
        } else if(data === "END") {
            resetStatus(novelLink);
            console.log(novelName + ' download complete!');

            holder.getElementsByClassName("libraryOpenFolderButton")[0].style.display = "block";
            holder.getElementsByClassName("libraryOpenFolderButton")[0].addEventListener('click', function() {shell.openItem(folderPath);});

            for(x in libObj.novels) {
                if(libObj.novels[x]['novelLink'] === novelLink) {
                    libObj.novels[x]['downloaded'] = "true";
                    libObj.novels[x]['folderPath'] = folderPath;
                    break;
                }
            }
            saveLibObj();
            
            holder.getElementsByClassName('progressBar')[0].style.display = "none";
            holder.getElementsByClassName('libraryDownloadButton')[0].innerHTML = "UPDATE";
            holder.getElementsByClassName('libraryDownloadButton')[0].style.background = '#0c2852';
            holder.getElementsByClassName('libraryCancelButton')[0].style.display = "none";

            clearInterval(id);
            
        } else if(data === "CANCEL") {
            buttonDownloadState(holder, false)
            resetStatus(novelLink);
            clearInterval(id);

        } else if(data === "ERROR") {
            resetStatus(novelLink);
            let options = {
                type: 'error',
                buttons: ['Report', 'Cancel'],
                defaultId: 0,
                title: 'Download Error',
                message: 'Error while downloading!',
                detail: 'An error occured when downloading! If this was unexpected then please open an issue on github.',
              };
            
            dialog.showMessageBox(null, options, (response) => {
                console.log(response);
                if(response == 0) {
                    shell.openExternal('https://github.com/dr-nyt/Translated-Novel-Downloader/issues')
                }
            });
            buttonDownloadState(holder, false);
            clearInterval(id);
        
        } else if(data === "NO-UPDATE") {
            resetStatus(novelLink);
            let options = {
                type: 'info',
                buttons: ['Report', 'Ok'],
                defaultId: 1,
                title: 'No Update',
                message: 'This novel is up-to-date',
                detail: 'If this was unexpected then please open an issue on github.',
              };
            
            dialog.showMessageBox(null, options, (response) => {
                console.log(response);
                if(response == 0) {
                    shell.openExternal('https://github.com/dr-nyt/Translated-Novel-Downloader/issues')
                }
            });
            
            holder.getElementsByClassName('progressBar')[0].style.display = "none";
            holder.getElementsByClassName('libraryDownloadButton')[0].innerHTML = "UPDATE";
            holder.getElementsByClassName('libraryDownloadButton')[0].style.background = '#0c2852';
            holder.getElementsByClassName('libraryCancelButton')[0].style.display = "none";

            loadLibrary();

            clearInterval(id);
        
        } else if(data === "NODEJS") {
            resetStatus(novelLink);
            let options = {
                type: 'error',
                buttons: ['Download', 'Cancel'],
                defaultId: 0,
                title: 'NodeJS Error',
                message: 'Missing NodeJS',
                detail: 'You need to install NodeJS to download from NovelPlanet.',
              };
            
            dialog.showMessageBox(null, options, (response) => {
                console.log(response);
                if(response == 0) {
                    shell.openExternal('https://nodejs.org/en/download/')
                }
            });
            buttonDownloadState(holder, false);
            clearInterval(id);

        } else {
            if(downloadTracker[tracker] !== data) {
                downloadTracker[tracker] = data;

                console.log(novelName + " Status: " + data + '%');
                if(data > 100) {
                    data = data - 5;
                    holder.getElementsByClassName('loaderBar')[0].style.background = 'orange';
                }
                if(holder) {
                    holder.getElementsByClassName('loaderBar')[0].style.width = data + '%';
                }
                buttonDownloadState(holder, true);
            }
        }
    });
}

function buttonDownloadState(holder, state) {
    if(state) {
        holder.getElementsByClassName('progressBar')[0].style.display = "block";
        holder.getElementsByClassName('libraryDownloadButton')[0].innerHTML = "DOWNLOADING!";
        holder.getElementsByClassName('libraryDownloadButton')[0].style.background = '#4CAF50';
        holder.getElementsByClassName('libraryCancelButton')[0].style.display = "block";
    } else {
        holder.getElementsByClassName('progressBar')[0].style.display = "none";
        holder.getElementsByClassName('libraryDownloadButton')[0].innerHTML = "DOWNLOAD";
        holder.getElementsByClassName('libraryDownloadButton')[0].style.background = '#0c2852';
        holder.getElementsByClassName('libraryCancelButton')[0].style.display = "none";
    }
}

function cancelDownload(alertPath) {
    fs.writeFile(alertPath, "cancel", (err) => {
        if(err){
            console.log(err);
        }
        console.log('Download Cancel Issued!');
    });
}

function resetStatus(novelLink) {
    for(x in libObj.novels) {
        if(libObj.novels[x]['novelLink'] === novelLink) {
                libObj.novels[x]['status'] = "none";
                saveLibObj();
                break;
        }
    }
}