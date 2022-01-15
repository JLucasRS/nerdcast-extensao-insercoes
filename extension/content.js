var insertions;
var jumpToTime;
var gallery;
var insertionsDiv;
var skipButton;
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
            insertions.sort(function (first, second) {
                return first["start-time"] - second["start-time"];
            });
            if (jumpToTime.test != '') {
                buildSkipButton();
            }
            if (insertions.length > 0) {
                buildGallery();
            }
        } else {
            console.log("Erro ao acessar a API: " + xhr.response);
        }

        mainChecks();
    };
    xhr.send();
}

//Função que converte uma string "HH:MM:SS" para uma inteiro "segundos"
function convertToSeconds(time) {
    time = time.split(":");
    var seconds = (+time[0]) * 60 * 60 + (+time[1]) * 60 + (+time[2]);
    return seconds;
}

//Função que converte um inteiro "segundos" para uma string "HH:MM:SS"
function convertToDateTime(seconds) {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
}

function moveProgressBarTo(seconds) {
    var progressBar = document.getElementById("podcastProgressBarInput");
    progressBar.value = seconds;
    progressBar.dispatchEvent(new Event('change'))
}


function playerOpened() {
    return document.getElementById("podcastPlayerContainer").getAttribute("style") == "display: block;";
}


function updateInsertionTime(extraTimeAdded) {
    insertions.forEach(function (insertion, index) {
        if (extraTimeAdded) {
            if (insertion["original-start-time"] != undefined) {
                insertion["start-time"] = insertion["original-start-time"];
            }
            if (insertion["original-end-time"] != undefined) {
                insertion["end-time"] = insertion["original-end-time"];
            }

        } else {
            if (insertions[index - 1] != undefined) {
                if (insertion["start-time"] - 5 > insertions[index - 1]["end-time"]) {
                    insertion["original-start-time"] = insertion["start-time"];
                    insertion["start-time"] -= 5;
                }
            }
            if (insertions[index + 1] != undefined) {
                if (insertion["end-time"] + 5 < insertions[index + 1]["start-time"]) {
                    insertion["original-end-time"] = insertion["end-time"];
                    insertion["end-time"] += 5;
                }
            }
        }
        start = convertToDateTime(insertion["start-time"]);
        end = convertToDateTime(insertion["end-time"]);
        gallery.items[index].title = `Inserção entre <a>${start} e ${end}.<a/>`;
    });

    gallery.ui.update();
}

function buildGallery() {
    var pswpElement = document.getElementsByClassName('pswp')[0].cloneNode(true);
    var items = [];
    
    insertions.forEach(function (insertion, index) {
        insertion.id = index;
        start = convertToDateTime(insertion["start-time"])
        end = convertToDateTime(insertion["end-time"])
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
        if (event.target.nodeName == "A" && playerOpened()) {
            var timeString = caption.querySelector("a").textContent.split(' e ')[0];
            moveProgressBarTo(convertToSeconds(timeString));
            vitrine.scrollIntoView({
                block: 'end',
                behavior: 'smooth'
            });
        }
    });
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
    var currentTime = 0;
    const audio = new Audio(chrome.runtime.getURL("assets/sounds/click.mp3"));
    var extraTimeAdded = false;

    setInterval(function () {

        // Gambiarra pra manter o tempo passando mesmo quando a aba não está focada.
        if (!document.hidden) {
            currentTime = convertToSeconds(document.getElementById("podcastCurrentTimeText").textContent);
        } else if (playerOpened() && document.getElementsByClassName("icon-pause").length > 0) {
            currentTime = parseFloat((currentTime + 0.2).toFixed(2))
        }

        insertions.forEach(function (insertion) {
            if (currentTime >= insertion["start-time"] && currentTime <= insertion["end-time"]) {
                chrome.storage.sync.get(["useSound", "showInsertions"],
                    function (options) {
                        if (!showingInsertion) {
                            if (options.useSound) {
                                audio.play();
                            }
                            if (options.showInsertions) {
                                vitrine.src = insertion.image;
                                showingInsertion = true;
                                currentId = insertion.id;
                            }
                        }
                    }
                );

            } else if (showingInsertion && insertion.id == currentId) {
                showingInsertion = false;
                vitrine.src = imagemDaVitrine;
            }
        })

        //Botão para pular emails e caneladas. Mas fica disponível desde o início do episódio
        //Segundo "if" verifica se é necessário adicionar ou remover o tempo extra das inserções
        chrome.storage.sync.get(["skipEmails", "extraTime"],
            function (options) {
                if (options.skipEmails && playerOpened() && currentTime <= jumpToTime["end-time"] - 1) {
                    skipButton.classList.remove("hide-element");
                    skipButton.classList.add("show-element");
                } else {
                    skipButton.classList.remove("show-element");
                    skipButton.classList.add("hide-element");
                }

                if (options.extraTime) {
                    if (!extraTimeAdded) {
                        updateInsertionTime(extraTimeAdded);
                        extraTimeAdded = true;
                    }
                } else {
                    if (extraTimeAdded) {
                        updateInsertionTime(extraTimeAdded);
                        extraTimeAdded = false;
                    }
                }
            }
        );

        changeGallery();

    }, 200);
}

window.onload = function () {
    callApi();
}
