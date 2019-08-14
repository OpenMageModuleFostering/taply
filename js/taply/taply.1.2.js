(function(w,d) {
    function transitionSelect() {
      var el = d.createElement("div");
      if (el.style.WebkitTransition) return "webkitTransitionEnd";
      if (el.style.OTransition) return "oTransitionEnd";
      return 'transitionend';
    };

    w.TaplyDlg = {
        options: {
            dialogContent: '<form action="javascript:void(0)"><div class="dialog-header"><div><h4 class="modal-title taply-title">taply</h4></div></div><div class="dialog-body"><div><p>You\'ll need an iPhone 6 or above to use Apple Pay. If you have one, enter your mobile number below.</p><div class="input-field text-field "><input class="phone" name="phone" type="tel" value=""/></div><div class="input-field checkbox-field"><label for="save-mobile-number"><input class="save-phone" type="checkbox" id="save-mobile-number" value="save-mobile-number"/>&nbsp;Save mobile phone number</label></div></div></div><div class="dialog-footer"><div><button class="taply-btn-pay">Pay</button></div></div></form>',
            autoOpen: false,
            className: 'taply-dialog',
            closeBtn: true,
            content: "",
            maxWidth: 380,
            minWidth: 290,
            overlay: true
        },
        savedPhone: '',
        initialized: false,
        modal: null,
        overlay: null,
        closeBtn: null,
        transitionEnd: transitionSelect(),
        init: function(){
            if(w.TaplyDlg.phone) return;
            var t = w.TaplyDlg,dF = d.createDocumentFragment(),cH;
            if(t.overlay && t.overlay.parentNode) t.overlay.parentNode.removeChild(t.overlay);
            if(t.modal && t.modal.parentNode) t.modal.parentNode.removeChild(t.modal);
            
            if (t.options.overlay === true) {
                t.overlay = d.createElement("div");
                t.overlay.className = "taply-modal-overlay " + t.options.className;
                dF.appendChild(this.overlay);
            }
            t.modal = d.createElement("div");
            t.modal.className = "taply-modal " + t.options.className;
            t.modal.style.minWidth = t.options.minWidth + "px";
            t.modal.style.maxWidth = t.options.maxWidth + "px";
            
            cH = d.createElement("div");
            cH.className = "taply-modal-window";
            cH.innerHTML = t.options.dialogContent;
            t.content = cH;
            if (t.options.closeBtn === true) {
              t.closeBtn = d.createElement("button");
              t.closeBtn.className = "taply-modal-close close-modal";
              t.closeBtn.innerHTML = "&times;";

              t.modal.appendChild(cH).appendChild(t.closeBtn);

            } else { 
              this.modal.appendChild(cH);

            }

            dF.appendChild(t.modal);

            d.body.appendChild(dF);
            var ps = t.modal.getElementsByTagName("input");
            for ( var p=0;p<ps.length;p++ ){
                if(ps[p].type == 'tel' || ps[p].type == 'text'){
                    ps[p].addEventListener('keydown', w.Taply.check.bind(t.current), false);
                    ps[p].module = t.current;
                }
            }
            t.initializeEvents();
            
            w.TaplyDlg.initialized = true;
        },
        send: function(){
            w.Taply.send(w.TaplyDlg.current);
        },
        payLater: function(){
            w.Taply.payLater(w.TaplyDlg.current);
            w.TaplyDlg.close();
        },
                
        cancel: function(){
            w.Taply.cancel(w.TaplyDlg.current);
            w.TaplyDlg.close();
        },         
        tryagain: function(){
            w.TaplyDlg.open(w.TaplyDlg.current);
        },
        close: function() {
            var t = w.TaplyDlg;
            t.modal.className = t.modal.className.replace(" taply-modal-open", "");
            t.overlay.className = t.overlay.className.replace(" taply-modal-overlay-open","");
        },
        open: function(block) {
            
            var t = w.TaplyDlg;
            t.current = block;
            t.init();
            t.current.phone = t.content.getElementsByClassName('phone')[0];
            t.current.phone.module = block;
            t.current.save_phone = t.content.getElementsByClassName('save-phone')[0];
            if(w.Taply.savedPhone !== undefined && t.current.phone.value==''){
                t.current.phone.value=w.Taply.format(w.Taply.savedPhone);
                
                t.current.save_phone.checked = 1;
            }
            w.getComputedStyle(t.modal).height;
            t.modal.className = t.modal.className + " taply-modal-open";
            t.overlay.className = t.overlay.className + " taply-modal-overlay-open";
            setTimeout(function(){t.current.phone.focus()}, 300);
        },
        initializeEvents: function(){
            var t = w.TaplyDlg;
            var closeBtns = d.getElementsByClassName("close-modal");
            if (closeBtns) {
                for(var i=0;i<closeBtns.length;i++){
                  closeBtns[i].addEventListener('click', t.cancel.bind(t), false);
                }

            }

            if (this.overlay) {
                this.overlay.addEventListener('click', t.close.bind(t));
            }
            
            var payBtns = t.content.getElementsByClassName("taply-btn-pay");
            if(payBtns.length){
                payBtns[0].addEventListener('click', t.send.bind(t), false);
            }
            
            var payLaterBtns = t.modal.getElementsByClassName("taply-btn-pay-later");
            if(payLaterBtns.length){
                payLaterBtns[0].addEventListener('click', t.payLater.bind(t), false);
            }
                        
            var tryAgainBtns = t.content.getElementsByClassName("taply-btn-try-again");
            if(tryAgainBtns.length){
                tryAgainBtns[0].addEventListener('click', t.tryagain.bind(t), false);
            }
        },
        changeContent: function(c){
            var  b = w.TaplyDlg.content.getElementsByClassName('dialog-body')[0],n='Unknown error', f= '';
            switch(c){
                case 0:
                    n= '<div><p>' + (w.Taply.notifyMessages[c] ? w.Taply.notifyMessages[c] : n) + '</p></div>';
                    f='<div><button class="taply-btn-try-again">Try again</button></div>';
                    break;
                case 1:
                    n='<div><div class="loader"><svg xmlns="http://www.w3.org/2000/svg" width="75px" height="75px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="uil-ring"><rect x="0" y="0" width="100" height="100" fill="none" class="bk"/><defs><filter id="uil-ring-shadow" x="-100%" y="-100%" width="300%" height="300%"><feOffset result="offOut" in="SourceGraphic" dx="0" dy="0"/><feGaussianBlur result="blurOut" in="offOut" stdDeviation="0"/><feBlend in="SourceGraphic" in2="blurOut" mode="normal"/></filter></defs><path d="M10,50c0,0,0,0.5,0.1,1.4c0,0.5,0.1,1,0.2,1.7c0,0.3,0.1,0.7,0.1,1.1c0.1,0.4,0.1,0.8,0.2,1.2c0.2,0.8,0.3,1.8,0.5,2.8 c0.3,1,0.6,2.1,0.9,3.2c0.3,1.1,0.9,2.3,1.4,3.5c0.5,1.2,1.2,2.4,1.8,3.7c0.3,0.6,0.8,1.2,1.2,1.9c0.4,0.6,0.8,1.3,1.3,1.9 c1,1.2,1.9,2.6,3.1,3.7c2.2,2.5,5,4.7,7.9,6.7c3,2,6.5,3.4,10.1,4.6c3.6,1.1,7.5,1.5,11.2,1.6c4-0.1,7.7-0.6,11.3-1.6 c3.6-1.2,7-2.6,10-4.6c3-2,5.8-4.2,7.9-6.7c1.2-1.2,2.1-2.5,3.1-3.7c0.5-0.6,0.9-1.3,1.3-1.9c0.4-0.6,0.8-1.3,1.2-1.9 c0.6-1.3,1.3-2.5,1.8-3.7c0.5-1.2,1-2.4,1.4-3.5c0.3-1.1,0.6-2.2,0.9-3.2c0.2-1,0.4-1.9,0.5-2.8c0.1-0.4,0.1-0.8,0.2-1.2 c0-0.4,0.1-0.7,0.1-1.1c0.1-0.7,0.1-1.2,0.2-1.7C90,50.5,90,50,90,50s0,0.5,0,1.4c0,0.5,0,1,0,1.7c0,0.3,0,0.7,0,1.1 c0,0.4-0.1,0.8-0.1,1.2c-0.1,0.9-0.2,1.8-0.4,2.8c-0.2,1-0.5,2.1-0.7,3.3c-0.3,1.2-0.8,2.4-1.2,3.7c-0.2,0.7-0.5,1.3-0.8,1.9 c-0.3,0.7-0.6,1.3-0.9,2c-0.3,0.7-0.7,1.3-1.1,2c-0.4,0.7-0.7,1.4-1.2,2c-1,1.3-1.9,2.7-3.1,4c-2.2,2.7-5,5-8.1,7.1 c-0.8,0.5-1.6,1-2.4,1.5c-0.8,0.5-1.7,0.9-2.6,1.3L66,87.7l-1.4,0.5c-0.9,0.3-1.8,0.7-2.8,1c-3.8,1.1-7.9,1.7-11.8,1.8L47,90.8 c-1,0-2-0.2-3-0.3l-1.5-0.2l-0.7-0.1L41.1,90c-1-0.3-1.9-0.5-2.9-0.7c-0.9-0.3-1.9-0.7-2.8-1L34,87.7l-1.3-0.6 c-0.9-0.4-1.8-0.8-2.6-1.3c-0.8-0.5-1.6-1-2.4-1.5c-3.1-2.1-5.9-4.5-8.1-7.1c-1.2-1.2-2.1-2.7-3.1-4c-0.5-0.6-0.8-1.4-1.2-2 c-0.4-0.7-0.8-1.3-1.1-2c-0.3-0.7-0.6-1.3-0.9-2c-0.3-0.7-0.6-1.3-0.8-1.9c-0.4-1.3-0.9-2.5-1.2-3.7c-0.3-1.2-0.5-2.3-0.7-3.3 c-0.2-1-0.3-2-0.4-2.8c-0.1-0.4-0.1-0.8-0.1-1.2c0-0.4,0-0.7,0-1.1c0-0.7,0-1.2,0-1.7C10,50.5,10,50,10,50z" fill="#8045b8" filter="url(#uil-ring-shadow)" transform="rotate(112.363 50 50)"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" repeatCount="indefinite" dur="1s"/></path></svg></div><p>' + w.Taply.notifyMessages[c] + '</p></div>';
                    f='<div>' + (w.Taply.showPayLater? '<button class="taply-btn-pay-later">Pay later</button>' : '') + '<button class="close-modal">Cancel</button></div>'
                    break;
                default :
                    n= '<div><p>' + (w.Taply.notifyMessages[c] ? w.Taply.notifyMessages[c] : n) + '</p></div>';
            }
            w.TaplyDlg.content.getElementsByClassName('dialog-footer')[0].innerHTML = f;
            b.innerHTML = n;
            w.TaplyDlg.initializeEvents();
        }
    };
    w.TaplyModule = function(el,id){
        var t=this;
        t.id=id;
        t.el = el;
        t.type = el.attributes['data-type'] ? el.attributes['data-type'].value : 'item'; 
        
        t.phone = null;
        t.save_phone = null;
        t.view_type = el.attributes['data-view-type'] ? el.attributes['data-view-type'].value : 'popup';
        
        switch(t.view_type){
            case 'block':
                var ps = el.getElementsByTagName('input');
                if(ps.length){
                    for(var p=0;p<ps.length;p++){
                        if(ps[p].name == 'phone'){
                            t.phone = t.phone === null? ps[p] : t.phone;
                            ps[p].addEventListener('keydown', w.Taply.check.bind(t), false);
                            ps[p].module = t;
                        }
                        if(ps[p].name == 'save-phone'){
                            t.save_phone = ps[p];
                        }
                    }
                }
                
                break;
            case 'popup':
                if(w.Taply.dlg_css === undefined){
                    w.Taply.dlg_css=document.createElement("link");
                    w.Taply.dlg_css.setAttribute("rel", "stylesheet");
                    w.Taply.dlg_css.setAttribute("type", "text/css");
                    w.Taply.dlg_css.setAttribute("href", "https://www.taplycheckout.com/css/taply-dialog.1.2.css?v=1.2"); 
                    d.getElementsByTagName("head")[0].appendChild(w.Taply.dlg_css);
                }
                break;
        }
        t.btn = el.getElementsByClassName('taply-btn');
        if(t.btn.length){
            t.btn[0].onclick = function(e){
                switch(t.view_type){
                    case 'block':
                        w.Taply.send(t);
                    break;
                    case 'popup':
                        w.TaplyDlg.open(t);
                    break;
                }
                return false;
            }
        }
        t.notify = function(n){
            var txt = w.Taply.notifyMessages[n];
            switch(t.view_type){
                case 'block':
                    var ps = t.el.getElementsByClassName('note'); 
                    if(ps.length){
                        ps[0].innerHTML = '<p>' + txt + '</p>';
                    }
                break;
                case 'popup':
                    w.TaplyDlg.changeContent(n);
                break;
            }
        }
    };
    w.Taply = {
        apiurl: "https://api.taplycheckout.com/payment",
        btnClass: 'taply-block',
        modules: [],
        mask: '(___) ___-____',
        notifies:{
            invalidPhone:0,
            complete:1,
            firstTime:2,
            notInstall:3,
            serverError:4,
            notActivate:5
        },
        notifyMessages:{
            '-3': "Your transaction has been refunded.",
            '-2': "Your transaction has been deleted.",
            '-1': "Your transaction has been canceled.",
            '0' :'Please enter a valid phone number.',
            '1' :'Please complete your payment on your taply mobile app.',
            '2' :'Good news! Save $10 off your first taply transaction. Please download the taply app using the link texted to your mobile phone.',
            '3' :'Please download the taply app using the link texted to your mobile phone.',
            '4' :'Unknown error.',
            '5': 'Please activate the taply app.',
            '10': "Your transaction has been pending.",
            '11': "Your transaction has been approved.",
            '12': "Your order has been sent to your taply mobile app for checkout at a later time."
        },
        ls: function (url,f){
            var h = d.getElementsByTagName("head")[0] || d.documentElement;
            var s = d.createElement("script");
            s.src = url;
            s.onload = s.onreadystatechange = function(){
                h.removeChild(s);
            };
            h.insertBefore( s, h.firstChild );
            
        },
        format: function(p){
            var s='',k=0,m=w.Taply.mask;
            p= p.replace(/[^\d]/g,'');
            if(p.length){
                for(var i=0;i<m.length;i++){
                    if(m[i] != '_'){
                        s+=m[i]; 
                    }else{
                        if(p[k]){
                            s+= p[k++];
                        }else{
                            break;
                        }
                    }
                }
            }
            return s;
        },
        check: function(e){
            var k = e.keyCode || e.charCode;
            
            if(!e.ctrlKey && !(k > 47 && k < 58) && k != 8 && k != 9){
                e.preventDefault();
            }
            
            var v=this.phone.value,p=parseInt( v.replace(/[^\d]/g,'') ,10);
            p=isNaN(p)? '' : p.toString();
            switch(e.keyCode){
                case 9: 
                    return;
                case 13:
                    w.Taply.send(this);
                case 8:
                    return true;
                case 46:
                    p = p.substr(0,p.length-1);
                    break;
                default :
                    var c = String.fromCharCode(e.keyCode);
                    if(e.keyCode > 47 && e.keyCode < 58){
                        p = p + c;
                    }else if(e.keyCode > 95 && e.keyCode < 106){
                        p = p + (e.keyCode-96);
                    }else{
                        return false;
                    }
            } 
            this.phone.value = w.Taply.format(p);
            e.preventDefault();
            return false;
        },
        init: function(){
            w.Taply.initValues();
            var tbs = d.getElementsByClassName(w.Taply.btnClass);
            for(var i=0; i<tbs.length; i++){
                w.Taply.modules.push(new w.TaplyModule(tbs[i],w.Taply.modules.length) );
            }
        },
        initValues: function(){
            var phone = w.localStorage.getItem('taply_phone');
            if(phone){
                w.Taply.savedPhone = phone;
                var tbs = d.getElementsByClassName(w.Taply.btnClass);
                for(var i=0; i<tbs.length; i++){
                    var ps = tbs[i].getElementsByTagName('input');
                    for(var p=0;p<ps.length;p++){
                        if(ps[p].name == 'phone'){
                            ps[p].value = phone;
                        }
                        if(ps[p].name == 'save-phone'){
                            ps[p].checked = 1;
                        }
                    }
                }
            }
        },
        getCookie: function (name) {
            var matches = document.cookie.match(new RegExp(
              "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
            ));
            return matches ? decodeURIComponent(matches[1]) : undefined;
        },
        getParamStr: function(block,er){
            var p='';
            switch(block.type){
                case 'item':
                    p = "&iuid=" + block.el.attributes['data-iuid'].value;
                    break;
                case 'cart': 
                    if(block.el.attributes['data-shop'] && block.el.attributes['data-shop'].value === 'shopify'){
                       var cart = JSON.parse(block.el.attributes['data-cart'].value);
                       cart.shopify_cart = w.Taply.getCookie('cart');
                       cart.shopify_digest = w.Taply.getCookie('storefront_digest');
                       block.el.attributes['data-cart'].value = JSON.stringify(cart);
                    }
                    p = "&cart=" + encodeURIComponent(block.el.attributes['data-cart'].value);
                    break;
                case 'auto':
                break;
            }
            
            p += '&phone=' + block.phone.value.replace(/[\W_]/g,'')+ "&save_phone=" + (block.save_phone.checked? 1:0) + "&block_id=" + block.id;
            return p; 
        },
        verify: function(block){
            var pattern = new RegExp(/\(?([0-9]{3})\)?[\s]{0,1}[0-9]{3}[-]?[0-9]{4}/);
            if(!pattern.test(block.phone.value)){
                block.notify(w.Taply.notifies.invalidPhone);
                return false;
            }
            return true;
        },
        send: function(block){
            clearInterval(w.Taply.ch);
            if(block.save_phone.checked){
                w.Taply.savedPhone = block.phone.value;
                w.localStorage.setItem('taply_phone',w.Taply.savedPhone);
            }
            if(w.Taply.verify(block)){
                w.Taply.ls(w.Taply.apiurl + '/add?callback=Taply.checkResponse' + w.Taply.getParamStr(block));
            }
        },
        cancel: function(block){
            clearInterval(w.Taply.ch);
            if(block.pid){
                w.Taply.ls(w.Taply.apiurl + "/cancel?callback=n&payment=" + block.pid);
                block.initialized = false;
            }
        },
        payLater: function(block){
            clearInterval(w.Taply.ch);
            if(block.pid){
                w.Taply.ls(w.Taply.apiurl + (w.Taply.showPayLater? '/paylater' : '/cancel' ) + "?callback=n&payment=" + block.pid);
                block.initialized = false;
            }
        },
        checkResponse: function(data){
            var el, n='';
            if(data.result !== undefined){
                el = w.Taply.modules[data.result.block_id];
            }
            if(data.status == "success"){
                if(el === undefined){
                    return;
                }
                w.Taply.showPayLater = data.result.pay_later_button;
                if (data.result.payment_result){
                    n = w.Taply.notifies.complete;
                    w.Taply.ch = setInterval(w.Taply.checkPayment,1000,data.result.payment);
                }else{
                    n = w.Taply.notifies.notActivate;
                    if(data.result.firsttime){
                        n = w.Taply.notifies.firstTime;
                    }
                    if(data.result.sms_status){
                        n = w.Taply.notifies.notInstall;
                    }
                }
                
            }else{
                n=w.Taply.notifies.serverError;
                w.Taply.notifyMessages[n]='';
                for(var i=0;i<data.errors.length;i++){
                    if(data.errors[i].error_code === 'E00901'){
                        n = w.Taply.notifies.invalidPhone;
                        break;
                    }else{
                        w.Taply.notifyMessages[n]+=data.errors[i].error_message;
                    }
                }
            }
            if(el !== undefined){
                el.pid = data.result.payment;
                el.notify(n);
            }else{
                w.TaplyDlg.changeContent(n);
            }
            if(n == w.Taply.notifies.notInstall || n == w.Taply.notifies.notActivate){
                w.setTimeout(function(){
                    el.notify(1);
                    w.Taply.ch = setInterval(w.Taply.checkPayment,1000,data.result.payment);
                }, 5000);
                
            }
        },
        checkPayment: function(pid){
            w.Taply.ls(w.Taply.apiurl + "/get-payment-status?callback=Taply.checkPaymentResponse&payment=" + pid);
        },
        checkPaymentResponse: function(data){
            var n = 'Unknown Error, try later';
            if(data.status == "success"){
                if (data.result.payment_status == 0){
                    return;
                }
                if(w.TaplyDlg.current){
                    w.TaplyDlg.current.pid=null;
                }
                clearInterval(w.Taply.ch);
                n = data.result.payment_status<0? data.result.payment_status : data.result.payment_status + 10;
                if(data.result.redirect !== undefined){
                    setTimeout(function(){w.location = data.result.redirect;},3000);
                }
            }
            if(w.TaplyDlg.current){
                w.TaplyDlg.current.notify(n);
            };
        },
    };

    if(document.readyState === "complete"){
        w.Taply.init();
    }else{
        w.addEventListener('load', w.Taply.init.bind(w), false);
    }
})(window,document);