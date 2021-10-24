var insertions;
var jumpToTime;
var gallery;
var showingInsertion = false;
var currentId = -1;
var vitrine = document.querySelector(".image img").src;
var audio = new Audio(chrome.runtime.getURL("assets/sounds/click.mp3"));
var insertionsDiv;
var skipButton;

function callApi() {
    var url = "https://jovemnerd.com.br/wp-json/jovemnerd/v1/nerdcasts/?id=" +
        document.querySelector("[rel='shortlink']").href.split("=")[1];
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function () {
        if (xhr.status === 200) {
            jumpToTime = xhr.response["jump-to-time"];
            insertions = xhr.response.insertions;
            if (jumpToTime.test != '') {
                buildSkipButton(jumpToTime);
            }
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

function buildSkipButton() {
    var progressBar = document.getElementById("podcastProgressBarInput");
    skipButton = document.createElement("button");
    skipButton.setAttribute("id", "skip-button");
    skipButton.setAttribute("style", "display: none;")
    skipButton.textContent = "PULAR EMAILS E CANELADAS";
    document.querySelector(".card-custom .image").setAttribute("style", "display: grid;")
    document.querySelector(".card-custom .image").appendChild(skipButton);
    skipButton.onclick = function () {
        progressBar.value = jumpToTime["end-time"];
        progressBar.dispatchEvent(new Event('change'));
    }
}

// Verifica se as configurações da galeria foram mudadas, já que eu não consigo manipular o DOM
// direto daquele popup.
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

function mainChecks() {

    var playerContainer = document.getElementById("podcastPlayerContainer");

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

        //Evento para pular emails e caneladas. Mas fica disponível desde o início do episódio
        chrome.storage.sync.get(["skipEmails"], function (options) {      
            if (options.skipEmails &&
                playerContainer.getAttribute("style") == "display: block;" &&
                currentTime <= jumpToTime["end-time"] - 1) {
                if (skipButton.getAttribute("style") == "display: none;") {
                    skipButton.setAttribute("style", "display: inherit;");
                }
            } else {
                skipButton.setAttribute("style", "display: none;");
            }
        });

    }, 100);
}

window.onload = function () {
    callApi();
}
