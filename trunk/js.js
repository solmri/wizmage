//global variables
var contentLoaded = false,
    showAll = false,
    headStyles = {},
    mouseOverEl = null,
    blankImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
    pattern = 'url(' + chrome.extension.getURL("pattern.png") + ')',
    patternLightUrl = chrome.extension.getURL("pattern-light.png"),
    patternLight = 'url(' + patternLightUrl + ')',
    tagList = ['DIV', 'SPAN', 'A', 'LI', 'TD', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'I', 'STRONG', 'B', 'BIG', 'BUTTON', 'CENTER', 'SECTION', 'TABLE'],
    observer = null;
//main event listeners - must initialise immediately to catch all events
window.addEventListener('DOMContentLoaded', DoElements);
var pollID = setInterval(function () {
    if (showAll) clearInterval(pollID);
    else if (document.head) {
        if (!contentLoaded) AddHeadStyle('body', '{opacity: 0 !important;}');
        AddHeadStyle('img', '{opacity: 0 !important;}');
        chrome.runtime.sendMessage({ r: 'isNoPattern' }, function (isNoPattern) {
            AddHeadStyle('.patternBgImg', '{background-image: ' + (isNoPattern ? 'none' : pattern) + ' !important; background-repeat: repeat !important;text-indent:0 !important;}');
            AddHeadStyle('.patternBgImg.patternBgImgLight', '{background-image: ' + (isNoPattern ? 'none' : patternLight) + ' !important;}');
        });
        AddHeadStyle('.showThisImg', '{opacity:1 !important}');
        clearInterval(pollID);
    }
}, 1);
//check if paused or excepted - if yes, show all, if no, hide body. 
chrome.runtime.sendMessage({ r: 'isExceptionOrPaused', location: window.location }, function (response) {
    if (response) ShowImages();
});
//catch 'Show Images' option from browser actions
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.r == 'showImages') ShowImages();
        else if (request.r == 'isShowImages') sendResponse(showAll);
    });
//ALT-a, ALT-z
document.addEventListener('keydown', DocKeyDown);
//FUNCTIONS
function DocKeyDown(e) {
    if (mouseOverEl && e.altKey) {
        if (e.keyCode == 65 && !mouseOverEl.elShown) {
            ShowEl.call(mouseOverEl);
        } else if (e.keyCode == 90 && mouseOverEl.elShown) {
            if (mouseOverEl.tagName == 'IMG') {
                mouseOverEl.elShown = false;
                DoImage.call(mouseOverEl);
            }
            else
                DoElement.call(mouseOverEl);
        }
    }
}
//keep track of which image-element mouse if over
function mouseEntered(e) {
    mouseOverEl = this;
    this.className += ' patternBgImgLight';
    e.stopPropagation();
}
function mouseLeft() {
    if (mouseOverEl == this) {
        mouseOverEl = null;
        RemoveClass(this, 'patternBgImgLight');
    }
}
//process all elements with background-image, and observe mutations for new ones
function DoElements() {
    var all = document.querySelectorAll(tagList.join());
    for (var i = 0, max = all.length; i < max; i++)
        DoElement.call(all[i]);
    var imgs = document.getElementsByTagName('img');
    for (var i = 0, max = imgs.length; i < max; i++)
        DoImage.call(imgs[i]);
    ContentLoaded();
    observer = new WebKitMutationObserver(function (mutations, observer) {
        for (var i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            if (m.addedNodes != null && m.addedNodes.length > 0)
                for (var j = 0; j < m.addedNodes.length; j++) {
                    var el = m.addedNodes[j];
                    if (tagList.indexOf(el.tagName) >= 0)
                        DoElement.call(el);
                    if (el.tagName == 'IMG')
                        DoImage.call(el);
                }
        }
    });
    observer.observe(document, { subtree: true, childList: true });
    //create temporary div, to eager load background img light to avoid flicker
    var div = document.createElement('div');
    div.style.opacity = div.style.width = div.style.height = 0;
    div.className = 'patternBgImg patternBgImgLight';
    document.body.appendChild(div);
}
function DoElement() {
    var bgimg = getComputedStyle(this).getPropertyValue('background-image');
    if (bgimg != 'none' && this.clientWidth >= 32 && this.clientHeight >= 32 && bgimg.slice(0, 3) == 'url') {
        this.className += ' patternBgImg';
        this.style.webkitFilter = 'hue-rotate(' + (Math.random() * 360) + 'deg)';
        if (!this.hasMouseEventListeners) {
            this.addEventListener('mouseover', mouseEntered);
            this.addEventListener('mouseout', mouseLeft);
            this.hasMouseEventListeners = true;
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
function DoImage() {
    if (showAll || this.elShown) return;

    //attach load event - needed 1) as we need to catch it after it is switched for the blankImg, 2) in case the img gets changed to something else later
    if (!this.hashasLoadEventListener) {
        this.addEventListener('load', DoImage);
        this.hasLoadEventListener = true;
    }

    //see if not yet loaded
    if (!this.complete) {
        return;
    }

    var elWidth = this.width, elHeight = this.height;
    if (this.src == blankImg) {
        this.className += ' showThisImg';
        this.style.webkitFilter = 'hue-rotate(' + (Math.random() * 360) + 'deg)';
        return;
    }
    RemoveClass(this, 'showThisImg');
    if (elWidth < 32 || elHeight < 32)
        this.className += ' showThisImg';
    else {
        if (!this.hasMouseEventListeners) {
            this.addEventListener('mouseover', mouseEntered);
            this.addEventListener('mouseout', mouseLeft);
            this.hasMouseEventListeners = true;
        }
        if (!this.hasTitleAndSizeSetup) {
            this.style.width = elWidth + 'px'; this.style.height = elHeight + 'px';
            if (!this.title)
                if (this.alt)
                    this.title = this.alt;
                else {
                    this.src.match(/([-\w]+)(\.[\w]+)?$/i);
                    this.title = RegExp.$1;
                }
            this.hasTitleAndSizeSetup = true;
        }
        if (!HasClass(this, 'patternBgImg')) this.className += ' patternBgImg';
        this.oldsrc = this.src;
        this.src = blankImg;
    }
}

function ShowEl() {
    if (this.elShown) return;
    this.elShown = true;
    if (this.tagName == 'IMG') {
        this.removeEventListener('load', DoImage);
        this.hasLoadEventListener = false;
        this.src = this.oldsrc;
    }
    RemoveClass(this, 'patternBgImg');
    this.style.webkitFilter = '';
    if (showAll) {
        this.removeEventListener('mouseover', mouseEntered);
        this.removeEventListener('mouseout', mouseLeft);
        this.hasMouseEventListeners = false;
    }
}
function ShowImages() {
    if (showAll) return;
    showAll = true;
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
function RemoveClass(el, n) { //these assume long unique class names, so no need to check for word boundaries
    el.className = el.className.replace(new RegExp('\\b' + n + '\\b'), '');
}
function HasClass(el, n) {
    new RegExp('\\b' + n + '\\b').test(el.className);
}
function ContentLoaded() {
    contentLoaded = true;
    if (headStyles['body']) RemoveHeadStyle('body');
}