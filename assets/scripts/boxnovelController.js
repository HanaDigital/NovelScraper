var boxNovelURLBox = document.getElementById('boxNovelURLTextField');
var boxNovelURLButton = document.getElementById('boxNovelFindURLButton');

boxNovelURLBox.addEventListener('click', boxNovelResetURL);
boxNovelURLButton.addEventListener('click', boxNovelNovelFinder);

var boxNovelStatus = document.getElementById('boxNovelStatus');
var boxNovelStatusImage = document.getElementById('boxNovelStatus').getElementsByClassName('sourceStatusImage')[0];
var boxNovelStatusText = document.getElementById('boxNovelStatus').getElementsByClassName('statusText')[0];

var boxNovelContent = document.getElementById('boxNovelContent');

var boxNovelCurrentNovelName;
var boxNovelCurrentNovelCoverSrc;
var boxNovelCurrentNovelLink;
var boxNovelCurrentTotalChapters;

function boxNovelResetURL() {
    boxNovelURLBox.value = "";
}

// Execute a function when the user releases a key on the keyboard
boxNovelURLBox.addEventListener("keyup", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      event.preventDefault();
      boxNovelURLButton.click();
    }
});

function boxNovelNovelFinder() {
    var novelLink = boxNovelURLBox.value;

    if(novelLink == '') {
        // boxNovelStatusImage.src = "assets/rsc/delete.svg";
        // boxNovelStatusText.innerText = "Invalid Link!";

        // boxNovelStatus.style.display = "block";
        // boxNovelContent.style.display = "none";

    } else if(novelLink.includes('https://novelplanet.com/Novel/')) {
        boxNovelLoadURL(novelLink);

    } else if(!novelLink.includes('https://')){
        boxNovelLoadNovel(novelLink);

    } else {
        boxNovelStatusImage.src = "assets/rsc/delete.svg";
        boxNovelStatusText.innerText = "Invalid Link!";

        boxNovelStatus.style.display = "block";
        boxNovelContent.style.display = "none";
    }
}

function boxNovelLoadURL(novelLink) {
    boxNovelNovelHolderGenerator(novelLink, 'prepend');

    boxNovelStatus.style.display = "none";
    boxNovelContent.style.display = "block";

    var options = {
      method: 'GET',
      url: novelLink,
    };
    console.log('Loading Novel from link.');
  
    cloudscraper(options)
    .then(function (htmlString) {
        var html = new DOMParser().parseFromString(htmlString, 'text/html');
        // var novelInfoHtml = html.getElementsByClassName('container')[0];

        var novelCoverSrc = html.getElementsByClassName('summary_image')[0].getElementsByTagName('img')[0].src;
        var novelName = html.getElementsByClassName('post-title')[0].getElementsByTagName('h3')[0];
        let junk = novelName.getElementsByTagName('span')[0];
        if(junk) {
            novelName.removeChild(junk);
        }
        novelName = novelName.innerText.replace(/(\r\n|\n|\r)/gm,"").trim();
        var totalChapters = html.getElementsByClassName("wp-manga-chapter").length;
        var latestChapterName = html.getElementsByClassName("wp-manga-chapter")[0].innerText.trim();
        
        boxNovelCurrentNovelName = novelName;
        boxNovelCurrentNovelLink = novelLink;
        boxNovelCurrentNovelCoverSrc = novelCoverSrc;
        boxNovelCurrentTotalChapters = totalChapters

        boxNovelNovelHolder(novelName, latestChapterName, novelLink, novelCoverSrc, totalChapters);

        boxNovelStatus.style.display = "none";
        boxNovelContent.style.display = "block";
    })
    .catch(function (err) {
        console.log(err);
        boxNovelStatusImage.src = "assets/rsc/delete.svg";
        boxNovelStatusText.innerText = "Invalid Link!";

        boxNovelStatus.style.display = "block";
        boxNovelContent.style.display = "none";

        var controlHolder = document.getElementById('boxnovel' + novelLink);
        controlHolder.parentNode.removeChild(controlHolder);
    });
}

function boxNovelLoadNovel(novelName) {
    $('#boxNovelContent ul').html('');
    boxNovelStatusImage.src = "assets/rsc/eclipse-loading-200px.gif";
    boxNovelStatusText.innerText = "LOADING";
    boxNovelStatus.style.display = "block";
    boxNovelContent.style.display = "none";

    var searchName = novelName.split(' ');
    var searchLink = searchName.shift();

    for(x in searchName) {
        searchLink += '+' + searchName[x];
    }
    searchLink = 'https://boxnovel.com/?s=' + searchLink + '&post_type=wp-manga';

    var options = {
        method: 'GET',
        url: searchLink,
    };
    console.log('Loading Novels.');

    cloudscraper(options)
    .then(function (htmlString) {
        var html = new DOMParser().parseFromString(htmlString, 'text/html');
        var novelList = html.getElementsByClassName('c-tabs-item__content');

        if(novelList.length == 0) {
            boxNovelStatusImage.src = "assets/rsc/delete.svg";
            boxNovelStatusText.innerText = "NO NOVEL FOUND";
            return;
        }

        Array.prototype.forEach.call(novelList, a => {
            // console.log(a);
            boxNovelNovelHolderGenerator(a.getElementsByClassName('post-title')[0].getElementsByTagName('a')[0].href, 'append');
            setTimeout(function() { boxNovelDisplaySearchedNovels(a); }, 0);
        });

        boxNovelStatus.style.display = "none";
        boxNovelContent.style.display = "block";
        
    }).catch(function (err) {
        console.log(err);
        boxNovelStatusImage.src = "assets/rsc/delete.svg";
        boxNovelStatusText.innerText = "Something went wrong!";

        boxNovelStatus.style.display = "block";
        boxNovelContent.style.display = "none";
        // var controlHolder = document.getElementById('novelplanet' + novelLink);
        // controlHolder.parentNode.removeChild(controlHolder);
    });
}

function boxNovelDisplaySearchedNovels(novel) {
    var novelName;
    var latestChapterName;
    var novelLink;
    var novelCoverSrc;
    var totalChapters;

    novelName = novel.getElementsByClassName('post-title')[0].getElementsByTagName('a')[0].innerText;
    novelLink = novel.getElementsByClassName('post-title')[0].getElementsByTagName('a')[0].href;
    novelCoverSrc = novel.getElementsByTagName('img')[0].src;

    var options = {
        method: 'GET',
        url: novelLink,
      };
      console.log('Creating Novel Holders.');
    
      cloudscraper(options)
      .then(function (htmlString) {
          var html = new DOMParser().parseFromString(htmlString, 'text/html');
  
          novelName = novelName.replace(/(\r\n|\n|\r)/gm,"").trim();
          totalChapters = html.getElementsByClassName("wp-manga-chapter").length;
          latestChapterName = html.getElementsByClassName("wp-manga-chapter")[0].innerText.trim();
  
          boxNovelNovelHolder(novelName, latestChapterName, novelLink, novelCoverSrc, totalChapters);
  
          boxNovelStatus.style.display = "none";
          boxNovelContent.style.display = "block";
      })
      .catch(function (err) {
          console.log(err);
          boxNovelStatusImage.src = "assets/rsc/delete.svg";
          boxNovelStatusText.innerText = "Invalid Link!";
  
          boxNovelStatus.style.display = "block";
          boxNovelContent.style.display = "none";
  
          var controlHolder = document.getElementById('boxnovel' + novelLink);
          controlHolder.parentNode.removeChild(controlHolder);
      });
}

function boxNovelNovelHolderGenerator(novelLink, side) {
    var holder = "<li id=\"boxnovel" + novelLink + "\"class=\"sourceNovelHolder\">";
    holder += "<img class=\"novelCover\" src=\"assets/rsc/eclipse-loading-200px.gif\" onerror=\"this.src='assets/rsc/missing-image.png'\" border=\"0\" alt=\"\">";
    holder += "<div class=\"novelInfo\">";
    holder += "<strong>Loading...</strong>";
    holder += "<p>Please wait!</p>";
    holder += "</div>";
    holder += "<div id=\"boxNovelNovelButtons\" class=\"novelButtons\">";
    holder += "<button class=\"novelAddButton\" type=\"button\">ADD TO LIBRARY</button>";
    holder += "<button class=\"novelRemoveButton\" type=\"button\">REMOVE FROM LIBRARY</button>";
    holder += "</div>";
    holder += "</li>";

    if(side == 'prepend') {
        $('#boxNovelContent ul').prepend(holder);
    } else if(side == 'append') {
        $('#boxNovelContent ul').append(holder);
    }
}

function boxNovelNovelHolder(novelName, novelLink, novelCoverSrc, totalChapters) {
    var controlHolder = document.getElementById('boxnovel' + novelLink);
    controlHolder.getElementsByTagName('img')[0].src = novelCoverSrc;
    controlHolder.getElementsByTagName('strong')[0].innerText = novelName;
    controlHolder.getElementsByTagName('p')[0].innerText = latestChapterName;
    controlHolder.getElementsByClassName('novelAddButton')[0].addEventListener('click', function() {
        boxNovelAddToLib(controlHolder, latestChapterName, novelName, novelLink, novelCoverSrc, totalChapters);
    });
    controlHolder.getElementsByClassName('novelRemoveButton')[0].addEventListener('click', function() {
        boxNovelRemoveLibrary(controlHolder, novelLink);
    });

    refreshBoxNovelPageData();
}

function boxNovelAddToLib(holder, novelName, novelLink, novelCoverSrc, totalChapters) {
    writeToLibrary(novelName, latestChapterName, novelCoverSrc, novelLink, totalChapters, "boxnovel");
    boxNovelLibButton(holder, false);
}

function boxNovelRemoveLibrary(holder, novelLink) {
    removeFromLibrary(novelLink);
    boxNovelLibButton(holder, true);
}

async function refreshBoxNovelPageData() {
    var size = document.getElementById('boxNovelNovelList').getElementsByClassName('sourceNovelHolder').length;

    for(let i = 0; i < size; i++) {
        var holder = document.getElementById('boxNovelNovelList').getElementsByClassName('sourceNovelHolder')[i];
        boxNovelLibButton(holder, true);
        for(x in libObj.novels) {
            if(libObj.novels[x]['novelLink'] === holder.id.slice(8,)) {
                boxNovelLibButton(holder, false);
                break;
            }
        }
    }
}

function boxNovelLibButton(holder, boolean) {
    if(boolean) {
        holder.getElementsByClassName('novelAddButton')[0].style.display = "block";
        holder.getElementsByClassName('novelRemoveButton')[0].style.display = "none";
    } else {
        holder.getElementsByClassName('novelAddButton')[0].style.display = "none";
        holder.getElementsByClassName('novelRemoveButton')[0].style.display = "block";
    }
}