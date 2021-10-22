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
    $.getJSON("https://jovemnerd.com.br/wp-json/jovemnerd/v1/nerdcasts/?id=" +
        $("[rel='shortlink']")[0].href.split("=")[1],
        function (data) {
            insertions = data.insertions;
            if (insertions.length > 0) {
                buildGallery(insertions);
            }
        }
    );
    
}

function buildGallery(insertions) {
    var pswpElement = $('.pswp')[0].cloneNode(true);
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

    insertionsDiv = $("<div></div>");
    insertionsDiv.addClass("extra-item");
    insertionsDiv.attr("id", "insertions");
    insertionsDiv.append($("<h2>Inserções</h2>"));
    pswpElement.classList.add("tns-ovh");
    insertionsDiv.append(pswpElement);
    
    $(".content").append(insertionsDiv);
    
    gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
    gallery.init();
    mainChecks();
}

function mainChecks() {
    setInterval(function () {
        var currentTime = $("#podcastCurrentTimeText").text().split(':')
        currentTime = (+currentTime[0]) * 60 * 60 + (+currentTime[1]) * 60 + (+currentTime[2]);
        insertions.forEach(function (insertion) {
            if (currentTime >= insertion["start-time"] && currentTime <= insertion["end-time"]) {
                if (!showingInsertion) {
                    chrome.storage.sync.get(["useSound", "showInsertions"],
                    function (options) {
                        if (options.useSound) {
                            audio.play()
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
                insertionsDiv.removeClass("hide-gallery");
                insertionsDiv.addClass("show-gallery");
            } else {
                insertionsDiv.removeClass("show-gallery");
                insertionsDiv.addClass("hide-gallery");
            }
        }
    );
}


$(document).ready(function () {

    getInsertions();

});
