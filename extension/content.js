var insertions;
var jumpToTime;
var gallery;
var insertionsDiv;
var skipButton;
const playerContainer = document.getElementById("podcastPlayerContainer");
var vitrine = document.querySelector(".image img");

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
                buildGallery();
            }
        } else {
            console.log("Erro ao acessar a API: " + xhr.response);
        }
    };
    xhr.send(); 
}

//Função que converte uma string "HH:MM:SS" para uma inteiro "segundos"
function convertToSeconds(time) {
    time = time.split(":");
    var seconds = (+time[0]) * 60 * 60 + (+time[1]) * 60 + (+time[2]);
    return seconds;
}

function moveProgressBarTo(seconds) {
    var progressBar = document.getElementById("podcastProgressBarInput");
    progressBar.value = seconds;
    progressBar.dispatchEvent(new Event('change'))
}

function buildGallery() {
    var pswpElement = document.getElementsByClassName('pswp')[0].cloneNode(true);
    var items = [];
    insertions.forEach(function (insertion, index) {
        insertion.id = index;
        start = new Date(insertion["start-time"] * 1000).toISOString().substr(11, 8);
        end = new Date(insertion["end-time"] * 1000).toISOString().substr(11, 8);
        items.push({
            src: insertion.image,
            w: 752,
            h: 562,
            title: `Inserção entre <a>${start} e ${end}.<a/>`
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

    caption = document.querySelectorAll(".pswp__caption")[1];
    caption.addEventListener('click', event => {
        if (event.target.nodeName == "A" && playerContainer.getAttribute("style") == "display: block;") {
            var timeString = caption.querySelector("a").textContent.split(' e ')[0];
            moveProgressBarTo(convertToSeconds(timeString));
            vitrine.scrollIntoView();
        }
    });
    
    mainChecks();
}

function buildSkipButton() {
    var vitrineCotainer = document.querySelector(".card-custom .image");
    
    skipButton = document.createElement("button");
    skipButton.setAttribute("id", "skip-button");
    skipButton.classList.add("hide-element");
    skipButton.textContent = "PULAR INTRODUÇÃO, EMAILS E CANELADAS";
    vitrineCotainer.setAttribute("style", "display: grid;")
    vitrineCotainer.appendChild(skipButton);
    skipButton.onclick = function () {
        moveProgressBarTo(jumpToTime["end-time"]);
    }
}

// Verifica se as configurações da galeria foram mudadas, já que eu não consigo manipular o DOM
// direto daquele popup.
function changeGallery() {
    chrome.storage.sync.get(["showGallery"],
        function (options) {
            if (options.showGallery) {
                insertionsDiv.classList.remove("hide-element");
                insertionsDiv.classList.add("show-element");
            } else {
                insertionsDiv.classList.remove("show-element");
                insertionsDiv.classList.add("hide-element");
            }
        }
    );
}

function mainChecks() {
    var currentId = -1;
    var showingInsertion = false;
    var imagemDaVitrine = vitrine.src;
    const audio = new Audio(chrome.runtime.getURL("assets/sounds/click.mp3"));

    setInterval(function () {
        var currentTime = convertToSeconds(document.getElementById("podcastCurrentTimeText").textContent);

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
                        }
                    );
                }

            } else if (showingInsertion && insertion.id == currentId) {
                showingInsertion = false;
                document.querySelector(".image img").src = imagemDaVitrine;
            }
        })

        //Evento para pular emails e caneladas. Mas fica disponível desde o início do episódio
        chrome.storage.sync.get(["skipEmails"],
            function (options) {      
                if (options.skipEmails &&
                    playerContainer.getAttribute("style") == "display: block;" &&
                    currentTime <= jumpToTime["end-time"] - 1) {
                    if (skipButton.classList.contains("hide-element")){
                        skipButton.classList.remove("hide-element");
                        skipButton.classList.add("show-element");
                    }
                } else {
                    skipButton.classList.remove("show-element");
                    skipButton.classList.add("hide-element");
                }
            }
        );

        changeGallery();

    }, 100);
}


window.onload = function () {
    callApi();
}
