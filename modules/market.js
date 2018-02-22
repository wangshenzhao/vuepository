'use strict';

window.$ = layui.$;
var orderType = {
    1: '购买',
    2: '卖出'
};
var orderStatus = {
    '11': '正报',
    '12': '废单',
    '13': '已报',
    '14': '部成',
    '15': '已成',
    '21': '待撤',
    '22': '撤废',
    '23': '已撤',
    '24': '部撤',
    '25': '已撤',
    '26': '部撤'
    // 获取时K
};

function getKminuteData(code) {
    var params = {
        code: code,
        type: 1,
        tvmid: user.tvmid
    };
    return $.get(HOST.server + '/stock/getLine', params).then(predeal);
}

// 获取日K
function getdayKlineinfodata(code, datestr) {
    var params = {
        code: code,
        datestr: datestr,
        tvmid: user.tvmid
    };
    return $.get(HOST.server + '/stock/dayLine', params).then(predeal);
}
// 五档实时数据刷新
function wudang_socket(wudang) {
    // 五档的实时数据
    vm.tv.fiveCover = wudang;
}

// 交易实时数据刷新
function log_socket(log) {}
// 交易的实时数据


// 成交实时数据刷新
function deal_socket(deal) {
    // 成交实时数据
    updateListInfo(deal);
    updateDealInfo(deal);
}

// 获取股票列表
function getTvsList(limit, timestamp) {
    var params = {
        limit: limit,
        sortnumber: timestamp
    };
    return $.get(HOST.server + '/stock/getTvsList', params).then(predeal);
}

// 获取详情明细
function getCodeDetail(code) {
    var page_turn_sortscore = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    var params = {
        code: code,
        page_turn_sortscore: page_turn_sortscore,
        tvmid: user.tvmid
    };
    return $.get(HOST.server + '/stock/getdealinfo', params).then(predeal);
}

// 获取明细信息
function getAllOrder() {
    var timeStamp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var type = arguments[1];
    var today = arguments[2];
    var startTime = arguments[3];
    var endTime = arguments[4];

    var params = {
        tvmid: user.tvmid,
        type: type,
        timeStamp: timeStamp,
        today: today,
        startTime: startTime,
        endTime: endTime
    };
    return $.get(HOST.server + '/stock/myOrderList', params).then(predeal);
}

// 获取我的订单
function getMyOrder() {
    var timeStamp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    return getAllOrder(timeStamp, 2);
}

// 获取已购信息
function getBought() {
    var timeStamp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    var params = {
        tvmid: user.tvmid,
        timeStamp: timeStamp
    };
    return $.get(HOST.server + '/stock/myHoldList', params).then(predeal);
}

// 获取(T+1)已购信息
function getBoughtT1() {
    var timeStamp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    var params = {
        tvmid: user.tvmid,
        timeStamp: timeStamp
    };
    return $.get(HOST.server + '/stock/usableList', params).then(predeal);
}

// 获取当日委托
function getTodayOrder(timeStamp) {
    var today = new Date().format('yyyy-MM-dd');
    return getAllOrder(timeStamp, 0, today);
}

// 获取当日成交
function getTodayDeal(timeStamp) {
    var today = new Date().format('yyyy-MM-dd');
    return getAllOrder(timeStamp, 1, today);
}

// 获取历史委托
function getHistoryOrder(timeStamp, start, end) {
    var startTime = new Date(start).format('yyyy-MM-dd 00:00:00');
    var endTime = new Date(end).format('yyyy-MM-dd 23:59:59');
    return getAllOrder(timeStamp, 0, undefined, startTime, endTime);
}

// 获取历史成交
function getHistoryDeal(timeStamp, start, end) {
    var startTime = new Date(start).format('yyyy-MM-dd 00:00:00');
    var endTime = new Date(end).format('yyyy-MM-dd 23:59:59');
    return getAllOrder(timeStamp, 1, undefined, startTime, endTime);
}

// 撤单
function cancelTrade(id) {
    var data = {
        tvmid: user.tvmid,
        id: id
    };
    return $.post(HOST.server + '/stock/cancelOrder', data).then(predeal);
}

// 下单
function saveTrade(code, type, price, count) {
    var data = {
        tvmid: user.tvmid,
        code: code,
        type: type,
        price: price,
        count: count
    };
    return $.post(HOST.server + '/stock/reportOrder', data).then(predeal);
}

// 抢购
// 保存申购
function savePanic (code, count) {
    var data = {
      code: code,
      count: count,
      tvmid: user.tvmid
    }
    return $.post(`${HOST.server}/stock/applyBuy`, data).then(predeal)
}

// 获取公司列表
function getCompanyList () {
    return $.get(`${HOST.server}/stock/companyList`).then(predeal)
}

// 大宗交易
function saveBigDeal (data) {
    return $.post(`${HOST.server}/stock/blockTransaction`, data).then(predeal)
}

//
function canuseSeconds (tvmid,code) {
    var data = {
        tvmid: tvmid,
        code: code
    }
    return $.get(`${HOST.server}/stock/usableSeconds`, data).then(predeal)   
}

// 这里把async方法换成普通回掉或者promise
function initChart(dakainfo) {
    var destoryChart = createChart({
        dakainfo: dakainfo, // 股票详情
        getKminuteData: getKminuteData, // 获取实时
        getdayKlineinfodata: getdayKlineinfodata, // 获取日线
        minuteBox: document.getElementById('minuteBox'), // 实时容器
        // dayBox: document.getElementById('dayBox'), // 日K容器
        wudang_socket: wudang_socket, // 五档回掉
        log_socket: log_socket, // 交易回掉
        deal_socket: deal_socket // 成交回调
    });
    // 控制图表tab
    layui.element.on('tab(chart)', function (data) {
        var container = document.querySelector('.chart-container');
        if (data.index == 0) {
            anime({
                targets: container,
                scrollLeft: 0,
                easing: 'linear',
                duration: 300
            });
            // container.scrollLeft = 0
        } else {
            anime({
                targets: container,
                scrollLeft: container.clientWidth,
                easing: 'linear',
                duration: 300
            });
        }
    });
    return destoryChart;
}

//订单卡片控制
layui.element.on('tab(card)', function (data) {
    vm.orderList = [];
    vm.orderLoad = false;
    switch (data.index) {
    case 0:
        initOrderList();
        break;
    case 1:
        getBoughtT1().then(function (res) {
            orderResTodo(res, getBought);
        });
        break;
    case 2:
        getTodayOrder().then(function (res) {
            orderResTodo(res, getTodayOrder);
        });
        break;
    case 3:
        getTodayDeal().then(function (res) {
            orderResTodo(res, getTodayDeal);
        });
        break;
    case 4:
        var params = initLaydate(0);
        getHistoryOrder(params.timeStamp, params.startDay, params.endDay).then(function (res) {
            orderResTodo(res, getHistoryOrder);
        });
        break;
    case 5:
        var params = initLaydate(1);
        getHistoryDeal(params.timeStamp, params.startDay, params.endDay).then(function (res) {
            orderResTodo(res, getHistoryDeal);
        });
        break;
    default:
        break;
    }
});

var layer = layui.layer;
var laydate = layui.laydate;
var laytpl = layui.laytpl

// 买弹窗
function buy() {
    initTrade(1);
    layer.open({
        type: 1,
        title: vm.tv.nickname,     
        closeBtn: 1,
        shadeClose: true,
        skin: 'confirm-order blk',        
        area: '350px',
        content: $('#buyDialog')
    });
}

// 初始化交易信息
function initTrade(type) {
    vm.trade = {
        code: vm.tv.code,
        price: vm.tv.commodity_price,
        // count: type === 1 ? vm.buyMinCount : 0,
        count: 0,
        type: type
    };
}

// 手动输入变更
function inpuctChange(ref, param) {
    var value = +vm.$refs[ref].value;
    // var msg = checkInput(value,param)
    // if (msg !== true) {
    //     vm.$refs[ref].value = param === 'price' ? f2(vm.trade[param]) : vm.trade[param]
    //     showMsg(msg)
    //     return
    // }
    if (param === "price") {
        vm.trade[param] = Math.round(value * 100);
    }
    if (param === "count") {
        vm.trade[param] = value;
    }
}

//检测输入
function checkInput(value, param) {
    // 数字判断
    if (!/^[0-9]+\.?[0-9]*$/.test(value)) {
        return '请输入正确的格式';
    }
    // 金额范围判断
    if (param === 'price' && +value > vm.tv.limit_up / 100) {
        vm.trade[param] = vm.tv.limit_up;
        return '不能大于涨停价';
    }
    if (param === 'price' && +value < vm.tv.limit_down / 100) {
        vm.trade[param] = vm.tv.limit_down;
        return '不能小于涨停价';
    }
    // 数量范围判断
    if (param === 'count' && +value <= 0) {
        return '请输入正确的数量';
    }
    // if (param === 'count' && vm.trade.type === 1 && +value < vm.buyMinCount) {
    //     vm.trade[param] = vm.buyMinCount;
    //     return '购买数量必须大于' + vm.buyMinCount;
    // }
    return true;
}

// 数值加减
function calculate(param, action) {
    var value = vm.trade[param];
    if (action === 'add') {
        value += param === "count" ? 60 : 1;
        if (param === 'price' && +value > vm.tv.limit_up) {
            vm.trade[param] = vm.tv.limit_up;
            showMsg('不能大于涨停价');
            return;
        }
        vm.trade[param] = value;
    }

    if (action === 'minus' && value > 0) {
        value -= param === "count" ? 60 : 1;
        // 金额范围判断
        if (param === 'price' && +value < vm.tv.limit_down) {
            vm.trade[param] = vm.tv.limit_down;
            showMsg('不能小于跌停价');
            return;
        }
        //数量范围判断
        if (param === 'count' && +value < 0) {
            showMsg('请输入正确的数量');
            return;
        }
        // if (param === 'count' && vm.trade.type === 1 && +value <= vm.buyMinCount) {
        //     showMsg('购买数量必须大于' + vm.buyMinCount);
        //     return;
        // }
        vm.trade[param] = value;
    }
}

// 下单数值检测
function checkTradeInfo(cb) {
    // 字段检测
    // 价格检测
    if (!/(^[1-9](\d+)?(\.\d{1,2})?$)|(^(0){1}$)|(^\d\.\d{1,2}?$)/.test(vm.trade.price)) {
        return cb('请输入正确的价格');
    }
    if (!/^[0-9]*$/.test(vm.trade.count)) {
        return cb('请输入正确的数量');
    }
    if (vm.trade.price > vm.tv.limit_up) {
        return cb('不能大于涨停价');
    }
    if (vm.trade.price < vm.tv.limit_down) {
        return cb('不能小于跌停价');
    }
    // 数量检测
    if (vm.trade.count <= 0) {
        return cb('数量必须大于0');
    }
    //购买数量限制
    if (vm.trade.count % 60 != 0) {
        return cb('购买数量必须是60的倍数')
    }
    // if (vm.trade.type === 1 && vm.trade.count < vm.buyMinCount) {
    //     return cb('购买数量必须大于' + vm.buyMinCount);
    // }
    //每日金额限制
    // if (vm.trade.price * vm.trade.count + fee(vm.trade.price, vm.trade.count) > vm.tradeMaxMoney * 100) {
    //     return cb('二级市场每日交易金额不得大于' + vm.tradeMaxMoney + '元');
    // }
    //转让限制提示
    if (vm.trade.type == 2 && (vm.block.canUsed < vm.trade.count)) {
        return cb('可转数量不足')  
    }
    return cb(true);
}
//提示弹窗
function showMsg(msg) {
    layer.msg(msg, {
        icon: 5,
        time: 1000
    });
}

// 大宗转让窗
function block () { 
    canuseSeconds(user.tvmid, vm.tv.code).then(function (res) { 
        vm.block.canUsed = res.canUsed
        var blockInfo = {
            price: vm.tv.commodity_price,
            openPrice: vm.tv.opening_price,
            seconds: vm.block.canUsed,
            companyList: vm.companyList,
            count: ""
        }
        layer.open({
            type: 1,
            title: vm.tv.nickname,
            closeBtn: 1,
            shadeClose: true,
            skin: 'confirm-order blk',
            area: '350px',
            content: laytpl($('#blockDialog').html()).render(blockInfo)
        });
        layui.form.render()
    })
}

//大宗转让确认按钮监听
layui.form.on('submit(block)', function(data,item){
    var param = {
        code: vm.tv.code,
        price: data.field.price * 100,
        count: data.field.count,
        buyer: data.field.company,
    }
    layer.closeAll()
    saveBigDeal(param).then(function (res){
        if (res.status == "1") {
            layer.msg("您已成功申请卖出",{icon:1,time:1000})
        }
    })
})

//监听大宗输入变化
function inputValue(event, filter) {
    var price = +$("#blockPrice").val() * 100
    var count = +$("#blockCount").val()
    $("#blockMoney").html(f2(price * count))
}

//from表单验证
layui.form.verify({
    company: [
        /^[a-zA-Z0-9]+$/
        , '请选择公司'
    ],
    price: function(value){
        if (!/(^[1-9](\d+)?(\.\d{1,2})?$)|(^(0){1}$)|(^\d\.\d{1,2}?$)/.test(value)) {
            return '请输入正确的价格'
        }
        // if (!user.isSuperAccount && +value > +f2(vm.tv.opening_price * 1.3)) {
        //     return '不得超过开盘价的30%'
        // }
        // if (!user.isSuperAccount && +value < +f2(vm.tv.opening_price * 0.7)) {
        //     return '不得低于开盘价的30%'            
        // }
    },
    count: function(value){
        if (!/^\d+$/.test(value) || value <= 0) {
            return '请输入正确的数量'
        }
        if (value > vm.block.canUsed) {
            return '可转数量不足'
        }
    }
}); 

// 计算抢购金额
function countMoney(){
    var count = +vm.$refs.applyCount.value
    if (!/^([1-9][0-9]*)$/.test(count)) {
       return
    }
    vm.applyCount = count
}

// 抢购请求
function applyOrder() {
    var count = +vm.$refs.applyCount.value
    if (!vm.applyCount) {
        return layer.msg('请输入数量',{icon:5,time:1000})
    }
    if (!/^([1-9][0-9]*)$/.test(count)) {
        return layer.msg('请输入正确的数量',{icon:5,time:1000})
    }
    savePanic(vm.code, vm.applyCount).then(function (res) {
        vm.applyCount = null                
        if (res) {
            layer.closeAll()  
            layer.msg("抢购成功",{icon:1,time:1000})   
        }
    })
}

// 抢购弹窗
function apply(){
    layer.open({
        type: 1,
        title: "抢购",
        closeBtn: 1,
        shadeClose: true,
        area: '350px',
        skin: 'confirm-order blk',
        content: $('#applyDialog')
    });
}

// 卖弹窗
function sell() {
    canuseSeconds(user.tvmid, vm.tv.code).then(function (res) {
        vm.block.canUsed = res.twoLevelCanUsed > res.canUsed ? res.canUsed : res.twoLevelCanUsed
        //超级帐号可转
        if (user.isSuperAccount) {
            vm.block.canUsed = res.canUsed
        }
        initTrade(2);
        layer.open({
            type: 1,
            title: vm.tv.nickname,     
            closeBtn: 1,
            shadeClose: true,
            skin: 'confirm-order blk',  
            area: '350px',
            content: $('#sellDialog')
        });
    })
}

// 确认订单弹窗
function confirmOrder() {
    checkTradeInfo(function (res) {
        if (res === true) {
            layer.open({
                type: 1,
                title: '确认订单',
                closeBtn: 1,
                shadeClose: true,
                area: '350px',
                skin: 'confirm-order blk',
                content: $('#orderDialog')
            });
        } else {
            showMsg(res);
        }
    });
}

// 撤单弹窗
function cancelOrder(dom, id) {
    layer.open({
        type: 4,
        shade: 0,
        closeBtn: 0,
        shadeClose: true,
        resize: false,
        btn: ['确定', '取消'],
        content: ['<i class="layui-icon">&#xe607;</i>您确认撤单吗？', dom.target],
        yes: function yes(index) {
            layer.close(index);
            cancelTrade(id).then(function () {
                initOrderList();
            });
        }
    });
}

var vm = new Vue({
    el: '#channelInfo',
    data: function data() {
        return {
            loading: false,
            channelLoad: false,
            orderLoad: false,
            tv: {
                fiveCover: {
                    buy: [],
                    sell: []
                },
                dealLoad: false
            },
            tvLists: [],
            listInfo: {
                limit: 10,
                sortnumber: 0
            },
            dealList: [],
            orderList: [],
            orderParam: {
                startDay: null,
                endDay: null,
                timeStamp: null,
                action: null
            },
            trade: {
                code: null,
                price: null,
                count: null,
                type: null
            },
            // buyMinCount: 0,
            tradeMaxMoney: 10000,
            dealLimit: 20,
            orderLimit: 15,
            code: null,
            activeClass: 'active',
            companyList:[],
            applyCount: null,
            block: {
                canUsed: 0,
            }
        };
    },
    mounted: function mounted() {
        var _this = this
        checkLogin(function () {
            _this.init();
        })
        socketInit();
    },
    beforeDestroy: function beforeDestroy() {
        typeof this.destoryChart === 'function' && this.destoryChart();
    },

    methods: {
        init: function init() {
            var _this2 = this;
            getTvsList(this.listInfo.limit, this.listInfo.timestamp).then(function (tvs) {
                _this2.tvLists = tvs.list;
                _this2.code = tvs.list[0].code;
                _this2.choise(_this2.code);
            });   
            initOrderList();
            this.getCompanys()
        },
        //获取公司信息
        getCompanys: function getCompanys() {
            var _this = this
            getCompanyList().then(function(res){
                _this.companyList = res
            })
        },
        getTv: function getTv() {
            this.loading = true;
            var _this = this;
            getOpeningInfo(this.code, user.tvmid).then(function (info) {
                _this.tv = info;
                _this.destoryChart = initChart(info);
            });
        },
        updateList: function updateList() {
            var _this = this;
            getTvsList(this.listInfo.limit, this.listInfo.sortnumber).then(function (tvs) {
                if (tvs.list.length > 0) {
                    tvs.list.forEach(function (element) {
                        _this.tvLists.push(element);
                    });
                }
                if (tvs.list.length < _this.listInfo.limit) {
                    return;
                }
                _this.channelLoad = false;
            });
        },
        buy: function buy(type) {
            this.$router.push('/trade/' + type + '?code=' + this.tv.code + '&name=' + this.tv.nickname);
        },
        choise: function choise(code) {
            var _this = this;
            typeof this.destoryChart === 'function' && this.destoryChart();
            this.code = code;
            this.getTv();
            getCodeDetail(this.code).then(function (deal) {
                _this.dealList = deal;
            });
        },
        channelScroll: function channelScroll() {
            var _this = this;
            var dom = this.$refs.channelScroll;
            this.trigger(dom, function () {
                if (_this.channelLoad === true) {
                    return;
                }
                _this.channelLoad = true;
                _this.listInfo.sortnumber = _this.tvLists[_this.tvLists.length - 1].sortnumber || 0;
                _this.updateList();
            });
        },
        trigger: function trigger(dom, cb) {
            var height = dom.clientHeight;
            var scrollTop = dom.scrollTop;
            var scrollHeight = dom.scrollHeight;
            if (scrollTop + height + 20 > scrollHeight) {
                cb && cb();
            }
        },
        updateDeal: function updateDeal(sortindex) {
            var _this = this;
            getCodeDetail(this.code, sortindex).then(function (deal) {
                if (deal.length > 0) {
                    deal.forEach(function (element) {
                        _this.dealList.push(element);
                    });
                }
                if (deal.length < _this.dealLimit) {
                    return;
                }
                _this.tv.dealLoad = false;
            });
        },
        dealScroll: function dealScroll() {
            var dom = this.$refs.dealScroll;
            this.scroll(dom);
        },
        myOrderScroll: function myOrderScroll() {
            var dom = this.$refs.myOrderScroll;
            this.scroll(dom);
        },
        boughtScroll: function boughtScroll() {
            var dom = this.$refs.boughtScroll;
            this.scroll(dom);
        },
        todayOrderScroll: function todayOrderScroll() {
            var dom = this.$refs.todayOrderScroll;
            this.scroll(dom);
        },
        todayDealScroll: function todayDealScroll() {
            var dom = this.$refs.todayDealScroll;
            this.scroll(dom);
        },
        hisOrderScroll: function hisOrderScroll() {
            var dom = this.$refs.hisOrderScroll;
            this.scroll(dom);
        },
        hisDealScroll: function hisDealScroll() {
            var dom = this.$refs.hisDealScroll;
            this.scroll(dom);
        },
        scroll: function scroll(dom) {
            var _this = this;
            this.trigger(dom, function () {
                if (_this.orderLoad === true) {
                    return;
                }
                _this.orderLoad = true;
                var sortindex = _this.orderList[_this.orderList.length - 1].create_timestamp || 0;
                sortindex ? _this.updateOrder(sortindex) : '';
            });
        },
        updateOrder: function updateOrder() {
            var sortindex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            var _this = this;
            _this.orderParam.action(sortindex, _this.orderParam.startDay, _this.orderParam.endDay).then(function (order) {
                if (order.length > 0) {
                    order.forEach(function (element) {
                        _this.orderList.push(element);
                    });
                }
                if (order.length < _this.orderLimit) {
                    return;
                }
                _this.orderLoad = false;
            });
        },

        // 下单事件
        tradeAction: function tradeAction() {
            layer.closeAll();
            saveTrade(vm.trade.code, vm.trade.type, vm.trade.price, vm.trade.count).then(function () {
                initOrderList();
            });
        }
    },
    computed: {
        rate: function rate() {
            if (!this.tv || !this.tv.commodity_price) return 0;
            return (this.tv.commodity_price - this.tv.lastclosing_price) * 10000 / this.tv.commodity_price;
        }
    }
});

//更新频道列表数据
function updateListInfo(deal) {
    vm.tvLists.find(function (x) {
        if (x.code == deal.code) {
            x.commodity_price = deal.commodity_price;
        }
    });
}

//更新成交明细
function updateDealInfo(deal) {
    if (deal.code == vm.code) {
        vm.dealList.unshift({
            price: deal.commodity_price,
            count: deal.currdeal_count,
            time: deal.currdeal_time
        });
    }
}

//初始化订单查询条件
function initLaydate(id) {
    vm.orderParam = {
        startDay: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).format('yyyy-MM-dd'),
        endDay: new Date().format('yyyy-MM-dd'),
        timeStamp: 0
    };
    var start = vm.orderParam.startDay;
    var end = vm.orderParam.endDay;
    // 日期选择器 开始
    laydate.render({
        elem: '#startDay' + id,
        max: 0,
        showBottom: false,
        value: start,
        done: function done(value) {
            vm.orderParam.startDay = value;
        }
    });
    // 日期选择器 结束
    laydate.render({
        elem: '#endDay' + id,
        max: 0,
        showBottom: false,
        value: end,
        done: function done(value) {
            vm.orderParam.endDay = value;
        }
    });
    return vm.orderParam;
}

//根据条件查询历史委托
function queryHistoryOrder() {
    vm.orderLoad = false;
    getHistoryOrder(0, vm.orderParam.startDay, vm.orderParam.endDay).then(function (res) {
        if (res.length < vm.orderLimit) {
            vm.orderLoad = true;
        }
        vm.orderList = res;
    });
}

//根据条件查询历史成交
function queryHistoryDeal() {
    vm.orderLoad = false;
    getHistoryDeal(0, vm.orderParam.startDay, vm.orderParam.endDay).then(function (res) {
        if (res.length < vm.orderLimit) {
            vm.orderLoad = true;
        }
        vm.orderList = res;
    });
}

// 订单详情初始化
function initOrderList() {
    getMyOrder().then(function (res) {
        orderResTodo(res, getMyOrder);
    });
}

// 订单返回结果处理
function orderResTodo(res, action) {
    vm.orderList = res;
    if (res.length < vm.orderLimit) {
        vm.orderLoad = true;
    }
    vm.orderParam.action = action;
}