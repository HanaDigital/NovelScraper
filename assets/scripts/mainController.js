const {remote} = require('electron');
const cloudscraper = require('cloudscraper');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const $ = require('jQuery');
const child = require('child_process').execFile;
const { shell } = require('electron');

const { dialog } = require('electron').remote;

const version = "0.9";

//Library Objects
var libObj = {"novels":[]};
fs.access('library.json', fs.F_OK, (err) => {
    if (err) {
        console.log("Generating new Library")
        let json = JSON.stringify(libObj); //convert it back to json
        fs.writeFile("library.json", json, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("File saved successfully!");
        }); // write it back 
    }
    // file exists
    fs.readFile('library.json', 'utf8', function data(err, data) {
        if (err){
            console.log(err);
        } else {
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
var novelPlanetSource = document.getElementById('novelPlanetHolder');
var boxNovelSource = document.getElementById('boxNovelHolder');

// DECLARE VARIABLES
var pages = document.getElementsByClassName("page");
var menuButtons = document.getElementsByClassName("menuButton");

var buttonHighlight = "rgb(5, 69, 121)";
var menuBackground = "#0c2852";

// ADD EVENT-LISTENERS
homeButton.addEventListener('click', loadHomePage);
sourcesButton.addEventListener('click', loadSourcesPage);
libraryButton.addEventListener('click', loadLibraryPage);
novelPlanetSource.addEventListener('click', loadNovelPlanetPage);
boxNovelSource.addEventListener('click', loadBoxNovelPage);

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

    if(novelPlanetCurrentNovelLink) {
        novelPlanetCheckLibrary(novelPlanetCurrentNovelLink);
    }
}

function loadBoxNovelPage()
{
    hidePages();
    document.getElementById('boxNovelPage').style.display = "block";

    if(boxNovelCurrentNovelLink) {
        boxNovelCheckLibrary(boxNovelCurrentNovelLink);
    }
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
}

function downloadNovel(novelName, novelCoverSrc, novelLink, totalChapters, source) {
    setTimeout(function() {
        for(x in libObj.novels) {
            if(libObj.novels[x]['novelLink'] === novelLink) {
                if(libObj.novels[x]['status'] === "downloading") {
                    console.log('Already downloading!')
                    return;
                } else {
                    libObj.novels[x]['status'] = "downloading";
                    saveLibObj();
                }
                break;
            }
        }
        var novelPlanetSource = false;
        var boxNovelSource = false;

        if(novelPlanetCurrentNovelLink === novelLink) {
            novelPlanetSource = true;
        } else if(boxNovelCurrentNovelLink === novelLink) {
            boxNovelSource = true;
        }

        var holder = document.getElementById(novelLink);
        libraryButtonDownloadState(holder, true, novelPlanetSource, boxNovelSource);

        var folderPath = storagePath + '/' + novelName.replace(/[/\\?%*:|"<>]/g, '');
        var updatePath = folderPath + '/update.txt';

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
                    console.log(source);
                    var parameters = [novelLink, folderPath, source];

                    setTimeout(function() {runPy(executablePath, parameters);}, 0);
                    downloadTracker.push(-1);
                    var id = setInterval(function() {getDownloadUpdate(updatePath, id, downloadTrackerID, novelLink, totalChapters, folderPath, novelPlanetSource, boxNovelSource);}, 500);
                    downloadTrackerID += 1;
                    for(x in libObj.novels) {
                        if(libObj.novels[x]['novelLink'] === novelLink) {
                            libObj.novels[x]['folderPath'] = folderPath;
                        }
                    }
                });
            });
        });
    }, 0);
}

function runPy(executablePath, parameters) {
    child(executablePath, parameters, function(err, data) {
        console.log(err)
        console.log(data.toString());
   });
}

function getDownloadUpdate(updatePath, id, tracker, novelLink, totalChapters, folderPath, novelPlanetSource, boxNovelSource) {
    var holder = document.getElementById(novelLink);
    fs.readFile(updatePath, 'utf8', function(err, data) {
        if (err){
            console.log(err);
            clearInterval(id);
        } else if(data === "END") {
            resetStatus(novelLink);
            console.log('Ending..')
            if(holder) {
                holder.getElementsByClassName("libraryOpenFolderButton")[0].style.display = "block";
                holder.getElementsByClassName("libraryOpenFolderButton")[0].addEventListener('click', function() {shell.openItem(folderPath);});
            }
            if(novelPlanetSource) {
                document.getElementById("novelPlanetOpenFolderButton").style.display = "block";
                document.getElementById("novelPlanetOpenFolderButton").addEventListener('click', function() {shell.openItem(folderPath);});
            } else if(boxNovelSource) {
                document.getElementById("boxNovelOpenFolderButton").style.display = "block";
                document.getElementById("boxNovelOpenFolderButton").addEventListener('click', function() {shell.openItem(folderPath);});
            }
            for(x in libObj.novels) {
                if(libObj.novels[x]['novelLink'] === novelLink) {
                    libObj.novels[x]['downloaded'] = "true";
                    libObj.novels[x]['folderPath'] = folderPath;
                }
            }
            saveLibObj();
            libraryButtonDownloadState(holder, false, novelPlanetSource, boxNovelSource);
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
            libraryButtonDownloadState(holder, false, novelPlanetSource, boxNovelSource);
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
            libraryButtonDownloadState(holder, false, novelPlanetSource, boxNovelSource);
            clearInterval(id);

        } else {
            if(downloadTracker[tracker] !== data) {
                console.log("data : " + data);
                downloadTracker[tracker] = data;

                console.log(((data * 100) / totalChapters).toString() + '%');
                if(holder) {
                    holder.getElementsByClassName('loaderBar')[0].style.width = ((data * 100) / totalChapters).toString() + '%';
                }
                if(novelPlanetSource) {
                    document.getElementById('novelPlanetNovelButtons').getElementsByClassName('loaderBar')[0].style.width = ((data * 100) / totalChapters).toString() + '%';
                } else if(boxNovelSource) {
                    document.getElementById('boxNovelNovelButtons').getElementsByClassName('loaderBar')[0].style.width = ((data * 100) / totalChapters).toString() + '%';
                }
                libraryButtonDownloadState(holder, true, novelPlanetSource, boxNovelSource);
            }
        }
    });
}

function libraryButtonDownloadState(holder, state, novelPlanetSource, boxNovelSource) {
    if(state) {
        if(holder) {
            holder.getElementsByClassName('progressBar')[0].style.display = "block";
            holder.getElementsByClassName('libraryDownloadButton')[0].innerHTML = "DOWNLOADING!";
            holder.getElementsByClassName('libraryDownloadButton')[0].style.background = '#4CAF50';
        }
        if(novelPlanetSource) {
            holder = document.getElementById('novelPlanetNovelButtons');
            holder.getElementsByClassName('progressBar')[0].style.display = "block";
            document.getElementById('novelPlanetDownloadButton').innerHTML = "DOWNLOADING!";
            document.getElementById('novelPlanetDownloadButton').style.background = '#4CAF50';
        } else if(boxNovelSource) {
            holder = document.getElementById('boxNovelNovelButtons');
            holder.getElementsByClassName('progressBar')[0].style.display = "block";
            document.getElementById('boxNovelDownloadButton').innerHTML = "DOWNLOADING!";
            document.getElementById('boxNovelDownloadButton').style.background = '#4CAF50';
        }
    } else {
        if(holder) {
            holder.getElementsByClassName('progressBar')[0].style.display = "none";
            holder.getElementsByClassName('libraryDownloadButton')[0].innerHTML = "DOWNLOAD";
            holder.getElementsByClassName('libraryDownloadButton')[0].style.background = '#0c2852';
        }
        if(novelPlanetSource) {
            holder = document.getElementById('novelPlanetNovelButtons');
            holder.getElementsByClassName('progressBar')[0].style.display = "none";
            document.getElementById('novelPlanetDownloadButton').innerHTML = "DOWNLOAD";
            document.getElementById('novelPlanetDownloadButton').style.background = '#0c2852';
        } else if(boxNovelSource) {
            holder = document.getElementById('boxNovelNovelButtons');
            holder.getElementsByClassName('progressBar')[0].style.display = "none";
            document.getElementById('boxNovelDownloadButton').innerHTML = "DOWNLOAD";
            document.getElementById('boxNovelDownloadButton').style.background = '#0c2852';
        }
    }
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