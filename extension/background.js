chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        showGallery: true,
        useSound: true,
        showInsertions: true,
        skipEmails: true,
        extraTime: true,
    });
});
