var insertions;
var gallery;
var showingInsertion = false;
var currentId = -1;
var vitrine = document.querySelector(".image img").src;
var audio = new Audio(chrome.runtime.getURL("assets/sounds/click.mp3"));
var activateInsertions;
var playSounds;
var insertionsDiv;

function getInsertions() {
    var url = "https://jovemnerd.com.br/wp-json/jovemnerd/v1/nerdcasts/?id=" +
        document.querySelector("[rel='shortlink']").href.split("=")[1];
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function () {
        var status = xhr.status;
        if (status === 200) {
            insertions = xhr.response.insertions;
            if (insertions.length > 0) {
                buildGallery(insertions);
            }
        } else {
            console.log("Erro ao acessar a API: " + xhr.response);
        }
    };
    xhr.send(); 
}

function buildGallery(insertions) {
    var pswpElement = document.getElementsByClassName('pswp')[0].cloneNode(true);
    var items = [];
    insertions.forEach(function (insertion, index) {
        insertion.id = index;
        items.push({
            src: insertion.image,
            w: 752,
            h: 562
        });
    });

    var options = {
        history: !1,
        mainClass: "pswp--minimal--dark",
        counterEl: !1,
        shareEl: !1,
        modal: false,
        closeElClasses: [], 
    };

    insertionsDiv = document.createElement("div");
    insertionsDiv.classList.add("extra-item");
    insertionsDiv.setAttribute("id", "insertions");
    insertionsDiv.innerHTML = "<h2>Inserções</h2>";
    pswpElement.classList.add("tns-ovh");
    insertionsDiv.appendChild(pswpElement);

    document.getElementsByClassName("content")[0].appendChild(insertionsDiv);
    
    gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
    gallery.init();
    mainChecks();
}

function mainChecks() {
    setInterval(function () {
        var currentTime = document.getElementById("podcastCurrentTimeText").textContent.split(':')
        currentTime = (+currentTime[0]) * 60 * 60 + (+currentTime[1]) * 60 + (+currentTime[2]);
        insertions.forEach(function (insertion) {
            if (currentTime >= insertion["start-time"] && currentTime <= insertion["end-time"]) {
                if (!showingInsertion) {
                    chrome.storage.sync.get(["useSound", "showInsertions"],
                    function (options) {
                        if (options.useSound) {
                            audio.play();
                        }
                        if (options.showInsertions) {
                            document.querySelector(".image img").src = insertion.image;
                            showingInsertion = true;
                            currentId = insertion.id;
                        }
                    });
                }

            } else if (showingInsertion && insertion.id == currentId) {
                showingInsertion = false;
                document.querySelector(".image img").src = vitrine;
            }
        })

        changeGallery();

    }, 100);
}

function changeGallery() {
    chrome.storage.sync.get(["showGallery"],
        function (options) {
            if (options.showGallery) {
                insertionsDiv.classList.remove("hide-gallery");
                insertionsDiv.classList.add("show-gallery");
            } else {
                insertionsDiv.classList.remove("show-gallery");
                insertionsDiv.classList.add("hide-gallery");
            }
        }
    );
}

window.onload = function () {
    getInsertions();
}
