function save_options() {
    var gallery = document.getElementById('gallery').checked;
    var sound = document.getElementById('sound').checked;
    var insertions = document.getElementById('insertions').checked;
    chrome.storage.sync.set({
        showGallery: gallery,
        useSound: sound,
        showInsertions: insertions
    }, function () {
        var status = document.getElementById('status');
            status.textContent = 'Opções salvas.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
    });

}

function restore_options() {
    chrome.storage.sync.get({
        showGallery: true,
        useSound: true,
        showInsertions: true
    }, function (items) {
        document.getElementById('gallery').checked = items.showGallery;
        document.getElementById('sound').checked = items.useSound;
        document.getElementById('insertions').checked = items.showInsertions;

    });
}


document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
