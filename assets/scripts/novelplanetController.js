var novelPlanetURLBox = document.getElementById('novelPlanetURLTextField');
var novelPlanetURLButton = document.getElementById('novelPlanetFindURLButton');

novelPlanetURLBox.addEventListener('click', novelPlanetResetURL);
novelPlanetURLButton.addEventListener('click', novelPlanetNovelFinder);

var novelPlanetPage = document.getElementById('novelPlanetPage');
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

function novelPlanetNovelFinder() {
    var novelLink = novelPlanetURLBox.value;

    if(novelLink == '') {
        // novelPlanetStatusImage.src = "assets/rsc/delete.svg";
        // novelPlanetStatusText.innerText = "Invalid Link!";

        // novelPlanetStatus.style.display = "block";
        // novelPlanetContent.style.display = "none";

    } else if(novelLink.includes('https://novelplanet.com/Novel/')) {
        novelPlanetLoadURL(novelLink);

    } else if(!novelLink.includes('https://')){
        novelPlanetLoadNovel(novelLink);

    } else {
        novelPlanetStatusImage.src = "assets/rsc/delete.svg";
        novelPlanetStatusText.innerText = "Invalid Link!";

        novelPlanetStatus.style.display = "block";
        novelPlanetContent.style.display = "none";
    }
}

function novelPlanetLoadURL(novelLink) { 
    novelPlanetNovelHolderGenerator(novelLink, 'prepend');

    novelPlanetStatus.style.display = "none";
    novelPlanetPage.style.backgroundColor = "#fafafa";
    novelPlanetContent.style.display = "block";

    var options = {
      method: 'GET',
      url: novelLink,
    };
    console.log('Loading novel from link.');
  
    cloudscraper(options)
    .then(function (htmlString) {
        var html = new DOMParser().parseFromString(htmlString, 'text/html');

        var novelCoverSrc = html.getElementsByClassName('post-previewInDetails')[0].getElementsByTagName('img')[0].src;
        var novelName = html.getElementsByClassName('post-contentDetails')[0].getElementsByTagName('p')[0].innerText.replace(/(\r\n|\n|\r)/gm,"");
        var latestChapterName = html.getElementsByClassName("rowChapter")[0].innerText.trim();
        var totalChapters = html.getElementsByClassName("rowChapter").length;

        novelPlanetCurrentNovelName = novelName;
        novelPlanetCurrentNovelLink = novelLink;
        novelPlanetCurrentTotalChapters = html.getElementsByClassName("rowChapter").length;

        if(novelCoverSrc.includes('/Uploads/') || novelCoverSrc.includes('/Content/') || novelCoverSrc.includes('/Novel/')) {
            novelPlanetBackupCover(novelName, latestChapterName, novelLink, totalChapters);
        } else {
            novelPlanetCurrentNovelCoverSrc = novelCoverSrc;
            novelPlanetNovelHolder(novelName, latestChapterName, novelLink, novelCoverSrc, totalChapters);
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

function novelPlanetLoadNovel(novelName) {
    $('#novelPlanetContent ul').html('');
    novelPlanetStatusImage.src = "assets/rsc/eclipse-loading-200px.gif";
    novelPlanetStatusText.innerText = "LOADING";
    novelPlanetStatus.style.display = "block";
    novelPlanetContent.style.display = "none";

    var searchName = novelName.split(' ');
    var searchLink = searchName.shift();
    
    for(x in searchName) {
        searchLink += '%20' + searchName[x];
    }
    searchLink = 'https://novelplanet.com/NovelList?name=' + searchLink;

    var options = {
        method: 'GET',
        url: searchLink,
    };
    console.log('Loading Novels.');

    cloudscraper(options)
    .then(function (htmlString) {
        var html = new DOMParser().parseFromString(htmlString, 'text/html');
        var novelList = html.getElementsByTagName('article');

        if(novelList.length == 0) {
            novelPlanetStatusImage.src = "assets/rsc/delete.svg";
            novelPlanetStatusText.innerText = "NO NOVEL FOUND";
            return;
        }

        Array.prototype.forEach.call(novelList, a => {
            // console.log(a);
            novelPlanetNovelHolderGenerator('https://novelplanet.com' + a.getElementsByTagName('a')[0].getAttribute('href'), 'append');
            setTimeout(function() { novelPlanetDisplaySearchedNovels(a); }, 0);
        });

        novelPlanetStatus.style.display = "none";
        novelPlanetPage.style.backgroundColor = "#fafafa";
        novelPlanetContent.style.display = "block";
        
    }).catch(function (err) {
        console.log(err);
        novelPlanetStatusImage.src = "assets/rsc/delete.svg";
        novelPlanetStatusText.innerText = "Something went wrong!";

        novelPlanetStatus.style.display = "block";
        novelPlanetContent.style.display = "none";
        // var controlHolder = document.getElementById('novelplanet' + novelLink);
        // controlHolder.parentNode.removeChild(controlHolder);
    });
}

function novelPlanetDisplaySearchedNovels(novel) {
    var novelName;
    var latestChapterName;
    var novelLink;
    var novelCoverSrc;
    var totalChapters;

    novelName = novel.getElementsByClassName('title')[0].innerText;
    novelLink = 'https://novelplanet.com' + novel.getElementsByTagName('a')[0].getAttribute('href');
    novelCoverSrc = novel.getElementsByClassName('post-preview')[0].getElementsByTagName('img')[0].src;

    var options = {
        method: 'GET',
        url: novelLink,
    };

    cloudscraper(options, function(error, response, novelHtmlString) {
        var novelHtml = new DOMParser().parseFromString(novelHtmlString, 'text/html');
        totalChapters = novelHtml.getElementsByClassName("rowChapter").length;
        latestChapterName = novelHtml.getElementsByClassName("rowChapter")[0].innerText.trim();

        if(novelCoverSrc.includes('/Uploads/') || novelCoverSrc.includes('/Content/') || novelCoverSrc.includes('/Novel/')) {
            console.log(novelName + ' cover not found! Looking for backup images.')
            novelPlanetBackupCover(novelName, latestChapterName, novelLink, totalChapters);
        } else {
            novelPlanetNovelHolder(novelName, latestChapterName, novelLink, novelCoverSrc, totalChapters);
        }
    }).catch(function (err) {
        console.log(err);
        novelPlanetStatusImage.src = "assets/rsc/delete.svg";
        novelPlanetStatusText.innerText = "Something went wrong!";

        novelPlanetStatus.style.display = "block";
        novelPlanetContent.style.display = "none";
        var controlHolder = document.getElementById('novelplanet' + novelLink);
        controlHolder.parentNode.removeChild(controlHolder);
    });

}

function novelPlanetBackupCover(novelName, latestChapterName, novelLink, totalChapters)
{
    var tempNovelURL = novelName.replace(/ /g, "+");
    tempNovelURL = 'https://www.novelupdates.com/?s=' + tempNovelURL + '&post_type=seriesplans';
    console.log(tempNovelURL);

    var options = {
        method: 'GET',
        url: tempNovelURL,
    };
    cloudscraper(options)
    .then(function (htmlString) {
        var html = new DOMParser().parseFromString(htmlString, 'text/html');
        var tempImgSrc = html.getElementsByClassName('search_img_nu')[0].getElementsByTagName('img')[0].src;
        console.log(tempImgSrc);
        novelPlanetCurrentNovelCoverSrc = tempImgSrc;
        novelPlanetNovelHolder(novelName, latestChapterName, novelLink, tempImgSrc, totalChapters);
    }).catch(function (err) {
        console.log(err);
        novelPlanetCurrentNovelCoverSrc = "https://i.imgur.com/zTqg4jX.png";
        novelPlanetNovelHolder(novelName, latestChapterName, novelLink, "https://i.imgur.com/zTqg4jX.png", totalChapters);
    });
}

function novelPlanetNovelHolderGenerator(novelLink, side) {
    var holder = "<li id=\"novelplanet" + novelLink + "\"class=\"sourceNovelHolder\">";
    holder += "<img class=\"novelCover\" src=\"assets/rsc/eclipse-loading-200px.gif\" onerror=\"this.src='assets/rsc/missing-image.png'\" border=\"0\" alt=\"\">";
    holder += "<div class=\"novelInfo\">";
    holder += "<strong>Loading...</strong>";
    holder += "<p>Please wait!</p>";
    holder += "</div>";
    holder += "<div id=\"novelPlanetNovelButtons\" class=\"novelButtons\">";
    holder += "<button class=\"novelAddButton\" type=\"button\">ADD TO LIBRARY</button>";
    holder += "<button class=\"novelRemoveButton\" type=\"button\">REMOVE FROM LIBRARY</button>";
    holder += "</div>";
    holder += "</li>";

    if(side == 'prepend') {
        $('#novelPlanetContent ul').prepend(holder);
    } else if(side == 'append') {
        $('#novelPlanetContent ul').append(holder);
    }
}

function novelPlanetNovelHolder(novelName, latestChapterName, novelLink, novelCoverSrc, totalChapters) {
    var controlHolder = document.getElementById('novelplanet' + novelLink);
    controlHolder.getElementsByTagName('img')[0].src = novelCoverSrc;
    controlHolder.getElementsByTagName('strong')[0].innerText = novelName;
    controlHolder.getElementsByTagName('p')[0].innerText = latestChapterName
    controlHolder.getElementsByClassName('novelAddButton')[0].addEventListener('click', function() {
        novelPlanetAddToLib(controlHolder, novelName, latestChapterName, novelLink, novelCoverSrc, totalChapters);
    });
    controlHolder.getElementsByClassName('novelRemoveButton')[0].addEventListener('click', function() {
        novelPlanetRemoveLibrary(controlHolder, novelLink);
    });

    refreshNovelPlanetPageData();
}

function novelPlanetAddToLib(holder, novelName, latestChapterName, novelLink, novelCoverSrc, totalChapters) {
    writeToLibrary(novelName, latestChapterName, novelCoverSrc, novelLink, totalChapters, "novelplanet");
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