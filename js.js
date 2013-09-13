//global variables
var contentLoaded = false,
	showAll = false,
	headStyles = {},
	mouseOverEl = null,
	blankImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
	pattern = 'url(' + chrome.extension.getURL("pattern.png") + ')',
	tagList = ['DIV', 'SPAN', 'A', 'LI', 'TD', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'I', 'STRONG', 'B', 'BIG', 'BUTTON', 'CENTER', 'SECTION', 'TABLE'],
	pleaseDo = [],
	observer = null;
//main event listeners - must initialise immediately to catch all events
window.addEventListener('DOMContentLoaded', DoElements);
document.addEventListener('beforeload', BeforeLoadEvent, true);
var pollID = setInterval(function () {
    if (showAll) clearInterval(pollID);
    else if (document.head) {
        if (!contentLoaded) AddHeadStyle('body', '{opacity: 0 !important;}');
        AddHeadStyle('img', '{opacity: 0 !important;}');
        chrome.extension.sendMessage({ r: 'isNoPattern' }, function (isNoPattern) {
            AddHeadStyle('.patternBgImg', '{background-image: ' + (isNoPattern ? 'none' : pattern) + ' !important; background-repeat: repeat !important;text-indent:0 !important;}');
        });
        AddHeadStyle('.showThisImg', '{opacity:1 !important}');
        clearInterval(pollID);
    }
}, 1);
//check if paused or excepted - if yes, show all, if no, hide body. 
chrome.extension.sendMessage({ r: 'isExceptionOrPaused', url: window.location.href }, function (response) {
    if (response) ShowImages();
});
//catch 'Show Images' option from browser actions
chrome.extension.onMessage.addListener(
	function (request, sender, sendResponse) {
	    if (request.r == 'showImages') ShowImages();
	});
//ALT-a, ALT-z
document.addEventListener('keydown', DocKeyDown);
//FUNCTIONS
function DocKeyDown(e) {
    if (mouseOverEl != null && e.altKey) {
        if (e.keyCode == 65 && !mouseOverEl.elShown) {
            ShowEl.call(mouseOverEl);
        } else if (e.keyCode == 90 && mouseOverEl.elShown) {
            if (mouseOverEl.tagName == 'IMG')
                DoImage.call(mouseOverEl);
            else
                DoElement.call(mouseOverEl);
        }
    }
}
//keep track of which image-element mouse if over
function mouseEntered(e) { mouseOverEl = this; e.stopPropagation(); }
function mouseLeft() { if (mouseOverEl == this) mouseOverEl = null; }
//process all elements with background-image, and observe mutations for new ones
function DoElements() {
    var all = document.querySelectorAll(tagList.join());
    for (var i = 0, max = all.length; i < max; i++)
        DoElement.call(all[i]);
    for (var i = 0, max = pleaseDo.length; i < max; i++)
        DoImage.call(pleaseDo[i]);
    pleaseDo = [];
    ContentLoaded();
    observer = new WebKitMutationObserver(function (mutations, observer) {
        for (var i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            if (m.addedNodes != null && m.addedNodes.length > 0)
                for (var j = 0; j < m.addedNodes.length; j++) {
                    var el = m.addedNodes[j];
                    if (tagList.indexOf(el.tagName) >= 0)
                        DoElement.call(el);
                }
        }
    });
    observer.observe(document, { subtree: true, childList: true });
}
function DoElement() {
    var bgimg = getComputedStyle(this).getPropertyValue('background-image');
    if (bgimg != 'none' && this.clientWidth >= 32 && this.clientHeight >= 32 && bgimg.slice(0, 3) == 'url') {
        this.className += ' patternBgImg';
        this.style.webkitFilter = 'hue-rotate(' + (Math.random() * 360) + 'deg)';
        if (!this.hasBeenDealtWith) {
            this.hasBeenDealtWith = true;
            this.addEventListener('mouseover', mouseEntered);
            this.addEventListener('mouseout', mouseLeft);
        }
        var i = new Image();
        i.owner = this;
        i.onload = CheckBgImg;
        i.src = bgimg.replace(/^url\((.*)\)$/, '$1');
        this.elShown = false;
    }
}
function CheckBgImg() {
    if (this.height < 32 || this.width < 32) ShowEl.call(this.owner);
    this.onload = null;
};
function BeforeLoadEvent(e) {
    if (e.target.tagName == 'IMG' && !e.target.hasLoadEventListener) {
        e.target.addEventListener('load', ImgOnLoad);
        e.target.hasLoadEventListener = true;
    }
}
function ImgOnLoad() {
    if (showAll || this.elShown) return;
    if (!contentLoaded) {
        if (pleaseDo.indexOf(this) == -1) pleaseDo.push(this);
    } else DoImage.call(this);
}
function DoImage() {
    if (this.src == blankImg) {
        this.className += ' showThisImg';
        this.style.webkitFilter = 'hue-rotate(' + (Math.random() * 360) + 'deg)';
        return;
    }
    var elWidth = this.width, elHeight = this.height;
    RemoveClass(this, 'showThisImg');
    if (elWidth < 32 || elHeight < 32)
        this.className += ' showThisImg';
    else {
        if (!this.hasBeenDealtWith) {
            this.hasBeenDealtWith = true;
            this.style.width = elWidth + 'px'; this.style.height = elHeight + 'px';
            if (!this.title)
                if (this.alt)
                    this.title = this.alt;
                else {
                    this.src.match(/([-\w]+)(\.[\w]+)?$/i);
                    this.title = RegExp.$1;
                }
            this.addEventListener('mouseover', mouseEntered);
            this.addEventListener('mouseout', mouseLeft);
        }
        if (this.className.indexOf('patternBgImg') == -1) this.className += ' patternBgImg';
        this.oldsrc = this.src;
        this.src = blankImg;
        this.elShown = false;
    }
}
function ShowEl() {
    if (this.elShown) return;
    this.elShown = true;
    if (this.tagName == 'IMG') {
        this.removeEventListener('load', ImgOnLoad);
        this.src = this.oldsrc;
    }
    RemoveClass(this, 'patternBgImg');
    this.style.webkitFilter = '';
    if (showAll) {
        this.removeEventListener('mouseover', mouseEntered);
        this.removeEventListener('mouseout', mouseLeft);
    }
}
function ShowImages() {
    if (showAll) return;
    showAll = true;
    document.removeEventListener('beforeload', BeforeLoadEvent, true);
    document.removeEventListener('keydown', DocKeyDown);
    var all = document.querySelectorAll(".patternBgImg");
    for (var i = 0, max = all.length; i < max; i++)
        ShowEl.call(all[i]);
    if (!contentLoaded) {
        window.removeEventListener('DOMContentLoaded', DoElements);
        window.addEventListener('DOMContentLoaded', ContentLoaded);
    } else {
        observer.disconnect();
    }
    for (var s in headStyles)
        RemoveHeadStyle(s);
    mouseOverEl = null;
}
function AddHeadStyle(n, s) {
    var styleel = document.createElement('style');
    styleel.type = 'text/css';
    styleel.appendChild(document.createTextNode(n + s));
    document.head.appendChild(styleel);
    headStyles[n] = styleel;
}
function RemoveHeadStyle(n) {
    document.head.removeChild(headStyles[n]);
    delete headStyles[n];
}
function RemoveClass(el, n) {
    el.className = el.className.replace(n, '');
}
function ContentLoaded() {
    contentLoaded = true;
    if (headStyles['body']) RemoveHeadStyle('body');
}