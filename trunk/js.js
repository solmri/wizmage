function wzmMain(extensionUrl, settings, contentLoaded) {
    //global variables
    var showAll = false,
        headStyles = {},
        mouseOverEl = null,
        blankImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
        patternCSSUrl = 'url(' + extensionUrl + "pattern.png" + ')',
        patternLightUrl = extensionUrl + "pattern-light.png",
        patternLightCSSUrl = 'url(' + patternLightUrl + ')',
        eyeCSSUrl = 'url(' + extensionUrl + "eye.png" + ')',
        undoCSSUrl = 'url(' + extensionUrl + "undo.png" + ')',
        tagList = ['IMG', 'DIV', 'SPAN', 'A', 'UL', 'LI', 'TD', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'I', 'STRONG', 'B', 'BIG', 'BUTTON', 'CENTER', 'SECTION', 'TABLE', 'FIGURE', 'ASIDE', 'HEADER'],
        tagListCSS = tagList.join(),
        observer = null,
        eye = null,
        elList = [],
        mouseMoved = false,
        mouseEvent = null,
        iframes = [];
    if (contentLoaded)
        Start();
    else
        window.addEventListener('DOMContentLoaded', Start);
    var pollID = setInterval(function () {
        if (showAll) clearInterval(pollID);
        else if (document.head) {
            if (!contentLoaded) AddHeadStyle('body', '{opacity: 0 !important;}');
            AddHeadStyle('.wzmHide', '{opacity: 0 !important;}');
            AddHeadStyle('.wzmPatternBgImg', '{background-image: ' + (settings.isNoPattern ? 'none' : patternCSSUrl) + ' !important; background-repeat: repeat !important;text-indent:0 !important;}');
            AddHeadStyle('.wzmPatternBgImg.wzmPatternBgImgLight', '{background-image: ' + (settings.isNoPattern ? 'none' : patternLightCSSUrl) + ' !important;}');
            clearInterval(pollID);
        }
    }, 1);
    //catch 'Show Images' option from browser actions
    if (chrome.runtime) {
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                if (request.r == 'showImages') ShowImages();
            }
        );
    }
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
    function WindowScroll() { mouseMoved = true; CheckMousePosition(); }
    //keep track of which image-element mouse if over
    function mouseEntered(e) {
        DoHover(this, true, e);
        e.stopPropagation();
    }
    function mouseLeft(e) {
        DoHover(this, false, e);
    }
    //process all elements with background-image, and observe mutations for new ones
    function Start() {
        if (document.body.children.length == 1 && document.body.children[0].tagName == 'IMG') {
            ShowImages();
            return;
        }
        DoElements(document.body, false);
        //show body
        if (!contentLoaded)
            ContentLoaded();
        //mutation observer
        observer = new WebKitMutationObserver(function (mutations, observer) {
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                if (m.addedNodes != null && m.addedNodes.length > 0)
                    for (var j = 0; j < m.addedNodes.length; j++) {
                        var el = m.addedNodes[j];
                        if (tagList.indexOf(el.tagName) >= 0)
                            DoElements(el, true);
                        else if (el.tagName == 'IFRAME')
                            DoIframe(el);
                    }
            }
        });
        observer.observe(document, { subtree: true, childList: true });
        //create eye
        eye = document.createElement('div');
        eye.style.display = 'none';
        eye.style.width = eye.style.height = '16px';
        eye.style.position = 'fixed';
        eye.style.zIndex = 1e8;
        eye.style.cursor = 'pointer';
        eye.style.padding = '0';
        eye.style.margin = '0';
        eye.style.opacity = '.5';
        document.body.appendChild(eye);
        //create temporary div, to eager load background img light for noEye to avoid flicker
        if (settings.isNoEye) {
            var div = document.createElement('div');
            div.style.opacity = div.style.width = div.style.height = 0;
            div.className = 'wzmPatternBgImg wzmPatternBgImgLight';
            document.body.appendChild(div);
        }
        //CheckMousePosition every so often
        setInterval(CheckMousePosition, 250);
        //empty iframes
        var iframes = document.getElementsByTagName('iframe');
        for (var i = 0, max = iframes.length; i < max; i++) {
            DoIframe(iframes[i]);
        }
    }
    function DoElements(el, includeEl) {
        if (includeEl)
            DoElement.call(el);
        var all = el.querySelectorAll(tagListCSS);
        for (var i = 0, max = all.length; i < max; i++)
            DoElement.call(all[i]);
    }
    function DoIframe(iframe) {
        if (iframe.src) return;
        iframes.push(iframe);
        var doc = iframe.contentWindow.document;
        AddHeadScript(doc, extensionUrl + 'js.js', null, function () {
            AddHeadScript(doc, null, 'wzmMain(' + JSON.stringify(extensionUrl) + ',' + JSON.stringify(settings) + ', true)');
        });
    }
    function DoElement() {
        if (showAll) return;
        if (this.tagName != 'IMG') {
            var compStyle = getComputedStyle(this), bgimg = compStyle['background-image'], width = parseInt(compStyle['width']) || this.clientWidth, height = parseInt(compStyle['height']) || this.clientHeight; //as per https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle, getComputedStyle will return the 'used values' for width and height, which is always in px. We also use clientXXX, since sometimes compStyle returns NaN.
            if (bgimg != 'none' && (width == 0 || width >= 32) && (height == 0 || height >= 32) && bgimg.slice(0, 3) == 'url') { //we need to catch 0 too, as sometimes elements start off as zero
                AddToList(this);
                DoWizmageBG(this, true);
                DoMouseEventListeners(this, true);
                if (this.wzmLastCheckedSrc != bgimg) {
                    this.wzmLastCheckedSrc = bgimg;
                    var i = new Image();
                    i.owner = this;
                    i.onload = CheckBgImg;
                    i.src = bgimg.replace(/^url\((.*)\)$/, '$1');
                }
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
            } else if ((elWidth == 0 || elWidth >= 32) && (elHeight == 0 || elHeight >= 32)) { //needs to be hidden - we need to catch 0 too, as sometimes images start off as zero
                DoMouseEventListeners(this, true);
                if (!this.wzmHasTitleAndSizeSetup) {
                    this.style.width = elWidth + 'px';
                    this.style.height = elHeight + 'px';
                    if (!this.title)
                        if (this.alt)
                            this.title = this.alt;
                        else {
                            this.src.match(/([-\w]+)(\.[\w]+)?$/i);
                            this.title = RegExp.$1;
                        }
                    this.wzmHasTitleAndSizeSetup = true;
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
        if (toggle && !el.wzmHidden) {
            el.className += ' wzmHide';
            el.wzmHidden = true;
        } else if (!toggle && el.wzmHidden) {
            RemoveClass(el, 'wzmHide');
            el.wzmHidden = false;
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
        var coords = el.getBoundingClientRect();
        if (toggle && !el.wzmHasHover) {
            if (mouseOverEl && mouseOverEl != el)
                DoHover(mouseOverEl, false);
            mouseOverEl = el;
            DoHoverVisual(el, true, coords);
            el.wzmHasHover = true;
        } else if (!toggle && el.wzmHasHover && (!evt || !IsMouseIn(evt, coords))) {
            DoHoverVisual(el, false, coords);
            el.wzmHasHover = false;
            if (el == mouseOverEl)
                mouseOverEl = null;
        }
    }

    function DoHoverVisual(el, toggle, coords) {
        if (toggle && !el.wzmHasHoverVisual && el.wzmHasWizmageBG) {
            if (!settings.isNoEye) {
                //eye
                PositionEye(el, coords);
                eye.style.display = 'block';
                function setupEye() {
                    eye.style.backgroundImage = eyeCSSUrl;
                    eye.onclick = function (e) {
                        e.stopPropagation();
                        ShowEl.call(el);
                        eye.style.backgroundImage = undoCSSUrl;
                        DoHoverVisualClearTimer(el, true);
                        eye.onclick = function (e) {
                            e.stopPropagation();
                            DoElement.call(el);
                            setupEye();
                            DoHoverVisualClearTimer(el, true);
                        }
                    }
                }
                setupEye();
            } else
                el.className += ' wzmPatternBgImgLight';
            DoHoverVisualClearTimer(el, true);
            el.wzmHasHoverVisual = true;
        } else if (!toggle && el.wzmHasHoverVisual) {
            if (!settings.isNoEye)
                eye.style.display = 'none';
            else
                RemoveClass(el, 'wzmPatternBgImgLight');
            DoHoverVisualClearTimer(el, false);
            el.wzmHasHoverVisual = false;
        }
    }
    function DoHoverVisualClearTimer(el, toggle) {
        if (toggle) {
            DoHoverVisualClearTimer(el, false);
            el.wzmClearHoverVisualTimer = setTimeout(function () { DoHoverVisual(el, false); }, 2500);
        }
        else if (!toggle && el.wzmClearHoverVisualTimer) {
            clearTimeout(el.wzmClearHoverVisualTimer);
            el.wzmClearHoverVisualTimer = null;
        }
    }
    function PositionEye(el, coords) {
        eye.style.top = (coords.top < 0 ? 0 : coords.top) + 'px';
        eye.style.left = (coords.right - 16) + 'px';
    }

    function CheckMousePosition() {
        if (!mouseMoved || !mouseEvent || !contentLoaded || showAll) return;
        mouseMoved = false;
        //see if needs to defocus current
        if (mouseOverEl) {
            var coords = mouseOverEl.getBoundingClientRect();
            if (!IsMouseIn(mouseEvent, coords))
                DoHover(mouseOverEl, false);
            else if (mouseOverEl.wzmHasWizmageBG) {
                if (!mouseOverEl.wzmHasHoverVisual)
                    DoHoverVisual(mouseOverEl, true, coords);
                else {
                    DoHoverVisualClearTimer(mouseOverEl, true);
                    PositionEye(mouseOverEl, coords);
                }
                return;
            }
        }
        //find element under mouse
        var found = null;
        for (var i = 0, max = elList.length; i < max; i++) {
            var el = elList[i];
            if (IsMouseIn(mouseEvent, el.getBoundingClientRect())) {
                if (el.wzmHasWizmageBG) {
                    found = el;
                    break;
                } else if (!found)
                    found = el;
            }
        }
        if (found && (found.wzmHasWizmageBG || !mouseOverEl)) {
            DoHover(found, true);
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
        if (this.wzmCheckTimeout) {
            clearTimeout(this.wzmCheckTimeout);
            this.wzmCheckTimeout = null;
        }
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
            window.removeEventListener('DOMContentLoaded', Start);
            window.addEventListener('DOMContentLoaded', ContentLoaded);
        }
        for (var s in headStyles)
            RemoveHeadStyle(s);
        if (mouseOverEl) {
            DoHover(mouseOverEl, false);
            mouseOverEl = null;
        }
        if (eye)
            document.body.removeChild(eye);
        if (observer)
            observer.disconnect();
        if (window == top)
            chrome.runtime.sendMessage({ r: 'setColorIcon', toggle: false });
        for (var i = 0, max = iframes.length; i < max; i++)
            AddHeadScript(iframes[i].contentWindow.document, null, 'if (wzmShowImages) wzmShowImages()');
    }
    //if is a dynamic iframe, and therefore this is not a content script, then make ShowImages public
    if (!chrome.runtime)
        window.wzmShowImages = ShowImages;

    function AddHeadStyle(n, s) {
        var styleel = document.createElement('style');
        styleel.type = 'text/css';
        styleel.appendChild(document.createTextNode(n + s));
        document.head.appendChild(styleel);
        headStyles[n] = styleel;
    }
    function AddHeadScript(doc, src, code, onload) {
        var scriptel = document.createElement('script');
        scriptel.type = 'text/javascript';
        if (src)
            scriptel.src = src;
        if (code)
            scriptel.appendChild(document.createTextNode(code));
        if (onload)
            scriptel.onload = onload;
        doc.head.appendChild(scriptel);
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
}
