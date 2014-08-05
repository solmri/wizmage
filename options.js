$(function () {
    var $addName = $('#addName').focus(), $noPattern = $('#noPattern'), $noEye = $('#noEye'), $list = $('#list');
    chrome.runtime.sendMessage({ r: 'getSettings' }, function (settings) {
        $noPattern[0].checked = settings.isNoPattern;
        $noEye[0].checked = settings.isNoEye;
    });
    function getUrlList() {
        chrome.runtime.sendMessage({ r: 'getUrlList' }, function (urlList) {
            $list.empty();
            for (var i = 0; i < urlList.length; i++) {
                AddItem(urlList[i]);
            }
        });
    }
    getUrlList();
    chrome.runtime.onMessage.addListener(function (request) {
        if (request.r == 'urlListModified')
            getUrlList();
    });
    $noPattern.click(function () {
        chrome.runtime.sendMessage({ r: 'setNoPattern', toggle: this.checked });
    });
    $noEye.click(function () {
        chrome.runtime.sendMessage({ r: 'setNoEye', toggle: this.checked });
    });
    $('form').submit(function () {
        var url = $.trim($addName.val()).toLowerCase();
        if (url.length > 0) {
            AddItem(url);
            chrome.runtime.sendMessage({ r: 'urlListAdd', url: url });
        }
        $addName.val('');
        return false;
    });
    $list.on('click', '.delete', function () {
        var $parent = $(this).parent();
        chrome.runtime.sendMessage({ r: 'urlListRemove', index: $parent.index() });
        $parent.remove();
    });
    function AddItem(url) {
        $list.append("<div class='item'><span class='delete'>X</span> <span class='url'>" + url + '</span></div>');
    }
});