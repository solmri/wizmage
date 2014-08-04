//global variables
var contentLoaded = false,
    showAll = false,
    headStyles = {},
    mouseOverEl = null,
    blankImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
    patternCSSUrl = 'url(' + chrome.extension.getURL("pattern.png") + ')',
    patternLightUrl = chrome.extension.getURL("pattern-light.png"),
    patternLightCSSUrl = 'url(' + patternLightUrl + ')',
    eyeCSSUrl = 'url(' + chrome.extension.getURL("eye.png") + ')',
    undoCSSUrl = 'url(' + chrome.extension.getURL("undo.png") + ')',
    tagList = ['IMG', 'DIV', 'SPAN', 'A', 'LI', 'TD', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'I', 'STRONG', 'B', 'BIG', 'BUTTON', 'CENTER', 'SECTION', 'TABLE'],
    observer = null,
    eye = null,
    elList = [],
    mouseMoved = false,
    mouseEvent = null,
    noEye,
    refreshCoordsInt = 1000;
//main event listeners - must initialise immediately to catch all events
window.addEventListener('DOMContentLoaded', DoElements);
var pollID = setInterval(function () {
    if (showAll) clearInterval(pollID);
    else if (document.head) {
        if (!contentLoaded) AddHeadStyle('body', '{opacity: 0 !important;}');
        AddHeadStyle('.wzmHide', '{opacity: 0 !important;}');
        chrome.runtime.sendMessage({ r: 'isNoPattern' }, function (isNoPattern) {
            AddHeadStyle('.wzmPatternBgImg', '{background-image: ' + (isNoPattern ? 'none' : patternCSSUrl) + ' !important; background-repeat: repeat !important;text-indent:0 !important;}');
            AddHeadStyle('.wzmPatternBgImg.wzmPatternBgImgLight', '{background-image: ' + (isNoPattern ? 'none' : patternLightCSSUrl) + ' !important;}');
        });
        clearInterval(pollID);
    }
}, 1);
chrome.runtime.sendMessage({ r: 'isNoEye' }, function (isNoEye) {
    noEye = isNoEye;
});
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
//notice when mouse has moved
document.addEventListener('mousemove', DocMouseMove);
window.addEventListener('scroll', WindowScroll);
//FUNCTIONS
function DocKeyDown(e) {
    if (mouseOverEl && e.altKey) {
        if (e.keyCode == 65 && mouseOverEl.wzmHasWizmageBG) {
            ShowEl.call(mouseOverEl);
            eye.style.display = 'none';
        } else if (e.keyCode == 90 && !mouseOverEl.wzmHasWizmageBG) {
            DoElement.call(mouseOverEl);
            eye.style.display = 'none';
        }
    }
}
function DocMouseMove(e) { mouseEvent = e; mouseMoved = true; };
function WindowScroll() { mouseMoved = true; }
//keep track of which image-element mouse if over
function mouseEntered(e) {
    DoHover(this, true, e);
    e.stopPropagation();
}
function mouseLeft(e) {
    DoHover(this, false, e);
}
//process all elements with background-image, and observe mutations for new ones
function DoElements() {
    var all = document.querySelectorAll(tagList.join());
    for (var i = 0, max = all.length; i < max; i++)
        DoElement.call(all[i]);
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
    //create eye
    eye = document.createElement('div');
    eye.style.display = 'none';
    eye.style.width = eye.style.height = '16px';
    eye.style.position = 'absolute';
    eye.style.zIndex = 1e8;
    eye.style.cursor = 'pointer';
    document.body.appendChild(eye);
    //create temporary div, to eager load background img light to avoid flicker
    var div = document.createElement('div');
    div.style.opacity = div.style.width = div.style.height = 0;
    div.className = 'wzmPatternBgImg wzmPatternBgImgLight';
    document.body.appendChild(div);
    //show body
    ContentLoaded();
    //ensure coordinates are always up to date, for CheckMousePosition
    RefreshCoords();
    window.addEventListener('scroll', RefreshCoords);
    setInterval(CheckMousePosition, 200);
}
function DoElement() {
    if (showAll) return;

    if (this.tagName != 'IMG') {
        var bgimg = getComputedStyle(this).getPropertyValue('background-image');
        if (bgimg != 'none' && this.clientWidth >= 32 && this.clientHeight >= 32 && bgimg.slice(0, 3) == 'url') {
            AddToList(this);
            DoWizmageBG(this, true);
            DoMouseEventListeners(this, true);
            var i = new Image();
            i.owner = this;
            i.onload = CheckBgImg;
            i.src = bgimg.replace(/^url\((.*)\)$/, '$1');
        }
    } else {
        AddToList(this);
        //attach load event - needed 1) as we need to catch it after it is switched for the blankImg, 2) in case the img gets changed to something else later
        DoLoadEventListener(this, true);

        //see if not yet loaded
        if (!this.complete) {
            //hide, to avoid flash until load event is handled
            DoHidden(this, true);
            return;
        }

        var elWidth = this.width, elHeight = this.height;
        if (this.src == blankImg) { //was successfully replaced
            DoHidden(this, false);
            DoWizmageBG(this, true);
        } else if (elWidth >= 32 && elHeight >= 32) { //needs to be hidden
            DoMouseEventListeners(this, true);
            if (!this.hasTitleAndSizeSetup) {
                this.style.width = elWidth + 'px';
                this.style.height = elHeight + 'px';
                if (!this.title)
                    if (this.alt)
                        this.title = this.alt;
                    else {
                        this.src.match(/([-\w]+)(\.[\w]+)?$/i);
                        this.title = RegExp.$1;
                    }
                this.hasTitleAndSizeSetup = true;
            }
            DoHidden(this, true);
            this.oldsrc = this.src;
            this.src = blankImg;
        } else { //small image
            DoHidden(this, false);
        }
    }
}
function CheckBgImg() {
    if (this.height < 32 || this.width < 32) ShowEl.call(this.owner);
    this.onload = null;
};

function AddToList(el) {
    if (elList.indexOf(el) == -1)
        elList.push(el);
}
function DoWizmageBG(el, toggle) {
    if (toggle && !el.wzmHasWizmageBG) {
        el.className += ' wzmPatternBgImg';
        el.style.webkitFilter = 'hue-rotate(' + (Math.random() * 360) + 'deg)';
        el.wzmHasWizmageBG = true;
    } else if (!toggle && el.wzmHasWizmageBG) {
        RemoveClass(el, 'wzmPatternBgImg');
        el.style.webkitFilter = '';
        el.wzmHasWizmageBG = false;
    }
}
function DoHidden(el, toggle) {
    if (toggle && !el.wzmIsHidden) {
        el.className += ' wzmHide';
        el.wzmIsHidden = true;
    } else if (!toggle && el.wzmIsHidden) {
        RemoveClass(el, 'wzmHide');
        el.wzmIsHidden = false;
    }
}
function DoMouseEventListeners(el, toggle) {
    if (toggle && !el.wzmHasMouseEventListeners) {
        el.addEventListener('mouseover', mouseEntered);
        el.addEventListener('mouseout', mouseLeft);
        el.wzmHasMouseEventListeners = true;
    } else if (!toggle && el.wzmHasMouseEventListeners) {
        el.removeEventListener('mouseover', mouseEntered);
        el.removeEventListener('mouseout', mouseLeft);
        el.wzmHasMouseEventListeners = false;
    }
}
function DoLoadEventListener(el, toggle) {
    if (toggle && !el.wzmHasLoadEventListener) {
        el.addEventListener('load', DoElement);
        el.wzmHasLoadEventListener = true;
    } else if (!toggle && el.wzmHasLoadEventListener) {
        el.removeEventListener('load', DoElement);
        el.wzmHasLoadEventListener = false;
    }
}

function DoHover(el, toggle, evt) {
    if (toggle && !el.wzmHasHover) {
        if (mouseOverEl)
            DoHover(mouseOverEl, false);
        mouseOverEl = el;
        if (el.wzmHasWizmageBG) {
            el.className += ' wzmPatternBgImgLight';
            //eye
            if (!noEye) {
                eye.style.top = (el.wzmCoords.top + el.wzmCoords.height / 2 - 8 + window.scrollY) + 'px';
                eye.style.left = (el.wzmCoords.left + el.wzmCoords.width / 2 - 8 + window.scrollX) + 'px';
                eye.style.display = 'block';
                function setupEye() {
                    eye.style.backgroundImage = eyeCSSUrl;
                    eye.onclick = function () {
                        ShowEl.call(el);
                        eye.style.backgroundImage = undoCSSUrl;
                        eye.onclick = function () {
                            DoElement.call(el);
                            setupEye();
                        }
                    }
                }
                setupEye();
            }
        }
        el.wzmHasHover = true;
    } else if (!toggle && el.wzmHasHover && (!evt || !IsMouseIn(evt, el.wzmCoords))) {
        RemoveClass(el, 'wzmPatternBgImgLight');
        eye.style.display = 'none';
        el.wzmHasHover = false;
        el.wzgManualHover = false;
        if (el == mouseOverEl)
            mouseOverEl = null;
    }
}

function RefreshCoords() {
    if (!contentLoaded || showAll) return;
    for (var i = 0, max = elList.length; i < max; i++)
        elList[i].wzmCoords = elList[i].getBoundingClientRect();
    CheckMousePosition();
    if (refreshCoordsInt < 1000 * 30)
        refreshCoordsInt += 200;
    setTimeout(RefreshCoords, refreshCoordsInt); //at the beginning the page changes quite a bit
}
function CheckMousePosition() {
    if (!mouseMoved || !contentLoaded || showAll) return;
    mouseMoved = false;
    if (mouseOverEl) {
        if (!IsMouseIn(mouseEvent, mouseOverEl.wzmCoords))
            DoHover(mouseOverEl, false);
        else if (!mouseOverEl.wzgManualHover && mouseOverEl.wzmHasWizmageBG) //if !mouseOverEl.wzmHasWizmageBG, then we hope to find better
            return;
    }
    var found = false;
    for (var i = 0, max = elList.length; i < max; i++) {
        var el = elList[i];
        if (!el.wzmCoords) continue;
        if (IsMouseIn(mouseEvent, el.wzmCoords) && (!found || el.wzmHasWizmageBG)) {
            DoHover(el, true);
            el.wzgManualHover = true;
            found = true;
            if (el.wzmHasWizmageBG)
                break; //otherwise we hope to find one with wzmHasWizmageBG
        }
    }
}
function IsMouseIn(mouseEvt, coords) {
    return mouseEvt.x >= coords.left && mouseEvt.x < coords.right && mouseEvt.y >= coords.top && mouseEvt.y < coords.bottom;
}

function ShowEl() {
    DoHidden(this, false);
    if (this.tagName == 'IMG') {
        DoLoadEventListener(this, false);
        if (this.oldsrc && this.src != this.oldsrc)
            this.src = this.oldsrc;
    }
    DoWizmageBG(this, false);
    if (showAll) {
        DoMouseEventListeners(this, false);
    }
}
function ShowImages() {
    if (showAll) return;
    showAll = true;
    document.removeEventListener('keydown', DocKeyDown);
    document.removeEventListener('mousemove', DocMouseMove);
    window.removeEventListener('scroll', WindowScroll);
    for (var i = 0, max = elList.length; i < max; i++)
        ShowEl.call(elList[i]);
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
function ContentLoaded() {
    contentLoaded = true;
    if (headStyles['body']) RemoveHeadStyle('body');
}