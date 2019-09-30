var novelPlanetURLBox = document.getElementById('novelPlanetURLTextField');
var novelPlanetURLButton = document.getElementById('novelPlanetFindURLButton');

novelPlanetURLBox.addEventListener('click', novelPlanetResetURL);
novelPlanetURLButton.addEventListener('click', novelPlanetLoadURL);

var novelPlanetStatus = document.getElementById('novelPlanetStatus');
var novelPlanetStatusImage = document.getElementById('novelPlanetStatus').getElementsByClassName('sourceStatusImage')[0];
var novelPlanetStatusText = document.getElementById('novelPlanetStatus').getElementsByClassName('statusText')[0];

var novelPlanetContent = document.getElementById('novelPlanetContent');

var novelPlanetCurrentNovelName;
var novelPlanetCurrentNovelCoverSrc;
var novelPlanetCurrentNovelLink;
var novelPlanetCurrentTotalChapters;

function novelPlanetResetURL() {
    novelPlanetURLBox.value = "";
}

// Execute a function when the user releases a key on the keyboard
novelPlanetURLBox.addEventListener("keyup", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      event.preventDefault();
      novelPlanetURLButton.click();
    }
});

function novelPlanetLoadURL() {
    var novelLink = novelPlanetURLBox.value;
    if(!novelLink.includes('https://novelplanet.com/Novel/')) {
        novelPlanetStatusImage.src = "assets/rsc/delete.svg";
        novelPlanetStatusText.innerText = "Invalid Link!";

        novelPlanetStatus.style.display = "block";
        novelPlanetContent.style.display = "none";
        return;
    } else if(novelLink == '') {
        return;
    }
    
    var holder = "<li id=\"novelplanet" + novelLink + "\"class=\"sourceNovelHolder\">";
    holder += "<img class=\"novelCover\" src=\"assets/rsc/eclipse-loading-200px.gif\" onerror=\"this.src='assets/rsc/missing-image.png'\" border=\"0\" alt=\"\">";
    holder += "<div class=\"novelInfo\">";
    holder += "<strong>Loading...</strong>";
    // holder += "<p>Please wait!</p>";
    holder += "</div>";
    holder += "<div id=\"novelPlanetNovelButtons\" class=\"novelButtons\">";
    holder += "<button class=\"novelAddButton\" type=\"button\">ADD TO LIBRARY</button>";
    holder += "<button class=\"novelRemoveButton\" type=\"button\">REMOVE FROM LIBRARY</button>";
    holder += "</div>";
    holder += "</li>";

    $('#novelPlanetContent ul').prepend(holder);

    novelPlanetStatus.style.display = "none";
    novelPlanetContent.style.display = "block";

    var options = {
      method: 'GET',
      url: novelLink,
    };
    console.log('loading novel');
  
    cloudscraper(options)
    .then(function (htmlString) {
        var html = new DOMParser().parseFromString(htmlString, 'text/html');

        var novelCoverSrc = html.getElementsByClassName('post-previewInDetails')[0].getElementsByTagName('img')[0].src;
        var novelName = html.getElementsByClassName('post-contentDetails')[0].getElementsByTagName('p')[0].innerText.replace(/(\r\n|\n|\r)/gm,"");
        var totalChapters = html.getElementsByClassName("rowChapter").length;

        novelPlanetCurrentNovelName = novelName;
        novelPlanetCurrentNovelLink = novelLink;
        novelPlanetCurrentTotalChapters = html.getElementsByClassName("rowChapter").length;

        if(novelCoverSrc.includes('/Uploads/') || novelCoverSrc.includes('/Content/') || novelCoverSrc.includes('/Novel/')) {
            novelPlanetBackupCover(novelName, novelLink, totalChapters);
        } else {
            novelPlanetCurrentNovelCoverSrc = novelCoverSrc;
            novelPlanetNovelHolder(novelName, novelLink, novelCoverSrc, totalChapters);
        }
    })
    .catch(function (err) {
        console.log(err);
        novelPlanetStatusImage.src = "assets/rsc/delete.svg";
        novelPlanetStatusText.innerText = "Invalid Link!";

        novelPlanetStatus.style.display = "block";
        novelPlanetContent.style.display = "none";

        var controlHolder = document.getElementById('novelplanet' + novelLink);
        controlHolder.parentNode.removeChild(controlHolder);
    });
}

function novelPlanetBackupCover(novelName, novelLink, totalChapters)
{
    var tempNovelURL = novelName.replace(/ /g, "+");
    tempNovelURL = 'https://www.novelupdates.com/?s=' + tempNovelURL + '&post_type=seriesplans';
    request(tempNovelURL, function(error, response, html) {
        if(!error && response.statusCode == 200) { 
            let $ = cheerio.load(html);
            var tempImgSrc = $('.search_img_nu').find('img').attr('src');

            novelPlanetCurrentNovelCoverSrc = tempImgSrc;
            novelPlanetNovelHolder(novelName, novelLink, tempImgSrc, totalChapters);
        } else {
            console.log(error);
            novelPlanetCurrentNovelCoverSrc = "assets/rsc/missing-image.png";
            novelPlanetNovelHolder(novelName, novelLink, "assets/rsc/missing-image.png", totalChapters);
        }
    });
}

function novelPlanetNovelHolder(novelName, novelLink, novelCoverSrc, totalChapters) {
    var controlHolder = document.getElementById('novelplanet' + novelLink);
    controlHolder.getElementsByTagName('img')[0].src = novelCoverSrc;
    controlHolder.getElementsByTagName('strong')[0].innerText = novelName;
    controlHolder.getElementsByClassName('novelAddButton')[0].addEventListener('click', function() {
        novelPlanetAddToLib(controlHolder, novelName, novelLink, novelCoverSrc, totalChapters);
    });
    controlHolder.getElementsByClassName('novelRemoveButton')[0].addEventListener('click', function() {
        novelPlanetRemoveLibrary(controlHolder, novelLink);
    });

    refreshNovelPlanetPageData();
}

function novelPlanetAddToLib(holder, novelName, novelLink, novelCoverSrc, totalChapters) {
    writeToLibrary(novelName, novelCoverSrc, novelLink, totalChapters, "novelplanet");
    novelPlanetLibButton(holder, false);
}

function novelPlanetRemoveLibrary(holder, novelLink) {
    removeFromLibrary(novelLink);
    novelPlanetLibButton(holder, true);
}

async function refreshNovelPlanetPageData() {
    var size = document.getElementById('novelPlanetNovelList').getElementsByClassName('sourceNovelHolder').length;

    for(let i = 0; i < size; i++) {
        var holder = document.getElementById('novelPlanetNovelList').getElementsByClassName('sourceNovelHolder')[i];
        novelPlanetLibButton(holder, true);
        for(x in libObj.novels) {
            if(libObj.novels[x]['novelLink'] === holder.id.slice(11,)) {
                novelPlanetLibButton(holder, false);
                break;
            }
        }
    }
}

function novelPlanetLibButton(holder, boolean) {
    if(boolean) {
        holder.getElementsByClassName('novelAddButton')[0].style.display = "block";
        holder.getElementsByClassName('novelRemoveButton')[0].style.display = "none";
    } else {
        holder.getElementsByClassName('novelAddButton')[0].style.display = "none";
        holder.getElementsByClassName('novelRemoveButton')[0].style.display = "block";
    }
}