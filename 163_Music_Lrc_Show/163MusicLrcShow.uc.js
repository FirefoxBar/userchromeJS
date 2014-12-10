// ==UserScript==
// @name           163 Music Irc Show
// @author         Palatoo Young
// @include        main
// @description    网易歌词秀
// @version        0.1
// ==/UserScript==


location.href === "chrome://browser/content/browser.xul" && (function(conf){

    "use strict";
    
    if(typeof neteaseLrcShow !== "undefined") return;
    
    var storage,userConf,opened;
    var neteaseLrcShow = {};
    
    neteaseLrcShow.init = function(){
        this.readConf();
        this.insertCSS();
        this.createWidget();
    }; 
    
    neteaseLrcShow.readConf = function(){
        var url = "chrome://browser/content/browser.xul";
        var ios = Components.classes["@mozilla.org/network/io-service;1"]
                  .getService(Components.interfaces.nsIIOService);
        var ssm = Components.classes["@mozilla.org/scriptsecuritymanager;1"]
                  .getService(Components.interfaces.nsIScriptSecurityManager);
        var dsm = Components.classes["@mozilla.org/dom/storagemanager;1"]
                  .getService(Components.interfaces.nsIDOMStorageManager);

        var uri = ios.newURI(url, "", null);
        var principal = ssm.getCodebasePrincipal(uri);
        storage = dsm.getLocalStorageForPrincipal(principal, "");
        
        !storage.getItem("NeteaseLyricsShow") &&
        storage.setItem("NeteaseLyricsShow",JSON.stringify(conf));
        
        return userConf = JSON.parse(storage.getItem("NeteaseLyricsShow")) || conf;    
    };

    neteaseLrcShow.createWidget = function(){
        try{
            Components.utils.import("resource:///modules/CustomizableUI.jsm");
                CustomizableUI.createWidget({
                id : "neteaseLrcShow-toolbar-button",
                className : "toolbarbutton-1 chromeclass-toolbar-additional",
                defaultArea : "nav-bar",
                removable : true,
                label : "NeteaseLrcShow",
                tooltiptext : "网易云音乐歌词秀",
                onClick : function(){
                    neteaseLrcShow.createUI();
                }
            });
        }
        catch (e){
			var navBar = document.querySelector("#nav-bar-customization-target") || 
						document.querySelector("#nav-bar");
			var nlsTbb = document.createElement("toolbarbutton");
			navBar.appendChild(nlsTbb);
			nlsTbb.id = "neteaseLrcShow-toolbar-button";
			nlsTbb.label = "NeteaseLrcShow";
			nlsTbb.className = "toolbarbutton-1 chromeclass-toolbar-additional";
			nlsTbb.addEventListener("click",function(){neteaseLrcShow.createUI()},false);
        }    
    }
    
    neteaseLrcShow.createUI = function(){
        var nt = document.querySelector("#navigator-toolbox");
        
        if(opened){
            nt.removeChild(document.querySelector("#nls-player"));
            nt.removeChild(document.querySelector("#nls-bar"));
            return opened = false;
        };
        
        var vbox = document.createElement("vhox");
        var ctrl = document.createElement("vhox");
        vbox.setAttribute("flex",1);
        vbox.id="nls-player";
        vbox.className= "hide";
        nt.appendChild(vbox);
        nt.appendChild(ctrl);

        var xulText = (function(){
/*
<html:div id="nls-setter-panel" class="hide">
<html:p><html:label>歌词大小</html:label><html:input id="nls-font" type="range" min="12" max="100"/></html:p>
<html:p><html:label>歌词透明</html:label><html:input id="nls-opacity" type="range" min="0" max="100"/></html:p>
<html:p><html:label>阴影大小</html:label><html:input id="nls-shadow-radio" type="range" min="0" max="10"/></html:p>
<html:p><html:label>歌词颜色</html:label><html:select id="nls-color"><html:option>天蓝</html:option>
<html:option>绯红</html:option><html:option>褐返</html:option><html:option>郁金</html:option></html:select>
<html:input id="nls-csm-color" type="text" placeholder="自定义颜色"/></html:p>
<html:p><html:label>阴影颜色</html:label><html:select id="nls-shadow-color"><html:option>天蓝</html:option>
<html:option>绯红</html:option><html:option>褐返</html:option><html:option>郁金</html:option></html:select>
<html:input id="nls-csm-shadowcolor" type="text" placeholder="自定义颜色"/></html:p>
<html:p><html:label>字　　体</html:label><html:select id="nls-font-family"><html:option>微软雅黑</html:option>
<html:option>微软正黑</html:option><html:option>黑体</html:option><html:option>楷体</html:option></html:select>
<html:input id="nls-csm-fontFamily" type="text" placeholder="自定义字体"/></html:p>
<html:p><html:label>歌词阴影</html:label><html:input id="nls-shadow-cb" type="checkbox"/></html:p>
<html:p><html:a id="nls-confirm">确定</html:a><html:a id="nls-default">恢复默认值</html:a></html:p>
</html:div>
<vbox id="nls-control">
<html:a id="nls-prev" alt="上一首">|←</html:a><html:a id="nls-play" alt="播放/暂停"></html:a><html:a id="nls-next" alt="下一首">→|</html:a>
<html:a id="nls-toggle">播放器</html:a><html:a id="nls-setter">设置</html:a>
<html:a id="nls-close" alt="关闭">X</html:a></vbox>
<html:h1>网易云音乐</html:h1>
*/}).toString();
        xulText = xulText.replace(/\r|\n/ig,'');
        xulText = xulText.substring(xulText.indexOf('/*')+2,xulText.length-3);
        
        vbox.innerHTML = '<iframe id="nls-iframe" src="http://music.163.com" type="content"></iframe>';
        var iframe = document.querySelector("#nls-player #nls-iframe");
        
        iframe.removeEventListener("DOMContentLoaded",neteaseLrcShow.playerMonitor,true);
        iframe.addEventListener("DOMContentLoaded",neteaseLrcShow.playerMonitor,true);
        
        ctrl.id = "nls-bar";
        ctrl.innerHTML = xulText;
        opened = true;
        this.bindUIEvent(vbox,ctrl);
    }

    neteaseLrcShow.bindUIEvent = function(vbox,ctrl){
        new DragWindow(ctrl).init();

        var ircColor = ["#38a2db","#aa2116","#0c212b","#fdb933"];
        var ircFontFamily = ["Microsoft YaHei","Microsoft JhengHei","黑体","楷体"];
        
        var control = ctrl.querySelector("#nls-control");
        var floatIrc = ctrl.querySelector("h1");
        var togglePlayer = ctrl.querySelector("#nls-toggle");
        var exitPlayer = ctrl.querySelector("#nls-close");
        var selectColor = ctrl.querySelector("#nls-color");
        var csmColor = ctrl.querySelector("#nls-csm-color");
        var shadowColor = ctrl.querySelector("#nls-shadow-color");
        var fontFamily = ctrl.querySelector("#nls-font-family");
        var csmFontFamily = ctrl.querySelector("#nls-csm-fontFamily");
        var csmShadowColor = ctrl.querySelector("#nls-csm-shadowcolor");
        var csmShadowRadio = ctrl.querySelector("#nls-shadow-radio");
        var checkShadowColor = ctrl.querySelector("#nls-shadow-cb");
        var opacity = ctrl.querySelector("#nls-opacity");
        var setIrc = ctrl.querySelector("#nls-setter");
        var setterPanel = ctrl.querySelector("#nls-setter-panel");
        var ircFontSize = ctrl.querySelector("#nls-font");
        var setterConfirm = ctrl.querySelector("#nls-confirm");
        var setterDefault = ctrl.querySelector("#nls-default");
        
        function repaintLrc(config){
            control.style.color = config.color;
            floatIrc.style.color = config.color;    
            floatIrc.style.fontSize = config.fontSize + "px";
            floatIrc.style.opacity = config.opacity;
            floatIrc.style.fontFamily = config.fontFamily;
            if(config.textShadow){
                var value = config.textShadowRadio;
                floatIrc.style.textShadow = "2px 2px " +value+ "px " +config.textShadowColor;
                return;
            }
            floatIrc.style.textShadow = "none";
        }
        
        function setPanel(config){
            ircFontSize.value = config.fontSize;
            opacity.value = config.opacity * 100;
            csmShadowRadio.value = config.textShadowRadio;
            checkShadowColor.checked = config.textShadow;
            csmColor.value = config.color;
            csmShadowColor.value = config.textShadowColor;
            csmFontFamily.value = config.fontFamily;
            if(!config.textShadow){
                csmShadowRadio.setAttribute("disabled","disabled");
                shadowColor.setAttribute("disabled","disabled");
                csmShadowColor.setAttribute("disabled","disabled");
            }
            else{
                csmShadowRadio.removeAttribute("disabled");
                shadowColor.removeAttribute("disabled");
                csmShadowColor.removeAttribute("disabled");        
            }
        }
        
        function saveConf(config){
            config.fontSize = ircFontSize.value;
            config.fontFamily = fontFamily.value;
            config.opacity = opacity.value / 100;
            config.textShadowRadio = csmShadowRadio.value;
            config.textShadow = checkShadowColor.checked;
            config.color = csmColor.value;
            config.textShadowColor = csmShadowColor.value;
            return config;
        }
        
        repaintLrc(userConf);
        setPanel(userConf);
        
        togglePlayer.addEventListener("click",function(){
            vbox.classList.contains("hide") ?
            vbox.classList.remove("hide") :
            vbox.classList.add("hide")
        },false);
        
        exitPlayer.addEventListener("click",function(){
            ctrl.parentNode.removeChild(ctrl);
            vbox.parentNode.removeChild(vbox);
            opened = false;
        },false);

        selectColor.addEventListener("change",function(){
            control.style.color = ircColor[this.selectedIndex];
            floatIrc.style.color = ircColor[this.selectedIndex];
            csmColor.value = ircColor[this.selectedIndex];
        },false);
        
        csmColor.addEventListener("blur",function(){
            if(this.value === "") return;
            control.style.color = this.value;
            floatIrc.style.color = this.value;
        },false)
        
        shadowColor.addEventListener("change",function(){
            floatIrc.style.textShadow = "2px 2px " + userConf.textShadowRadio+"px " + ircColor[this.selectedIndex];
            csmShadowColor.value = ircColor[this.selectedIndex];
        },false);
        
        fontFamily.addEventListener("change",function(){
            floatIrc.style.fontFamily = ircFontFamily[this.selectedIndex];
            csmFontFamily.value = ircFontFamily[this.selectedIndex];
        },false);
        
        csmFontFamily.addEventListener("blur",function(){
            if(this.value === "") return;
            floatIrc.style.fontFamily = this.value;
        },false)
        
        csmShadowColor.addEventListener("blur",function(){
            if(this.value === "") return;
            floatIrc.style.textShadow = "2px 2px " + userConf.textShadowRadio+"px "+ this.value;
        },false)
        
        opacity.addEventListener("input",function(){
            floatIrc.style.opacity = this.value/100;
        },false);
        
        ircFontSize.addEventListener("input",function(){
            floatIrc.style.fontSize = this.value + "px";
        },false);
        
        csmShadowRadio.addEventListener("input",function(){
            var value = this.value;
            floatIrc.style.textShadow = "2px 2px " +value+ "px "+ userConf.textShadowColor;
        },false);
        
        setIrc.addEventListener("click",function(){
            setterPanel.classList.contains("hide") ?
            setterPanel.classList.remove("hide") :
            setterPanel.classList.add("hide");
        },false);
        
        setterConfirm.addEventListener("click",function(){
            csmFontFamily.blur();
            csmShadowColor.blur();
            storage.setItem("NeteaseLyricsShow",JSON.stringify(saveConf(userConf)));
            setterPanel.classList.add("hide");
        },false);
        
        checkShadowColor.addEventListener("click",function(){
            if(!this.checked){
                shadowColor.setAttribute("disabled","disabled");
                csmShadowColor.setAttribute("disabled","disabled");
                csmShadowRadio.setAttribute("disabled","disabled");
                return floatIrc.style.textShadow = "none";
            }
            csmShadowColor.removeAttribute("disabled");
            csmShadowRadio.removeAttribute("disabled");
            shadowColor.removeAttribute("disabled");
            floatIrc.style.textShadow = "2px 2px " +userConf.textShadowRadio+ "px "+ userConf.textShadowColor;
        },false);
        
        setterDefault.addEventListener("click",function(){
            setPanel(conf);
            repaintLrc(conf);
        },false);
    }

    neteaseLrcShow.playerMonitor = function(e){
    
        if(e.target.documentURI !== "http://music.163.com/") return;
        var contentDocument = document.querySelector("#nls-player #nls-iframe").contentDocument;
        
        var control = document.querySelector("#nls-control");
        var playbar = contentDocument.querySelector(".m-playbar");
        var chromeCtrl = control.querySelectorAll("#nls-prev,#nls-play,#nls-next");
        var contentCtrl = playbar.querySelectorAll(".prv,.ply,.nxt");
        
        Array.prototype.forEach.call(chromeCtrl,function(i,j){
            i.addEventListener("click",function(){
                contentCtrl[j].click();
            },false);
        });
        
        chromeCtrl[1].addEventListener("click",function(){
            this.classList.contains("pause") ?
            this.classList.remove("pause") :
            this.classList.add("pause");
        },false);
        
        var 
            name = "",
            gLrc = [],
            gTime = [],
            now = 0;
        var floatIrc = document.querySelector("#nls-bar h1");
        var dom = {
            thide : playbar.querySelector('.f-thide'),
            time : playbar.querySelector('.time'),
            flag : playbar.querySelector('.j-flag')
        };  
        
        var _ = {
            formatIrc : function(s){
                var a = s.split('\n');
                gLrc = [];
                gTime = [];
                a.forEach(function (i) {
                    if (i) {
                        gLrc.push(i.replace(/\[\d*:\d*((\.|\:)\d*)*\]/g, ''));
                        var b = i.match(/\d*:\d*((\.|\:)\d*)*/g) [0];
                        gTime.push(_.formatTime(b));
                    }
                });        
            },

            formatTime : function(time) {
                var t = time.split(':').map(Number);
                return t[0] * 60 + t[1];
            },

            getIrc : function(id){
                var url = 'http://music.163.com/api/song/media?id=' +id+ '&version=0';
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function(){
                    if(xhr.readyState === 4 && xhr.status === 200){
                        try{
                            var rst = xhr.responseText
                            var rst = JSON.parse(rst);
                            _.formatIrc(rst.lyric);
                        }
                        catch(e){
                            gTime = [];
                        }
                    }
                }
                xhr.open("GET",url,true);
                xhr.send(null);
            },

            mutationObserver : function(target,callback){
                var MutationObserver = window.MutationObserver || window.MozMutationObserver;
                var observer = new MutationObserver(callback);
                var config = {
                    attributes: true,
                    childList: true,
                    characterData: true
                };
                observer.observe(target, config);    
            }            
        };    

        floatIrc.textContent = dom.thide ? dom.thide.textContent  : "网易云音乐";
        
        _.mutationObserver(dom.flag,function (mutations) {
            mutations.forEach(function (mutation) {
                floatIrc.textContent = name = mutation.addedNodes[0].text;
                _.getIrc(mutation.addedNodes[0].search.substr(4));
            });
        });
        
        _.mutationObserver(dom.time,function (mutations) {
            mutations.forEach(function (mutation) {
                var time = mutation.addedNodes[0].innerHTML || 
                           mutation.addedNodes[0].innerText;
                now = _.formatTime(time);
                gTime && (function(){
                    for(var i = 0,length = gTime.length;i <= length;i++){
                        if(now <= gTime[i]){
                            if( i === 0 ){
                                (floatIrc.textContent === name) ||
                                (floatIrc.textContent = name)
                                break;
                            }
                            else{
                                (floatIrc.textContent === gLrc[i-1]) ||
                                (floatIrc.textContent = gLrc[i-1])
                                break;
                            }
                        }
                    }
                })();
            });
        });
    }

    neteaseLrcShow.insertCSS = function(){
        var cssText = (function(){
/*
#neteaseLrcShow-toolbar-button{
    list-style-image: url("data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAABMLAAATCwAAAAAAAAAAAAAAANQGBQXokQUF6O4GBur/Bgbq/wYG6v8GBur/Bgbq/wYG6v8GBur/Bgbq/wYG6v8GBur/BQXo7gUF6JEAANQGBQXokAYG6v8GBur/Bgbq/wYG6v83N+7/pKT3///////u7v7/v7/6/2Zm8v8KCur/Bgbq/wYG6v8GBur/BgboiQUF6O0GBur/Bgbq/wcH6v+KivX//v7///f3/v/i4vz/pqb4/+bm/f//////ysr7/xsb7P8GBur/Bgbq/wUF6O0GBur/Bgbq/wYG6v+IiPX//////7Ky+P8fH+z/Bgbq/wYG6v8LC+r/bGzz//n5///Y2Pz/EhLr/wYG6v8GBur/Bgbq/wYG6v82Nu7//f3//7i4+f8JCer/Bgbq/xAQ6/8GBur/Bgbq/wYG6v9fX/H//////4GB9P8GBur/Bgbq/wYG6v8GBur/oKD3//z8//8jI+z/Bgbq/ycn7f//////6ur9/2Bg8v8GBur/Bwfq/9fX/P/Z2fz/Bgbq/wYG6v8GBur/Bgbq/+bm/f/Fxfr/Bgbq/wYG6v/MzPv/+/v//9PT+//8/P//Ly/t/wYG6v+srPj//f3//wYG6v8GBur/Bgbq/wYG6v/+/v//qKj4/wYG6v8bG+z//////52d9/9HR/D//////2lp8v8GBur/wcH6/+vr/f8GBur/Bgbq/wYG6v8GBur/6en9/729+f8GBur/ExPr//7+//+hoff/cXHz//////9FRe//Ojru//z8//+envf/Bgbq/wYG6v8GBur/Bgbq/62t+P/39/7/Gxvs/wYG6v+2tvn//Pz//76++f/z8/7/XFzx/+zs/f/u7v7/IiLs/wYG6v8GBur/Bgbq/wYG6v9FRe///////6am+P8GBur/Hx/s///////////////////////j4/3/Njbu/wYG6v8GBur/Bgbq/wYG6v8GBur/Bgbq/56e9///////n5/3/xIS6/+CgvT//////7Oz+f9jY/L/EBDr/wYG6v8GBur/Bgbq/wYG6v8GBur/Bgbq/wYG6v8LC+r/np73///////t7f7/hob1//////8nJ+3/CAjq/xQU6/8GBur/Bgbq/wYG6v8GBur/BQXo7QYG6v8GBur/Bgbq/wYG6v9MTPD/sLD4/2pq8v//////t7f5/9HR+//w8P7/CAjq/wYG6v8GBur/BQXo7QUF6JAGBur/Bgbq/wYG6v8GBur/Bgbq/wYG6v8KCur/lpb2//T0/v/g4Pz/aGjy/wYG6v8GBur/Bgbq/wYG6IgAANQGBQXokQUF6O0GBur/Bgbq/wYG6v8GBur/Bgbq/wYG6v8GBur/Bgbq/wYG6v8GBur/BQXo7gUF6JEAANQGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==");
}
#nls-bar{
    position: fixed;
    left: 15%;
    bottom: 0;
    width: 900px;
    cursor: move;
    height: 100px !important;
    background: none !important;
    z-index: 23333333;
}
#nls-bar h1{
    color: #38a2db;
    font-family: Arial,微软雅黑,黑体;
    text-shadow: 2px 2px 4px #000;
    text-align: center;
    font-weight: bold;
    font-size: 45px;
    max-width: 1000px;
    margin: 0 auto;
    padding-top: 15px;
}
#nls-player{
    width: 990px;
    height: 600px !important;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    position:fixed;
    z-index: 2333333;
    background: none !important;
    box-shadow: 0px 0px 5px #000;
}
#nls-player iframe#nls-iframe{
    width: 100% !important;
    height: 600px !important;
    visibility: visible;
}
#nls-player.hide{
    min-width: 0 !important;
    width: 0 !important;
    min-height: 1px !important;
    height: 1px !important;
}
#nls-player.hide iframe#nls-iframe{
    visibility: collapse !important;
}
#nls-bar:hover #nls-control{
    display:block;
}
#nls-control{
    color: #38a2db;
    position: absolute;
    left: 50%;
    top: 0;
    display: none;
    z-index: 23333334;
}
#nls-control select{
    padding-right: 10px;
    border: 0 !important;
    background: none !important;
}
#nls-control a{
    opacity: 0.75;
    font-family: 微软雅黑;
    text-shadow: 1px 1px 2px #e2e2e2;
    cursor: pointer;
    display: inline-block;
    padding: 0 8px;
    font-size: 13px;
}
#nls-control a:hover{
   opacity: 1; 
}
#nls-setter-panel{
    width: 270px;
    height: 300px;
    position: absolute;
    padding:  10px 0 0 30px;
    left: 50%;
    top: -320px;
    overflow: hidden;
    background: #ffffff;
    z-index: 23333335;
    box-shadow: 0 0 4px 0 #555;
    cursor: default;
}
#nls-setter-panel.hide{
    display:none;
}
#nls-setter-panel p{
    height: 30px;
    line-height: 30px;
    margin: 5px 0;
}
#nls-setter-panel label{
    display: inline-block;
    width: 50px;
    margin-right: 15px;
}
#nls-setter-panel a{
    display: inline-block;
    margin: 10px 10px 0 0;
    cursor: pointer;
    padding: 0 10px;
    border: 1px solid #e2e2e2;
}
#nls-setter-panel input[type="range"]{
    vertical-align: middle;
    margin: 0; 
}
#nls-shadow-radio[disabled="disabled"]{
    opacity: 0.3 !important;
}
#nls-color,#nls-shadow-color,#nls-font-family{
    width: 70px;
}
#nls-csm-color,#nls-csm-shadowcolor,#nls-csm-fontFamily{
    border: 1px solid #e2e2e2;
    margin-left: 10px;
    width: 75px;
}
#nls-play:after{
    content: "▷";
}
#nls-play.pause:after{
    content: " ‖";
}
*/}).toString();
        cssText = cssText.replace(/\r|\n/ig,'');
        cssText = cssText.substring(cssText.indexOf('/*')+2,cssText.length-3);
        var css = 'data:text/css,/*163MusicIrcShow*/' + encodeURIComponent(cssText);
        var ios = Components.classes["@mozilla.org/network/io-service;1"]
                  .getService(Components.interfaces.nsIIOService);
        var sss = Components.classes['@mozilla.org/content/style-sheet-service;1']
            .getService(Components.interfaces.nsIStyleSheetService);
        var uri = ios.newURI(css, null, null);
        sss.loadAndRegisterSheet(uri, sss.USER_SHEET);          
    }
    
    function DragWindow(target){
        var params = {
            left: 0,
            top: 0,
            currentX: 0,
            currentY: 0,
            flag: false
        };
        
        var getCss = function(o,key){
            return o.currentStyle ? 
            o.currentStyle[key] : 
            document.defaultView.getComputedStyle(o,false)[key]; 	
        };

        this.init = function(){

            params.left = getCss(target, "left");
            params.top = getCss(target, "top");

            target.onmousedown = function(event){
                params.flag = true;
                params.currentX = event.clientX;
                params.currentY = event.clientY;
            };
            
            target.onmouseup = function(){
                params.flag = false;	
                params.left = getCss(target, "left");
                params.top = getCss(target, "top");
            };
            
            target.onmousemove = function(event){
                if(event.target.nodeName === "html:input") return;
                if(params.flag){
                    var nowX = event.clientX, nowY = event.clientY;
                    var disX = nowX - params.currentX, disY = nowY - params.currentY;
                    target.style.left = parseInt(params.left) + disX + "px";
                    target.style.top = parseInt(params.top) + disY + "px";
                }
            }
        };        
    }    
    
    window.neteaseLrcShow = neteaseLrcShow;
    neteaseLrcShow.init();
    
})({
    "color": "#38a2db",
    "fontFamily": "Microsoft YaHei",
    "fontSize": 45,
    "opacity": 1,
    "textShadow": true,
    "textShadowColor": "#000000",
    "textShadowRadio": 4
});