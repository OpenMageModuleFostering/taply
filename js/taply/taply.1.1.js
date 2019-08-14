(function(w,d) {
    function transitionSelect() {
      var el = d.createElement("div");
      if (el.style.WebkitTransition) return "webkitTransitionEnd";
      if (el.style.OTransition) return "oTransitionEnd";
      return 'transitionend';
    };

    w.TaplyDlg = {
        options: {
            dialogContent: '<div class="dialog-header"><div><h4 class="modal-title taply-title">taply</h4></div></div><div class="dialog-body"><div><p>Please enter your mobile phone number to complete your payment</p><div class="input-field text-field "><input class="phone" name="phone" type="tel" value=""/></div><div class="input-field checkbox-field"><input class="save-phone" type="checkbox" id="save-mobile-number" value="save-mobile-number"/> <label for="save-mobile-number">Save mobile phone number</label></div></div></div><div class="dialog-footer"><div><button class="btn pay">Pay</button></div></div>',
            autoOpen: false,
            className: 'taply-dialog',
            closeBtn: true,
            content: "",
            maxWidth: 360,
            minWidth: 280,
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
            // create modal element
            t.modal = d.createElement("div");
            t.modal.className = "taply-modal " + t.options.className;
            t.modal.style.minWidth = t.options.minWidth + "px";
            t.modal.style.maxWidth = t.options.maxWidth + "px";
            
            // create content area
            cH = d.createElement("div");
            cH.className = "taply-modal-window";
            cH.innerHTML = t.options.dialogContent;
            t.content = cH;
            // if closeBtn option is true, build a close button, append close button and content to area
            if (t.options.closeBtn === true) {
              t.closeBtn = d.createElement("button");
              t.closeBtn.className = "taply-modal-close pay-later";
              t.closeBtn.innerHTML = "Close";

              t.modal.appendChild(cH).appendChild(t.closeBtn);

            } else { 
                // append content to area
              this.modal.appendChild(cH);

            }

            // append modal to DocumentFragment
            dF.appendChild(t.modal);

            // append DocumentFragment to body
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
//        mask: function(ti){
//            if(ti.onkeydown){
//                ti.onkeydown = w.Taply.check;
//            }
//        },
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
                t.current.phone.value=w.Taply.savedPhone;
                t.current.save_phone.checked = 1;
            }
            w.getComputedStyle(t.modal).height;
            t.modal.className = t.modal.className + " taply-modal-open";
            t.overlay.className = t.overlay.className + " taply-modal-overlay-open";
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
            
            var payBtns = t.content.getElementsByClassName("btn pay");
            if(payBtns.length){
                payBtns[0].addEventListener('click', t.send.bind(t), false);
            }
            
            var payLaterBtns = t.modal.getElementsByClassName("pay-later");
            if(payLaterBtns.length){
                payLaterBtns[0].addEventListener('click', t.payLater.bind(t), false);
            }
                        
            var tryAgainBtns = t.content.getElementsByClassName("btn try-again");
            if(tryAgainBtns.length){
                tryAgainBtns[0].addEventListener('click', t.tryagain.bind(t), false);
            }
        },
        changeContent: function(c){
            var  b = w.TaplyDlg.content.getElementsByClassName('dialog-body')[0],n='Unknown error', f= '';
            switch(c){
                case 0:
                    n= '<div><p>' + (w.Taply.notifyMessages[c] ? w.Taply.notifyMessages[c] : n) + '</p></div>';
                    f='<div><button class="btn try-again">Try again</button></div>';
                    break;
                case 1:
                    n='<div><div class="loader">Loading</div><p>' + w.Taply.notifyMessages[c] + '</p></div>';
                    f='<div>' + (w.Taply.showPayLater? '<button class="btn pay-later">Pay later</button>' : '') + '<button class="btn btn-alt close-modal">Cancel</button></div>'
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
        t.type = el.attributes['data-type'] ? el.attributes['data-type'].value : 'item'; // (item, cart, auto)
        
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
                    w.Taply.dlg_css.setAttribute("href", "//www.paybytaply.com/css/taply-dialog.css"); 
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
        apiurl: "https://api.paybytaply.com/payment",
        btnClass: 'taply-block',
        modules: [],
        mask: '(___) ___-____',
        notifies:{
            invalidPhone:0,
            complete:1,
            firstTime:2,
            notInstall:3,
            serverError:4
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
            '10': "Your transaction has been pending.",
            '11': "Your transaction has been approved.",
            '12': "Your order has been sent to your taply mobile app for checkout at a later time."
        },
        ls: function (url,f){
            var h = d.getElementsByTagName("head")[0] || d.documentElement;
            var s = d.createElement("script");
            s.src = url;
            s.onload = s.onreadystatechange = f;
            h.insertBefore( s, h.firstChild );
        },
        format: function(p){
            var s='',k=0,m=w.Taply.mask;
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
            
            if(!e.ctrlKey && !(k > 47 && k < 58) && k != 8){
                e.preventDefault();
            }
            
            var v=this.phone.value,p=parseInt( v.replace(/[^\d]/g,'') ,10);
            p=isNaN(p)? '' : p.toString();
            switch(e.keyCode){
                case 13:
                    w.Taply.send(this);
                    break;
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
//            w.Taply.ls(w.Taply.apiurl + '/start?callback=Taply.initValues');
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
        getParamStr: function(block,er){
            var p='';
            switch(block.type){
                case 'item':
                    p = "&iuid=" + block.el.attributes['data-iuid'].value;
                break;
                case 'cart': 
                    p = "&cart=" + encodeURIComponent(block.el.attributes['data-cart'].value);
                break;
                case 'auto':
//                    var cart = w.Taply.getCart(block);
                break;
            }
            
            p += '&phone=' + block.phone.value.replace(/[\W_]/g,'')+ "&save_phone=" + (block.save_phone.checked? 1:0) + "&block_id=" + block.id;
            return p; //(Taply.iuid !== undefined? "&iuid=" + Taply.iuid : "&cart=" + Taply.cart) + "&cc=" + Taply.dlg.country.value + "&phone=" + Taply.dlg.phone.value.replace(/[\W_]/g,'') + "&save_phone=" + (Taply.dlg.save_phone.checked? 1:0);
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
                if (data.result.payment_result == 1){
                    n = w.Taply.notifies.complete;
                    w.Taply.ch = setInterval(w.Taply.checkPayment,1000,data.result.payment);
                }else{
                    if(data.result.firsttime){
                        n = w.Taply.notifies.firstTime;
                    }
                    n = w.Taply.notifies.notInstall;
                }
                
            }else{
                n=w.Taply.notifies.serverError;
                w.Taply.notifyMessages[n]='';
                for(var i=0;i<data.errors.length;i++){
                    if(data.errors[i].error_code === 'E00901'){
                        n = w.Taply.notifies.invalidPhone;
                        break;
                    }else{
                        w.Taply.notifyMessages[n]+=data.errors[i].error_message + '</br>';
                    }
                }
            }
            if(el !== undefined){
                el.pid = data.result.payment;
                el.notify(n);
            }else{
                alert(w.Taply.notifyMessages[n]);
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
    var css=document.createElement("style");
    css.innerHTML = ".pay-module .taply-apply-pay {background: url( //www.paybytaply.com/static/img/asset/pay-by-taply-btn-dark-wide.png ) no-repeat;display: block;float: right;height: 53px;margin-bottom: 10px;font-size: 0;width: 248px;}@media only screen and (min--moz-device-pixel-ratio: 2),only screen and (-o-min-device-pixel-ratio: 2/1),only screen and (-webkit-min-device-pixel-ratio: 2),only screen and (min-device-pixel-ratio: 2) {.pay-module .taply-apply-pay {background-image: url( //www.paybytaply.com/static/img/asset/pay-by-taply-btn-dark-wide-2x.png ); background-size: 248px 53px;}}.pay-module a {color: #6a0fa5; text-decoration: none; }.pay-module a:hover {text-decoration: underline; }.pay-module p {color: #959595; font-size: 16px; clear: both;}.pay-module h4 {color: #595959; font-size: 16px; margin-bottom: 10px; }.taply-modal button {   box-shadow: none;   }";
    d.getElementsByTagName("head")[0].appendChild(css);
    w.addEventListener('load', w.Taply.init.bind(w), false);
})(window,document);