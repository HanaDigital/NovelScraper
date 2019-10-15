librarySearchField = document.getElementById('librarySearchField');
libraryCancelSearch = document.getElementById('libraryCancelSearch');
libraryCancelSearch.addEventListener('click', function() {
    librarySearchField.value = "";
    loadLibrary();
});

librarySearchField.addEventListener("keyup", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      event.preventDefault();
      searchLibrary(librarySearchField.value)
    }
});

function searchLibrary(search) {
    if(search !== '' && search !== ' ') {
        libraryCancelSearch.style.display = "block";
        $('#libraryNovelList').html("");
        document.getElementById("libraryStatus").style.display = "block";
        if(libObj.novels[0] !== undefined) { 
            for(x in libObj.novels) {
                if(libObj.novels[x]['novelName'].toLowerCase().includes(search.toLowerCase())) {
                    document.getElementById("libraryStatus").style.display = "none";
                    addLibraryNovelHolder(x, libObj.novels[x]['novelName'], libObj.novels[x]['novelCoverSrc'], libObj.novels[x]['novelLink'], libObj.novels[x]['totalChapters'], libObj.novels[x]['source'])
                }
            }
        } else {
            document.getElementById("libraryStatus").style.display = "block";
        }
    } else {
        loadLibrary();
    }
}

function loadLibrary() {
    $('#libraryNovelList').html("");
    libraryCancelSearch.style.display = "none";

    if(libObj.novels[0] !== undefined) { 
        for(x in libObj.novels) {
            addLibraryNovelHolder(x, libObj.novels[x]['novelName'], libObj.novels[x]['novelCoverSrc'], libObj.novels[x]['novelLink'], libObj.novels[x]['totalChapters'], libObj.novels[x]['source'])
        }
    } else {
        document.getElementById("libraryStatus").style.display = "block";
    }
}

function addLibraryNovelHolder(id, novelName, novelCover, novelLink, totalChapters, novelSource) {
    novelHolder = "<li id=\"" + novelLink + "\">"
    novelHolder += "<div class=\"libraryNovelHolder\">"
    novelHolder += "<img class=\"novelCover\" src=\"" + novelCover + "\" onerror=\"this.src='assets/rsc/missing-image.png'\" border=\"0\" alt=\"\">"
    novelHolder += "<div class=\"novel-info\">"
    novelHolder += "<strong>" + novelName + "</strong>"
    novelHolder += "</div>"
    novelHolder += "<div class=\"novel-control\">"
    novelHolder += "<button class=\"libraryDownloadButton\" type=\"button\">DOWNLOAD</button>"
    novelHolder += "<button class=\"libraryOpenFolderButton\" type=\"button\">OPEN FOLDER</button>"
    novelHolder += "<button class=\"libraryRemoveButton\" type=\"button\">REMOVE FROM LIBRARY</button>"
    novelHolder += "<button class=\"libraryCancelButton\" type=\"button\">CANCEL</button>"
    novelHolder += "<div class=\"progressBar\">"
    novelHolder += "<div class=\"loaderBar\"></div>"
    novelHolder += "</div>"
    novelHolder += "</div>"
    novelHolder += "</div>"
    novelHolder += "</li>"

    document.getElementById("libraryStatus").style.display = "none";
    $('#libraryNovelList').append(novelHolder);
    
    let holder = document.getElementById(novelLink);
    holder.getElementsByClassName("libraryRemoveButton")[0].addEventListener('click', function() {removeFromLibrary(novelLink); loadLibrary();})

    if(libObj.novels[id]['downloaded'] === "true") {
        holder.getElementsByClassName("libraryOpenFolderButton")[0].style.display = "block";
        holder.getElementsByClassName("libraryOpenFolderButton")[0].addEventListener('click', function() {shell.openItem(libObj.novels[id]['folderPath']);})

        holder.getElementsByClassName('libraryDownloadButton')[0].innerHTML = "UPDATE";
        holder.getElementsByClassName('libraryDownloadButton')[0].style.background = '#0c2852';
        holder.getElementsByClassName("libraryDownloadButton")[0].addEventListener('click', function() {downloadNovel(novelName, novelCover, novelLink, totalChapters, novelSource, "true");})
    } else {
        holder.getElementsByClassName("libraryDownloadButton")[0].addEventListener('click', function() {downloadNovel(novelName, novelCover, novelLink, totalChapters, novelSource, "false");})
    }

    if(libObj.novels[id]['status'] === "downloading") {
        holder.getElementsByClassName('progressBar')[0].style.display = "block";
        holder.getElementsByClassName('libraryDownloadButton')[0].innerHTML = "DOWNLOADING!";
        holder.getElementsByClassName('libraryDownloadButton')[0].style.background = '#4CAF50';
    }
}

async function writeToLibrary(novelName, imgSrc, novelLink, totalChapters, source) {
    for(x in libObj.novels) {
        if(libObj.novels[x]['novelLink'] === novelLink) {
            console.log("Already Exists!");
            return;
        }
    }
    libObj.novels.push({'novelName': novelName, 'novelCoverSrc': imgSrc, 'novelLink': novelLink, 'totalChapters': totalChapters, 'source': source, 'status': 'none', 'downloaded': 'false', 'folderPath': 'none'}); //add some data
    saveLibObj();
}

function removeFromLibrary(novelLink) {
    for(x in libObj.novels) {
        if(libObj.novels[x]['novelLink'] == novelLink) {
            if(libObj.novels[x]['status'] === "downloading") {
                cancelDownload(libObj.novels[x]['folderPath'] + '/alert')
            }
            libObj.novels.splice(x, 1);
            saveLibObj();
            break;
        }
    }
}

function saveLibObj() {
    let json = JSON.stringify(libObj); //convert it back to json
    if(json.slice(-2,) === "}}") {
        json = json.slice(0, -1);
    }
    fs.writeFile("library.json", json, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("File saved successfully!");
    }); // write it back 
}