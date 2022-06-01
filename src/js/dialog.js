(function(){
    class Dialog {
        constructor(selector, options) {
            this.dataObj = null, //保存所有数据
            this.autoSearch = null, //保存执行自动搜索对象
            this.shoppList = [], //保存购物车商品列表
            this.infoList = [], //查询到的商品列表
            this.watchFlag = null, //保存表格监听事件
            this.enterFlag = 1; //保存表格回车事件状态
            this.$pElem = null;
            this.windowTime = null;
            this.init(options,(_html)=>{
                var classThis = this;
                var $el = null;
                if(selector.indexOf('#')==0){
                    selector = selector.substr(1);
                    $el = document.getElementById(selector);
                }else if(selector.indexOf('.')==0){
                    selector = selector.substr(1);
                    $el = document.getElementsByClassName(selector)[0];
                }else{
                    $el = document.getElementsByTagName(selector)[0];
                }
                $($el).append(_html);
                this.$pElem = $($el);
                this.initData();

                $(window).resize(() => {
                    if(!this.windowTime){
                        this.windowTime = setTimeout(()=>{
                            this.initDialogConter();
                        },1000)
                    }
                });
                this.initDialogConter();

                $(document)
                //关闭按钮
                .on('click','.icon-close',function(event){
                    $(this.$pElem).remove();
                })
                //常用菜单按钮
                .on('click','.btn-common',function(event){
                    $(this).addClass('active').siblings().removeClass('active');
                    $('.tips').css('display','none');
                    $('.tree-menu').css('display','block');
                })
                //快捷操作按钮
                .on('click','.btn-shortcut',function(event){
                    $(this).addClass('active').siblings().removeClass('active');
                    $('.tips').css('display','block');
                    $('.tree-menu').css('display','none');
                })
                // 控制复选框选中取消动作
                .on('click','#infoForm .chek-ipt',function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    if($(this).hasClass('chek-active')){
                        $(this).removeClass('chek-active').attr('data-value','0');
                    }else{
                        $(this).addClass('chek-active').attr('data-value','1');
                    }
                })
                // 收起当前点击的树菜单
                .on('click','.icon-dis',function(event){
                    event.preventDefault();
                    $(this).removeClass('icon-dis').addClass('icon-show').parent().parent('li').css({
                        height:'24px',
                    })
                })
                // 展开当前点击的树菜单
                .on('click','.icon-show',function(event){
                    event.preventDefault();
                    $(this).removeClass('icon-show').addClass('icon-dis').parent().parent('li').css({
                        height:'auto',
                    })
                })
                // 激活当前点击的树菜单UI 并 获取对应的数据
                .on('click','.tree-item-skin .text',function(event){
                    event.preventDefault();
                    if($(this).parent('.tree-item-skin').hasClass('active')){
                        $(this).parent('.tree-item-skin').removeClass('active');
                        classThis.addInfoList('');
                    }else{
                        $('.active').removeClass('active');
                        $(this).parent('.tree-item-skin').addClass('active');
                        var classStr = $(this).attr('data-class');
                        classThis.addInfoList(classStr);
                    }
                })
                // 搜索商品 自动搜索事件
                .on('input','.search-commodity',function(event){
                    var type = $('.auto-search').val();
                    if(type != '停止' && !classThis.autoSearch){
                        classThis.autoSearch = setTimeout(function(){
                            $('.btn-inquire').click();
                            classThis.autoSearch = null;
                        },type+'000');
                    }
                })
                // 搜索商品 键盘事件
                .on('keydown','.search-commodity',function(event){
                    if(event.keyCode == '13'){
                        var brand = $('.all-brand').val(),
                        descspec = $('.search-commodity').val();
                        classThis.searchInfoList({
                            brand:brand,
                            DescSpec_:descspec
                        });
                    }
                })
                //商品列表选中/取消
                .on('click','.info-list-body .chek-ipt',function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    $(this).parents('tr')[0].click();
                })
                //商品列表选中
                .on('click','.info-list-body tr',function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    var _this = this;
                    classThis.watchFlag = 1;
                    $(_this).addClass('active').siblings().removeClass('active');
                    var code = $(_this).attr('data-id');
                    $('.shopp-info-body tr td.active').removeClass('active');
                    classThis.infoList.some(item=>{
                        if(item['Code_'] == code){
                            if($(_this).find('.chek-ipt').attr('data-select') == '1'){ //取消选中
                                classThis.addQuantityFun();
                            }else{  //选中
                                $(_this).addClass('bg-chek');
                                $(_this).find('.chek-ipt').attr('data-select','1').addClass('chek-active');
                                classThis.addOrdelShoppInfo(1,item);
                            }
                            return false;
                        }
                    })
                })
                //添加赠品
                .on('click','.btn-free',function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    var code = $(this).parents('tr').attr('data-id'),
                        free = $(this).attr('data-free'),
                        type=0;
                    if(free != '1'){
                        // $(this).attr('data-free','0').find('.box').html('');
                    // }else{
                        type=1;
                        $(this).attr('data-free','1').find('.box').html('Yes');
                        $(this).parents('tr').addClass('bg-chek').find('.chek-ipt ').addClass('chek-active').attr('data-select',1);
                    }
                    classThis.dataObj.map(item=>{
                        if(item['Code_'] == code){
                            classThis.addOrdelShoppInfoFtee(item,type);
                            return;
                        }
                    })
                })
                //搜索商品条件的查询按钮
                .on('click','.btn-inquire',function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    var brand = $('.all-brand').val(),
                        descspec = $('.search-commodity').val();
                    classThis.searchInfoList({
                        brand:brand,
                        DescSpec_:descspec
                    });
                })
                //自动搜索下拉框事件
                .on('change','.auto-search',function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    var val = $(this).val(),
                        text = '';
                    if(val == '停止'){
                        text = '停止自动搜索';
                    }else if(val == '3'){
                        text = '执行3秒自动搜索';
                    }else if(val == '5'){
                        text = '执行5秒自动搜索';
                    }
                    $('.footer-left-text').html(text);
                })
                //购物车列表点击事件
                .on('click','.shopp-info-body tr',function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    $(this).find('.td-quantity').addClass('active').parent().siblings().find('.td-quantity').removeClass('active');
                    $('.info-list-body tr.active').removeClass('active');
                    classThis.watchFlag = 2;
                })
                //购物车列表 删除事件
                .on('click','.shopp-info-body tr .shopp-item-del-btn',function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    var _this = this;
                    var code = $(this).parents('tr').attr('data-id'),
                        free = $(this).parents('tr').attr('data-free');
                    classThis.shoppList.some(item=>{
                        if(item['Code_'] == code && free == 0){
                            classThis.delShoppList(item,free);
                            classThis.delInfoList(item,free);
                            return true;
                        }
                        if(item['Code_'] == code && free == 1){
                            classThis.delShoppListFree(item,free);
                            return true;
                        }
                    })
                })
                //取消按钮
                .on('click','.btn-cancel',function(event){
                    classThis.closeWindow();
                })
                // 确定按钮
                .on('click','.btn-confirm',function(event){
                    classThis.consoleData();
                })
                .on('keydown','#quantityID',function(event){
                        // event.stopPropagation();
                        // event.preventDefault();
                        var _this = this;
                        if (event.keyCode == '13' && $(event.target).attr('id') == 'quantityID') {
                            classThis.getInputval(_this);
                        }
                })

               

                //键盘事件监听
                $(document).keydown(function(event){
                    var keyCode = event.keyCode || event.which || event.charCode;
                        keyCode = keyCode.toString();
                    var passRow = false,
                        delRow = false;
                    if($(event.target).attr('id') == 'quantityID' || $(event.target).hasClass('search-commodity')) return;
                    if(event.altKey && keyCode == '13'){
                        classThis.consoleData();
                        return;
                    }
                    switch(keyCode){
                        case '13': //键盘Enter
                        classThis.enterEventFun();
                        break;
                        case '27': //键盘Esc
                        classThis.closeWindow();
                        break;
                        case '32': //键盘 空格键
                        $('.search-commodity').focus();
                        break;
                        case '37': //键盘左
                        classThis.scollTableRowshoppListColumn(keyCode);
                        break;
                        case '38': //键盘上
                        event.preventDefault();
                        passRow = true;
                        break;
                        case '39': //键盘右
                        classThis.scollTableRowshoppListColumn(keyCode);
                        break;
                        case '40': //键盘下
                        event.preventDefault();
                        passRow = true;
                        break;
                        case '65': //键盘A
                        classThis.triggerTableOp();
                        break;
                        case '68': //键盘D
                        classThis.triggerTableOp();
                        break;
                        case '83': //键盘S
                        event.preventDefault();
                        passRow = true;
                        break;
                        case '87': //键盘W
                        event.preventDefault();
                        passRow = true;
                        break;
                        case '46': //键盘Delete
                        delRow = true;
                        break;
                    }
                    //控制表格上下行
                    if(passRow){
                        if(classThis.watchFlag == 1){//操作商品列表
                            classThis.scollTableRowInfoList(keyCode);
                        }else if(classThis.watchFlag == 2){//操作购物车列表
                            classThis.scollTableRowshoppList(keyCode);
                        }
                    }
                    //控制表格删除行数据
                    if(delRow){
                        if(classThis.watchFlag == 1){
                            var shoppListEl = $('.shopp-info-body').find('tr');
                            var _this = $('.info-list-body tr.active');
                            var code = $(_this).attr('data-id'),
                                free = $(_this).attr('data-free'),
                                row = null;
                                for(var i=classThis.shoppList.length-1;i>=0;i--){
                                    if(classThis.shoppList[i]['Code_'] == code){
                                        delRowInfo(classThis.shoppList[i]);
                                        classThis.shoppList.splice(i,1);
                                    }
                                }
                                function delRowInfo(row){
                                    $.each(shoppListEl,function(index,el){
                                        if($(el).attr('data-id') == row['Code_']){
                                            $(el).remove();
                                        }
                                    })
                                    var infoListEl = $('.info-list-body').find('tr');
                                    $.each(infoListEl,function(index,el){
                                        if($(el).attr('data-id') == row['Code_']){
                                            $(el).find('.btn-free').attr('data-free',0);
                                            $(el).find('.btn-free .box').html('');
                                        }
                                    })
                                    classThis.delInfoList(row,0);
                                }
                            
                                return false;
                        }else if(classThis.watchFlag == 2){
                            var _this = $('.shopp-info-list .active').parent('tr'),
                                code = $(_this).attr('data-id'),
                                free = $(_this).attr('data-free'),
                                count = 0,
                                index = null;
                                temp = null;
                            for(var i=0,len= classThis.shoppList.length;i<len;i++){
                                if( classThis.shoppList[i]['Code_'] == code){
                                    count++;
                                }
                                if( classThis.shoppList[i]['Code_'] == code &&  classThis.shoppList[i]['free'] == free){
                                    temp =  classThis.shoppList[i];
                                    index=i;
                                }
                            }
                            var infoListEl = $('.info-list-body').find('tr');
                            $.each(infoListEl,function(index,el){
                                if($(el).attr('data-id') == temp['Code_']){
                                    if(count==1){
                                        $(el).removeClass('bg-chek');
                                        $(el).find('.chek-ipt').removeClass('chek-active').attr('data-select',0);
                                        $(el).find('.btn-free').attr('data-free',0).find('.box').html('');
                                    }else if(count==2){
                                        if(free == 1){
                                            $(el).find('.btn-free').attr('data-free',0).find('.box').html('');
                                        }
                                    }
                                }
                            })
                            classThis.shoppList.splice(index,1);
                            $(_this).remove();

                        }
                        setTimeout(function(){initRowNo();},200);
                    }
                    
                    if (keyCode >= '48' && keyCode <= '57' && $('.shopp-info-body tr .td-quantity').hasClass('active') && $(event.target).attr('id') != 'quantityID') {
                        var el = $('.shopp-info-body tr .td-quantity.active .quantity');
                        var code = $('.shopp-info-body tr .td-quantity').parent('tr').attr('data-id'),
                            free = $('.shopp-info-body tr .td-quantity').parent('tr').attr('data-free'),
                            temp = null,val='';
                        for(var i=classThis.shoppList.length-1;i>=0;i--){
                            if(classThis.shoppList[i]['Code_'] == code && classThis.shoppList[i]['free'] == free){
                                temp = classThis.shoppList[i];
                            }
                        }
                        
                        switch (keyCode) {
                            case '48':
                            val = parseInt($(el).text()) * 10;
                            break;
                            case '49':
                                val = 1;
                            break;
                            case '50':
                                val = 2;
                            break;
                            case '51':
                                val = 3;
                            break;
                            case '52':
                                val = 4;
                            break;
                            case '53':
                                val = 5;
                            break;
                            case '54':
                                val = 6;
                            break;
                            case '55':
                                val = 7;
                            break;
                            case '56':
                                val = 8;
                            break;
                            case '57':
                                val = 9;
                            break;
                        }
                        temp['quantity'] = val;
                        $(el).text(val);
                    }
                    
                });

            });
        }
        getInputval(el) {
            var code = $('.shopp-info-body td.active').parent('tr').attr('data-id'),
                free = $('.shopp-info-body td.active').parent('tr').attr('data-free'),
                $td = $('.shopp-info-body tr .active');
            var val = parseInt($(el).val());
            $(el).parent('.box').html(val).parent('td').addClass('active');
            $(el).remove();
            
            if($td.hasClass('td-quantity')){
              
                for(var i=0,len=this.shoppList.length;i<len;i++){
                    if(this.shoppList[i]['Code_'] == code && this.shoppList[i]['free'] == 0){
                        this.shoppList[i].quantity = val;
                    }
                    if(this.shoppList[i]['Code_'] == code && this.shoppList[i]['free'] == 1){
                        this.shoppList[i].quantity = val;
                    }
                }
             
            }else if($td.hasClass('td-price')){
                for(var i=0,len=this.shoppList.length;i<len;i++){
                    if(this.shoppList[i]['Code_'] == code && this.shoppList[i]['free'] == 0){
                        this.shoppList[i]['OriUP_'] = val;
                    }
                    if(this.shoppList[i]['Code_'] == code && this.shoppList[i]['free'] == 1){
                        this.shoppList[i]['OriUP_'] = val;
                    }
                }
            }else if($td.hasClass('td-remarks')){
                for(var i=0,len=this.shoppList.length;i<len;i++){
                    if(this.shoppList[i]['Code_'] == code && this.shoppList[i]['free'] == 0){
                        this.shoppList[i]['remarks'] = val;
                    }
                    if(this.shoppList[i]['Code_'] == code && this.shoppList[i]['free'] == 1){
                        this.shoppList[i]['remarks'] = val;
                    }
                }
            }
        }
        //初始化界面
        init(options,call){
            var _html = `<div id="app">
                <header class="title">
                    ${options.title?options.title:'对话框'}
                    <div class="dialog-btn-content">
                        <a class=""><span class="icon icon-magnify"></span></a>
                        <a class=""><span class="icon icon-close">X</span></a>
                    </div>
                </header>
                <div class="main">
                    <div class="left-tree">
                        <div class="left-tree-header-btn">
                            <a class="btn-common active">常用菜单</a>
                            <a class="btn-shortcut">快捷操作</a>
                        </div>
                        <div class="tree-menu">
                            <ul class="pad-0">
                                <li>
                                    <div class="tree-item-skin">
                                        <span class="icon icon-show tree-skin"></span>
                                        <span class="text" data-id="">所有商品</span>
                                    </div>
                                    <!-- <ul class="pad-15">
                                        <li>
                                            <div class="tree-item-skin">
                                                <span class="icon icon-show tree-skin"></span>
                                                <span class="text">钓杆类</span>
                                            </div>
                                            <ul class="pad-15">
                                                <li>
                                                    <div class="tree-item-skin">
                                                        <span class="icon icon-show tree-skin"></span>
                                                        <span class="text">钓杆类</span>
                                                    </div>
                                                </li>
                                            </ul>
                                        </li>
                                    </ul> -->
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="right-info">
                            <div class="right-info-header-btn-container">
                                <div class="right-info-header-left-input">
                                    <form action="" id="infoForm" onkeydown="if(event.keyCode==13)return false;">
                                        <div class="form-item">
                                            <label for="">商品品牌:</label>
                                            <div class="ipt">
                                                <select name="brand" id="" class="ipt-skin all-brand">
                                                    <option value="">所有商品</option>
                                                </select>
                                                </div>
                                        </div>
                                        <div class="form-item">
                                            <label for="">载入笔数:</label>
                                            <div class="ipt">
                                                <select name="strokeCount" id="" class="ipt-skin stroke-count">
                                                    <option value="">123</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="form-item">
                                            <label for="">自动搜索:</label>
                                            <div class="ipt">
                                                <select name="autoSearch" id="" class="ipt-skin auto-search">
                                                    <option value="停止">停止</option>
                                                    <option value="3">3S</option>
                                                    <option value="5">5S</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="form-item">
                                            <div class="ipt">
                                                <a class="btn btn-defualt btn-showshopprow">显示购物车行数</a>
                                            </div>
                                        </div>
                                        <div class="form-item">
                                            <label for="">搜索商品:</label>
                                            <div class="ipt">
                                                <input type="text" name="searchCommodity" class="ipt-skin search-commodity"/>
                                            </div>
                                        </div>
                                        <div class="form-item">
                                            <div class="ipt">
                                                <span class="chek-ipt" data-autocount="0"></span>
                                                选择商品时，同时输入数量
                                            </div>
                                        </div>
                                        <div class="form-item">
                                            <div class="ipt">
                                                <span class="chek-ipt" data-stock="0"></span>
                                                库存不等于0
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div class="right-info-header-right-button">
                                    <a class="btn btn-green btn-inquire">查询</a>
                                </div>
                            </div>
                            <div class="right-info-mian-info-list">
                                <table cellpadding="0">
                                    <thead>
                                        <tr>
                                            <th>选中</th>
                                            <th>品牌</th>
                                            <th>商品类别</th>
                                            <th>商品规格</th>
                                            <th>单位</th>
                                            <th>库存量</th>
                                            <th>单价</th>
                                            <th>赠品</th>
                                        </tr>
                                    </thead>
                                    <tbody align="center" class="info-list-body">
                                        <!-- <tr data-id="1">
                                            <td><div class="box"><span class="chek-ipt" data-select="0" data-row="0"></span></div></td>
                                            <td><div class="box">1</div></td>
                                            <td><div class="box">2</div></td>
                                            <td><div class="box" style="justify-content:left;">3</div></td>
                                            <td><div class="box">4</div></td>
                                            <td><div class="box">5</div></td>
                                            <td><div class="box">6</div></td>
                                            <td><div class="box"></div></td>
                                        </tr>
                                        <tr data-id="2">
                                            <td><div class="box"><span class="chek-ipt" data-select="0" data-row="0"></span></div></td>
                                            <td><div class="box">2</div></td>
                                            <td><div class="box">2</div></td>
                                            <td><div class="box" style="justify-content:left;">3</div></td>
                                            <td><div class="box">3</div></td>
                                            <td><div class="box">4</div></td>
                                            <td><div class="box">5</div></td>
                                            <td><div class="box"></div></td>
                                        </tr> -->
                                    </tbody>
                                </table>
                            </div>
                            <div class="right-info-mian-shopp-cat-container">
                                <ul class="shopp-title">
                                    <li><a class="shopp-title-btn active">购物车</a></li>
                                    <li><a class="shopp-title-btn">执行讯息</a></li>
                                </ul>
                                <div class="shopp-info-list">
                                    <table cellpadding="0">
                                    <thead>
                                        <tr>
                                        <th>序</th>
                                        <th>商品规格</th>
                                        <th>单位</th>
                                        <th>数量</th>
                                        <th>单价</th>
                                        <th>赠品</th>
                                        <th>备注</th>
                                        <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody align="center" class="shopp-info-body">
                                        <!-- <tr>
                                            <td>1</td>
                                            <td>1</td>
                                            <td>1</td>
                                            <td>1</td>
                                            <td>1</td>
                                            <td>1</td>
                                            <td>1</td>
                                            <td><a class="f-csp shopp-item-del-btn"><img src="/static/images/delete.png" alt=""></a></td>
                                        </tr> -->
                                    </tbody>
                                    </table>
                                </div>
                            </div>
                    </div>
                </div>
                <div class="footer">
                    <div class="footer-left-text">
                        停止自动搜索
                    </div>
                    <ol class="btn-list">
                        <li><a class="btn btn-defualt btn-cancel">取消</a></li>
                        <li><a class="btn btn-defualt btn-confirm">确定</a></li>
                    </ol>
                </div>
            </div>`;
            typeof call ==='function' && call(_html);
        }
        //初始化数据
        initData(){
            $.getJSON('/data.json',res=>{
                var data = res.data;
                this.dataObj = res.data;
                this.treeMenuInitFun(data);
                this.allBrandInitFun(data);
            })
        }
        //检测窗口使其剧中
        initDialogConter(){
            $('#app').css({
                transform: 'translate(-50%, -50%)',
                position: 'absolute',
                left: '50%',
                top: '50%'
            });
            this.windowTime = null;
        }
        // 初始化 所有商品下拉框选项
        allBrandInitFun(data){
            // console.log(data);
            var _html = '';
            data.map(item=>{
                _html += `<option value="${item['brand']}">${item['brand']}</option>`;
            })
            this.$pElem.find('.all-brand').append(_html);
        }
        // 初始化 常用菜单树 结构
        treeMenuInitFun(data){
            // console.log(data);
            var _html='';
            data.map(item=>{
                _html += `<ul class="pad-15">
                    <li>
                        <div class="tree-item-skin">
                            <span class="icon icon-show tree-skin"></span>
                            <span class="text" data-id="${item['Code_']}" data-class="${item['Class1_']}">${item['Class1_']}</span>
                        </div>
                    </li>
                </ul>`;
            })
            this.$pElem.find('.tree-menu .pad-0>li').append(_html);
        }
        // 根据商品列表选中或取消的操作 增加删除shopp列表数据
        addOrdelShoppInfo(type,row,free){
            free = 0;
            if(type=='1'){
                this.addShoppList(row,free);
                return false;
            }
            this.delShoppList(row,free);
        }
        // 根据商品列表是否赠品 增加删除shopp列表数据
        addOrdelShoppInfoFtee(row,type){
            var free = 1;
            if(type){
                this.addShoppList(row,free);
                return false;
            }
            this.shoppList.some(item =>{
                if(item['Code_'] == row['Code_'] && item['free'] == 1){
                    item['quantity']++;
                }
            })
            var shoppListEl = $('.shopp-info-body').find('tr');
            $.each(shoppListEl,function(index,el){
                if($(el).attr('data-id') == row['Code_'] && $(el).attr('data-free') == 1){
                    var val = parseInt($(el).find('.quantity').text())+1;
                    $(el).find('.quantity').html(val);
                }
            })
        }
        //添加购物车的数据
        addShoppList(row,free){
            var flag = false; //标记是否已经存在购物车
            this.shoppList.some(item =>{
                if(item['Code_'] == row['Code_'] && free == 0){
                return flag = true;
                }
                if(item['Code_'] == row['Code_'] && free == 1){
                    return flag = true;
                }
            })
            this.shoppList.push({
                free : free,
                quantity:1,
                ...row
            });
            var _html = `<tr data-id="${row['Code_']}" data-free="${free}">
                        <td><div class="box count">${0}</div></td>
                        <td><div class="box">${row['DescSpec_']}</div></td>
                        <td><div class="box">${row['Unit_']}</div></td>
                        <td class="td-quantity"><input type="text" class="quantityIpt" value="${1}"/><div class="box quantity">${1}</div></td>
                        <td class="td-price"><div class="box">${row['OriUP_']}</div></td>
                        <td><div class="box">${free=='1'?'Yes':''}</div></td>
                        <td class="td-remarks"><div class="box"></div></td>
                        <td><div class="box"><a class="f-csp shopp-item-del-btn"><img src="/static/images/delete.png" alt=""></a></div></td>
                    </tr>`;
            $('.shopp-info-body').append(_html);
            this.initRowNo();
        }

        //删除购物车的数据
        delShoppList(row){
            var shoppListEl = $('.shopp-info-body').find('tr');
            var infoListEl = $('.info-list-body').find('tr');
            this.shoppList.forEach((item,index) =>{
                if(item['Code_'] == row['Code_'] && item['free'] == 0){
                    this.delInfoList(item,0);
                    this.shoppList.splice(index,1);
                }
            });
            $.each(shoppListEl,function(index,el){
                if($(el).attr('data-id') == row['Code_'] && $(el).attr('data-free') == 0){
                    $(el).remove();
                }
            })
            this.initRowNo();
        }
        //根据是否赠品删除购物车的数据
        delShoppListFree(row,free){
            var shoppListEl = $('.shopp-info-body').find('tr');
            this.shoppList.forEach((item,index) =>{
                if(item['Code_'] == row['Code_'] && item['free'] == 1){
                    this.shoppList.splice(index,1);
                }
            });
            $.each(shoppListEl,function(index,el){
                if($(el).attr('data-id') == row['Code_'] && $(el).attr('data-free') == '1'){
                    $(el).remove();
                }
            })
            var infoListEl = $('.info-list-body').find('tr');
            $.each(infoListEl,function(index,el){
                if($(el).attr('data-id') == row['Code_']){
                    $(el).find('.btn-free').attr('data-free',0);
                    $(el).find('.btn-free .box').html('');
                }
            })
            this.initRowNo();
        }
        // 添加商品列表数据
        addInfoList(classStr){
            var _html = '';
            this.dataObj.map(item=>{
                if(classStr != ''){
                    if(item['Class1_'] === classStr){
                            _html += `<tr data-id="${item['Code_']}" data-class="${classStr}">
                            <td><div class="box"><span class="chek-ipt" data-select="0" data-row="0"></span></div></td>
                            <td><div class="box">${item['brand']}</div></td>
                            <td><div class="box">${item['Class1_']}</div></td>
                            <td><div class="box" style="justify-content:left;">${item['DescSpec_']}</div></td>
                            <td><div class="box">${item['Unit_']}</div></td>
                            <td><div class="box">${item['Stock_']}</div></td>
                            <td><div class="box">${item['OriUP_']}</div></td>
                            <td class="btn-free" data-free="0"><div class="box"></div></td>
                        </tr>`;
                    }
                }else{
                    _html += `<tr data-id="${item['Code_']}" data-class="${classStr}">
                        <td><div class="box"><span class="chek-ipt" data-select="0" data-row="0"></span></div></td>
                        <td><div class="box">${item['brand']}</div></td>
                        <td><div class="box">${item['Class1_']}</div></td>
                        <td><div class="box" style="justify-content:left;">${item['DescSpec_']}</div></td>
                        <td><div class="box">${item['Unit_']}</div></td>
                        <td><div class="box">${item['Stock_']}</div></td>
                        <td><div class="box">${item['OriUP_']}</div></td>
                        <td class="btn-free" data-free="0"><div class="box"></div></td>
                    </tr>`;
                }
            })
            $('.info-list-body').html(_html);
        }
        // 搜索商品列表数据
        searchInfoList(formData){
            this.infoList = [];
            var _html = '';
            this.dataObj.map(item=>{
                if(formData.brand || formData.DescSpec_){
                    if(item['brand'] == formData.brand){ //指定了品牌
                        if(formData.DescSpec_ != '' && item['DescSpec_'].indexOf(formData.DescSpec_) != -1){ //模糊查询了商品规格
                            this.infoList.push(item);
                        }
                        if(formData.DescSpec_ == ''){ //模糊查询 为空
                            this.infoList.push(item);
                        }
                    }
                    if(formData.brand == ''){ //没有指定品牌
                        if(formData.DescSpec_ != '' && item['DescSpec_'].indexOf(formData.DescSpec_) != -1){ //模糊查询了商品规格
                            this.infoList.push(item);
                        }
                        if(formData.DescSpec_ == ''){ //模糊查询 为空
                            this.infoList.push(item);
                        }
                    }
                }else{
                    this.infoList.push(item);
                }
            })
            this.infoList.map(item=>{
                _html += `<tr data-id="${item['Code_']}" data-class="${item['Class1_']}">
                    <td><div class="box"><span class="chek-ipt" data-select="0" data-row="0"></span></div></td>
                    <td><div class="box">${item['brand']}</div></td>
                    <td><div class="box">${item['Class1_']}</div></td>
                    <td><div class="box" style="justify-content:left;">${item['DescSpec_']}</div></td>
                    <td><div class="box">${item['Unit_']}</div></td>
                    <td><div class="box">${item['Stock_']}</div></td>
                    <td><div class="box">${item['OriUP_']}</div></td>
                    <td class="btn-free" data-free="0"><div class="box"></div></td>
                </tr>`;
            })
            $('.info-list-body').html(_html);
            if(this.infoList.length>=1){
                setTimeout(()=>{
                    $('.info-list-body').find('tr').eq(0).addClass('active');
                    this.watchFlag = 1;
                },200)
            }
            
        }
        //删除商品列表选中数据
        delInfoList(row,free){
            var infoListEl = $('.info-list-body').find('tr');
            $.each(infoListEl,function(index,el){
                if($(el).attr('data-id') == row['Code_']){
                    $(el).removeClass('bg-chek');
                    $(el).find('.chek-ipt ').removeClass('chek-active').attr('data-select',0);
                }
            })
        }
        //自动排序商品列表序号
        initRowNo(){
            var shoppListEl = $('.shopp-info-body').find('tr');
            $.each(shoppListEl,function(index,el){
                $(el).find('.count').html(index+1);
            })
        }
        closeWindow(){
            $('#app').css('display','none');
        }
        openWindow(){
            $('#app').css('display','block');
        }

        //监听键盘D的切换表格操作
        triggerTableOp(){
            if(this.watchFlag == 1){
                this.triggerTableFocus(1);
                this.watchFlag = 2;
                this.enterFlag = 1;
            }else if(this.watchFlag == 2){
                this.triggerTableFocus(2);
                this.watchFlag = 1;
                this.enterFlag = 1;
            }
        }
        //回车事件监听事件
        enterEventFun(){
            if(this.watchFlag == 1){
                // switch(enterFlag){
                //     case 1:
                        this.addQuantityFun();
                //     break;
                // }
            }else if(this.watchFlag == 2){
                var $td = $('.shopp-info-body tr .active');
                if($td.hasClass('td-quantity')){
                    var quantity =$('.td-quantity.active').find('.box').text();
                    quantity = quantity != ''? parseInt(quantity):'';
                    $('.td-quantity.active').find('.box').html('<input type="text" id="quantityID" style="width: 50px;" value="'+quantity+'"/>');
                }else if($td.hasClass('td-price')){
                    var quantity =$('.td-price.active').find('.box').text();
                    quantity = quantity != ''? parseInt(quantity):'';
                    $('.td-price.active').find('.box').html('<input type="text" id="quantityID" style="width: 50px;" value="'+quantity+'"/>');
                }else if($td.hasClass('td-remarks')){
                    var quantity =$('.td-remarks.active').find('.box').text();
                    quantity = quantity != ''? parseInt(quantity):'';
                    $('.td-remarks.active').find('.box').html('<input type="text" id="quantityID" style="width: 130px;" value="'+quantity+'"/>');
                }
                setTimeout(function(){ $('#quantityID').focus();},200);
            }
        }

        //回车添加购物车商品数量
        addQuantityFun(){
            var flag = true;
            var code = $('.info-list-body tr.active').attr('data-id');
            var shoppListEl = $('.shopp-info-body').find('tr');
            for(var i=0,len=this.shoppList.length;i<len;i++){
                if(this.shoppList[i]['Code_'] == code && this.shoppList[i]['free'] == 0){
                    this.shoppList[i].quantity += 1;
                }
            }
            $.each(shoppListEl,function(index,el){
                if($(el).attr('data-id') == code && $(el).attr('data-free') == 0){
                    flag = false;
                    var quantity = $(el).find('.quantity').text();
                    quantity = parseInt(quantity) + 1;
                    $(el).find('.quantityIpt').val(quantity);
                    $(el).find('.quantity').html(quantity);
                }
            })
            if(flag){
                this.infoList.some(item=>{
                    if(item['Code_'] == code){
                        $('.info-list-body tr.active').addClass('bg-chek').find('.chek-ipt').attr('data-select','1').addClass('chek-active');
                        return this.addOrdelShoppInfo(1,item);
                    }
                })
            }
        }
        //控制商品列表上下行
        scollTableRowInfoList(keyCode){
            var rowIndex = $('.info-list-body tr.active').index();
            $('.info-list-body tr.active').removeClass('active');
            if(keyCode == '38' || keyCode == '87'){
                rowIndex -= 1;
                if(rowIndex >= 0){
                    $('.info-list-body tr').eq(rowIndex).addClass('active');
                }else{
                    rowIndex = 0;//$('.info-list-body tr').length - 1;
                    $('.info-list-body tr').eq(rowIndex).addClass('active');
                }
                if(rowIndex == 0){
                    $('.right-info-mian-info-list').scrollTop(0);
                    return;
                }
            
                this.tableScollFun({
                    type:false, //true 下 false 上
                    scollParentEl:$('.right-info-mian-info-list'), //滚动容器
                    scollTrEl:$('.info-list-body tr.active') //需要滚动的tr
                });
            }else{
                rowIndex += 1;
                if(rowIndex < $('.info-list-body tr').length){
                    $('.info-list-body tr').eq(rowIndex).addClass('active');
                }else{
                    rowIndex = $('.info-list-body tr').length - 1;//0;
                    $('.info-list-body tr').eq(rowIndex).addClass('active');
                }
                this.tableScollFun({
                    type:true, //true 下 false 上
                    scollParentEl:$('.right-info-mian-info-list'), //滚动容器
                    scollTrEl:$('.info-list-body tr.active') //需要滚动的tr
                });
            }
        }
        //执行表格滚动
        tableScollFun(obj){
            if(obj.type){
                 //获取 元素到窗口顶部的距离
                 var pTop = obj.scollParentEl.offset().top + obj.scollParentEl.height();
                 var trH =  obj.scollTrEl.height(),
                        trST =  obj.scollTrEl.offset().top,
                        scollT = obj.scollParentEl.scrollTop();
                 if(obj.scollTrEl.offset().top + trH > pTop - 1){
                    obj.scollParentEl.scrollTop(scollT + ((trST+trH) - pTop));
                 }
            }else{
                //获取 元素到窗口顶部的距离
                var pTop = obj.scollParentEl.offset().top; //滚动元素距离窗口的坐标
                if(obj.scollTrEl.offset().top < pTop-1){
                    var trT =  obj.scollTrEl.height(),//需要滚动的tr高度
                        scollT = obj.scollParentEl.scrollTop(), //滚动条的坐标
                        trST = obj.scollTrEl.offset().top; //距离窗口的tr坐标
                        pTop = pTop - trST < 0 ? 0 : pTop - trST;
                        obj.scollParentEl.scrollTop(scollT - pTop);
                }
            }
        }
        //控制购物车列表上下行
        scollTableRowshoppList(keyCode){
            var parentEl = $('.shopp-info-body tr td.active').parent('tr');
            var rowIndex = parentEl.index();
            var index = $('.shopp-info-body tr td.active').index();
            $('.shopp-info-body tr td.active').removeClass('active');
            if(keyCode == '38' || keyCode == '87'){
                rowIndex -= 1;
                if(rowIndex >= 0){
                    $('.shopp-info-body tr').eq(rowIndex).find('td').eq(index).addClass('active');
                }else{
                    rowIndex = 0; //$('.shopp-info-body tr').length - 1; 
                    $('.shopp-info-body tr').eq(rowIndex).find('td').eq(index).addClass('active');
                }
                if(rowIndex == 0){
                    $('.shopp-info-list').scrollTop(0);
                    return;
                }
                this.tableScollFun({
                    type:false, //true 下 false 上
                    scollParentEl:$('.shopp-info-list'), //滚动容器
                    scollTrEl:$('.shopp-info-list tr td.active').parent('tr') //需要滚动的tr
                });
            }else{
                rowIndex += 1;
                if(rowIndex < $('.shopp-info-body tr').length){
                    $('.shopp-info-body tr').eq(rowIndex).find('td').eq(index).addClass('active');
                }else{
                    rowIndex = $('.shopp-info-body tr').length -1 ;//0;
                    $('.shopp-info-body tr').eq(rowIndex).find('td').eq(index).addClass('active');
                }
                this.tableScollFun({
                    type:true, //true 下 false 上
                    scollParentEl:$('.shopp-info-list'), //滚动容器
                    scollTrEl:$('.shopp-info-list tr td.active').parent('tr') //需要滚动的tr
                });
            }
        }
        //控制购物车列表左右列
        scollTableRowshoppListColumn(keyCode){
            if(this.watchFlag == 2){
                var pIndex = $('.shopp-info-body tr td.active').parent('tr').index(),
                    index = $('.shopp-info-body tr td.active').index(),
                    count = $('.shopp-info-body tr td.active').parent('tr').find('td').length;
                $('.shopp-info-body tr td.active').removeClass('active');
                if(keyCode == '37'){
                    index -= 1;
                    if(index < 0){
                        index = count - 1;
                    }
                }else if(keyCode == '39'){
                    index += 1;
                    if(index >= count){
                        index = 0;
                    }
                }
                $('.shopp-info-body tr').eq(pIndex).find('td').eq(index).addClass('active');
            }
        }
        //切回Table焦点事件
        triggerTableFocus(type){
            if(type == 2){
                $('.info-list-body tr').eq(0).addClass('active');
                $('.shopp-info-body tr td').removeClass('active');
            }else{
                var code = $('.info-list-body tr.active').attr('data-id'),
                    free = 0,
                    flag=true;
                var shoppListEl = $('.shopp-info-body').find('tr');
                $.each(shoppListEl,function(index,el){
                    if($(el).attr('data-id') == code && $(el).attr('data-free') == 0){
                        $('.info-list-body tr').removeClass('active');
                        $(el).find('.td-quantity').addClass('active');
                        flag=false;
                    }
                })
                if(flag){
                    $('.info-list-body tr').removeClass('active');
                    $('.shopp-info-body tr').eq(0).find('.td-quantity').addClass('active');
                }
            }
        }
        //确定按钮事件
        consoleData(){
            console.log(this.shoppList);
            $(this.$pElem).remove();
        }

    }
    window.Dialog = Dialog;
})();