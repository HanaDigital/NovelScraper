var boxNovelURLBox = document.getElementById('boxNovelURLTextField');
var boxNovelURLButton = document.getElementById('boxNovelFindURLButton');

boxNovelURLBox.addEventListener('click', boxNovelResetURL);
boxNovelURLButton.addEventListener('click', boxNovelLoadURL);

var boxNovelStatus = document.getElementById('boxNovelStatus');
var boxNovelStatusImage = document.getElementById('boxNovelStatus').getElementsByClassName('sourceStatusImage')[0];
var boxNovelStatusText = document.getElementById('boxNovelStatus').getElementsByClassName('statusText')[0];

var boxNovelContent = document.getElementById('boxNovelContent');
var boxNovelAddToLibButton = document.getElementById('boxNovelAddLibButton');
var boxNovelRemoveFromLibButton = document.getElementById('boxNovelRemoveLibButton');

boxNovelAddToLibButton.addEventListener('click', boxNovelAddToLib);
boxNovelRemoveFromLibButton.addEventListener('click', boxNovelRemoveLibrary);

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

function boxNovelLoadURL() {
    var novelLink = boxNovelURLBox.value;
    if(!novelLink.includes('https://boxnovel.com/novel/')) {
        boxNovelStatusImage.src = "assets/rsc/delete.svg";
        boxNovelStatusText.innerText = "Invalid Link!";
        return;
    } else if(novelLink == '') {
        return;
    }

    boxNovelStatusImage.src = "assets/rsc/eclipse-loading-200px.gif";
    boxNovelStatusText.innerText = "Loading...";

    boxNovelStatus.style.display = "block";
    boxNovelContent.style.display = "none";

    var options = {
      method: 'GET',
      url: novelLink,
    };
    console.log('loading novel');
  
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
        console.log(novelName);
        
        boxNovelContent.getElementsByTagName('img')[0].src = novelCoverSrc;
        
        boxNovelContent.getElementsByTagName('strong')[0].innerText = novelName;
        boxNovelContent.getElementsByTagName('p')[0].innerText = "";

        boxNovelCheckLibrary(novelLink);

        boxNovelCurrentNovelName = novelName;
        boxNovelCurrentNovelLink = novelLink;
        boxNovelCurrentNovelCoverSrc = novelCoverSrc;
        boxNovelCurrentTotalChapters = html.getElementsByClassName("wp-manga-chapter").length;

        boxNovelStatus.style.display = "none";
        boxNovelContent.style.display = "block";
    })
    .catch(function (err) {
        console.log(err);
    });
}

function boxNovelAddToLib() {
    if(boxNovelCurrentNovelName && boxNovelCurrentNovelCoverSrc && boxNovelCurrentNovelLink){
        writeToLibrary(boxNovelCurrentNovelName, boxNovelCurrentNovelCoverSrc, boxNovelCurrentNovelLink, boxNovelCurrentTotalChapters, "boxnovel");
        boxNovelLibButton(false);
    } else {
        console.log('No Novel Loaded!')
    }
}

function boxNovelRemoveLibrary() {
    boxNovelLibButton(true);
    removeFromLibrary(boxNovelCurrentNovelLink);
}

function boxNovelCheckLibrary(link) {
    boxNovelLibButton(true);
    for(x in libObj.novels) {
        if(libObj.novels[x]['novelLink'] === link) {
            boxNovelLibButton(false);
            break;
        }
    }
}

function boxNovelLibButton(boolean) {
    if(boolean) {
        boxNovelRemoveFromLibButton.style.display = "none";
        boxNovelAddToLibButton.style.display = "block";
    } else {
        boxNovelAddToLibButton.style.display = "none";
        boxNovelRemoveFromLibButton.style.display = "block";
    }
}