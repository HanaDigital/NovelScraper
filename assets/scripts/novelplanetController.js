var novelPlanetURLBox = document.getElementById('novelPlanetURLTextField');
var novelPlanetURLButton = document.getElementById('novelPlanetFindURLButton');

novelPlanetURLBox.addEventListener('click', novelPlanetResetURL);
novelPlanetURLButton.addEventListener('click', novelPlanetLoadURL);

var novelPlanetStatus = document.getElementById('novelPlanetStatus');
var novelPlanetStatusImage = document.getElementById('novelPlanetStatus').getElementsByClassName('sourceStatusImage')[0];
var novelPlanetStatusText = document.getElementById('novelPlanetStatus').getElementsByClassName('statusText')[0];

var novelPlanetContent = document.getElementById('novelPlanetContent');
var novelPlanetAddToLibButton = document.getElementById('novelPlanetAddLibButton');
var novelPlanetRemoveFromLibButton = document.getElementById('novelPlanetRemoveLibButton');

novelPlanetAddToLibButton.addEventListener('click', novelPlanetAddToLib);
novelPlanetRemoveFromLibButton.addEventListener('click', novelPlanetRemoveLibrary);

var novelPlanetCurrentNovelName;
var novelPlanetCurrentNovelCoverSrc;
var novelPlanetCurrentNovelLink;
var novelPlanetCurrentTotalChapters;

function novelPlanetLoadURL() {
    var novelLink = novelPlanetURLBox.value;
    if(!novelLink.includes('https://novelplanet.com/Novel/')) {
        novelPlanetStatusImage.src = "assets/rsc/delete.svg";
        novelPlanetStatusText.innerText = "Invalid Link!";
        return;
    } else if(novelLink == '') {
        return;
    }
    
    novelPlanetStatusImage.src = "assets/rsc/eclipse-loading-200px.gif";
    novelPlanetStatusText.innerText = "Loading...";

    novelPlanetStatus.style.display = "block";
    novelPlanetContent.style.display = "none";

    var options = {
      method: 'GET',
      url: novelLink,
    };
    console.log('loading novel');
  
    cloudscraper(options)
    .then(function (htmlString) {
        var html = new DOMParser().parseFromString(htmlString, 'text/html');
        console.log(html);

        var novelCoverSrc = html.getElementsByClassName('post-previewInDetails')[0].getElementsByTagName('img')[0].src;
        var novelName = html.getElementsByClassName('post-contentDetails')[0].getElementsByTagName('p')[0].innerText.replace(/(\r\n|\n|\r)/gm,"");

        novelPlanetCurrentNovelName = novelName;
        novelPlanetCurrentNovelLink = novelLink;
        novelPlanetCurrentTotalChapters = html.getElementsByClassName("rowChapter").length;

        novelPlanetContent.getElementsByTagName('strong')[0].innerText = novelName;
        novelPlanetContent.getElementsByTagName('p')[0].innerText = "";

        if(novelCoverSrc.includes('/Uploads/') || novelCoverSrc.includes('/Content/') || novelCoverSrc.includes('/Novel/')) {
            novelPlanetContent.getElementsByTagName('img')[0].src = "assets/rsc/eclipse-loading-200px.gif";
            novelPlanetBackupCover(novelName);
        } else {
            novelPlanetContent.getElementsByTagName('img')[0].src = novelCoverSrc;
            novelPlanetCurrentNovelCoverSrc = novelCoverSrc;
            novelPlanetStatus.style.display = "none";
            novelPlanetContent.style.display = "block";
        }

        novelPlanetCheckLibrary(novelLink);
    })
    .catch(function (err) {
        console.log(err);
    });
}

function novelPlanetBackupCover(novelName)
{
    var tempNovelURL = novelName.replace(/ /g, "+");
    tempNovelURL = 'https://www.novelupdates.com/?s=' + tempNovelURL + '&post_type=seriesplans';
    request(tempNovelURL, function(error, response, html) {
        if(!error && response.statusCode == 200) { 
            let $ = cheerio.load(html);
            var tempImgSrc = $('.search_img_nu').find('img').attr('src');
            novelPlanetContent.getElementsByTagName('img')[0].src = tempImgSrc;

            novelPlanetCurrentNovelCoverSrc = tempImgSrc;
            novelPlanetStatus.style.display = "none";
            novelPlanetContent.style.display = "block";
        } else {
            console.log(error);
            novelPlanetContent.getElementsByTagName('img')[0].src = "assets/rsc/missing-image.png";
            novelPlanetCurrentNovelCoverSrc = "none";
            novelPlanetStatus.style.display = "none";
            novelPlanetContent.style.display = "block";
        }
    });
}

//UTILITY FUNCTIONS

// Execute a function when the user releases a key on the keyboard
novelPlanetURLBox.addEventListener("keyup", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      event.preventDefault();
      novelPlanetURLButton.click();
    }
});

function novelPlanetResetURL() {
    novelPlanetURLBox.value = "";
}

function novelPlanetAddToLib() {
    if(novelPlanetCurrentNovelName && novelPlanetCurrentNovelCoverSrc && novelPlanetCurrentNovelLink){
        saveNovelToLibrary(novelPlanetCurrentNovelName, novelPlanetCurrentNovelCoverSrc, novelPlanetCurrentNovelLink, novelPlanetCurrentTotalChapters, "novelplanet");
        novelPlanetLibButton(false);
    } else {
        console.log('No Novel Loaded!')
    }
}

function novelPlanetCheckLibrary(link) {
    novelPlanetLibButton(true);
    for(x in libObj.novels) {
        if(libObj.novels[x]['novelLink'] === link) {
            novelPlanetLibButton(false);
            break;
        }
    }
}

async function saveNovelToLibrary(novelName, novelCoverSrc, novelLink, totalChapters) {
    writeToLibrary(novelName, novelCoverSrc, novelLink, totalChapters, "novelplanet");
}

function novelPlanetRemoveLibrary() {
    novelPlanetLibButton(true);
    removeFromLibrary(novelPlanetCurrentNovelLink);
}

function novelPlanetLibButton(boolean) {
    if(boolean) {
        novelPlanetRemoveFromLibButton.style.display = "none";
        novelPlanetAddToLibButton.style.display = "block";
    } else {
        novelPlanetAddToLibButton.style.display = "none";
        novelPlanetRemoveFromLibButton.style.display = "block";
    }
}