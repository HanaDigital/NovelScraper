function loadLibrary() {
    $('#libraryNovelList').html("");

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
    holder.getElementsByClassName("libraryDownloadButton")[0].addEventListener('click', function() {downloadNovel(novelName, novelCover, novelLink, totalChapters, novelSource);})
    holder.getElementsByClassName("libraryRemoveButton")[0].addEventListener('click', function() {removeFromLibrary(novelLink); loadLibrary();})

    if(libObj.novels[id]['downloaded'] === "true") {
        holder.getElementsByClassName("libraryOpenFolderButton")[0].style.display = "block";
        holder.getElementsByClassName("libraryOpenFolderButton")[0].addEventListener('click', function() {shell.openItem(libObj.novels[id]['folderPath']);})
    }

    if(libObj.novels[id]['status'] === "downloading") {
        holder.getElementsByClassName('progressBar')[0].style.display = "block";
        holder.getElementsByClassName('libraryDownloadButton')[0].innerHTML = "DOWNLOADING!";
        holder.getElementsByClassName('libraryDownloadButton')[0].style.background = '#4CAF50';
    }
}

function writeToLibrary(novelName, imgSrc, novelLink, totalChapters, source) {
    libObj.novels.push({'novelName': novelName, 'novelCoverSrc': imgSrc, 'novelLink': novelLink, 'totalChapters': totalChapters, 'source': source, 'status': 'none', 'downloaded': 'false', 'folderPath': 'none'}); //add some data
    saveLibObj();
}

function removeFromLibrary(novelLink) {
    for(x in libObj.novels) {
        if(libObj.novels[x]['novelLink'] == novelLink) {
            libObj.novels.splice(x, x+1);
            saveLibObj();
            cancelDownload(libObj.novels[x]['folderPath'] + '/alert')
            break;
        }
    }
}

function saveLibObj() {
    let json = JSON.stringify(libObj); //convert it back to json
    fs.writeFile("library.json", json, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("File saved successfully!");
    }); // write it back 
}