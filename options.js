$(function () {
    var $addName = $('#addName').focus(), $noPattern = $('#noPattern'), $noEye = $('#noEye'), $list = $('#list');
    chrome.runtime.sendMessage({ r: 'getUrlList' }, function (urlList) {
        for (var i = 0; i < urlList.length; i++) {
            AddItem(urlList[i]);
        }
    });
    chrome.runtime.sendMessage({ r: 'isNoPattern' }, function (isNoPattern) {
        $noPattern[0].checked = isNoPattern;
    });
    $noPattern.click(function () {
        chrome.runtime.sendMessage({ r: 'setNoPattern', isNoPattern: $noPattern[0].checked });
    });
    chrome.runtime.sendMessage({ r: 'isNoEye' }, function (isNoEye) {
        $noEye[0].checked = isNoEye;
    });
    $noEye.click(function () {
        chrome.runtime.sendMessage({ r: 'setNoEye', isNoEye: $noEye[0].checked });
    });
    $('form').submit(function () {
        var url = $.trim($addName.val()).toLowerCase();
        if (url.length > 0) {
            AddItem(url);
            Save();
        }
        $addName.val('');
        return false;
    });
    $list.on('click', '.delete', function () {
        $(this).parent().remove();
        Save();
    });
    function Save() {
        var urlList = [];
        $('.url').each(function () { urlList.push($(this).text()); });
        chrome.runtime.sendMessage({ r: 'setUrlList', urlList: urlList });
    };
    function AddItem(url) {
        $list.append("<div class='item'><span class='delete'>X</span> <span class='url'>" + url + '</span></div>');
    }
});