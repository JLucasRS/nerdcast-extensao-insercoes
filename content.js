var insertions;
var gallery;
var showingInsertion = false;
var currentId = -1;
var vitrine = document.querySelector(".image img").src;
var audio = new Audio();

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

    div = $("<div></div>");
    div.attr("class", "extra-item");
    div.attr("style", "position:relative; z-index:0");
    div.append($("<h2>Inserções</h2>"));
    div.append(pswpElement);
    $(".content").append(div);
    pswpElement.classList.add("tns-ovh");
    
    gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
    gallery.init();
    checkInsertions();
}

$(document).ready(function () {

    audio.src = chrome.runtime.getURL("click.mp3");
    getInsertions();

});


function checkInsertions() {
    setInterval(function () {
        var currentTime = $("#podcastCurrentTimeText").text().split(':')
        currentTime = (+currentTime[0]) * 60 * 60 + (+currentTime[1]) * 60 + (+currentTime[2]);
        insertions.forEach(function (insertion) {
            if (currentTime >= insertion["start-time"] && currentTime <= insertion["end-time"]) {
                if (!showingInsertion) {
                    if (insertion.sound) {
                        audio.play();
                    }
                    document.querySelector(".image img").src = insertion.image;
                    showingInsertion = true;
                    currentId = insertion.id;
                }

            } else if (showingInsertion && insertion.id == currentId) {
                showingInsertion = false;
                document.querySelector(".image img").src = vitrine;
            }
        })
    }, 100);
}
