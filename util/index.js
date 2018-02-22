/* eslint-disable eqeqeq,no-extend-native */
Date.prototype.format = function (format) {
  var o = {
    'M+': this.getMonth() + 1, // month
    'd+': this.getDate(), // day
    'h+': this.getHours(), // hour
    'm+': this.getMinutes(), // minute
    's+': this.getSeconds(), // second
    'q+': Math.floor((this.getMonth() + 3) / 3), // quarter
    'S': this.getMilliseconds() // millisecond
  }

  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
  }

  for (var k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
    }
  }
  return format
}

// 转换数字并且保留2位小数
function f2 (val) {
  if (val === '' || val === null || val === undefined) {
    return val
  }
  return (val / 100).toFixed(2)
}
// 超过1w以万为单位 留2位小数
function fw2 (val) {
  if (val === '' || val === null || val === undefined) {
    return val
  }
  let tenW = val / 1000000
  if (tenW >= 1) {
    return (val / 1000000).toFixed(2) + '万'
  } 
  return (val / 100).toFixed(2)
}
// 不留小数
 function fw (val) {
  if (val === '' || val === null || val === undefined) {
    return val
  }
  let tenW = val / 10000
  if (tenW >= 1) {
    return parseFloat(tenW.toFixed(2)) + '万'
  } 
  return val
}

 function fp2 (val) {
  if (val == '' || val == null) {
    return val
  }
  return val < 0 ? '-' + (Math.ceil(Math.abs(val)) / 100).toFixed(2) : (Math.ceil(val) / 100).toFixed(2)
}
// 计算color
 function color (val) {
  if (val > 0) return 'red'
  if (Number(val) === 0) return ''
  if (val < 0) return 'green'
}
// 计算上升下降图标
 function icon (val) {
  if (val > 0) return 'up'
  if (val < 0) return 'down'
}
// 计算差值
 function gap (item) {
  if (item.status !== 2) {
    return null
  }
  item.lastclosing_price = item.lastclosing_price || item.subscribe_price
  var gap = item.commodity_price - item.lastclosing_price

  return f2(gap)
}

function gap2 (item) {
  var gap2 = gap(item)
  return gap2 > 0 ?'+' + gap2 : gap2
}
// 计算比例
 function bili (item) {
  if (item.status !== 2) {
    return null
  }
  item.lastclosing_price = item.lastclosing_price || item.subscribe_price
  var gap = item.commodity_price - item.lastclosing_price
  return (gap * 100 / item.lastclosing_price).toFixed(2)
}

//比例2
function bili2 (item) {
  var bili2 = bili(item)
  return (Math.abs(bili2))
}

//带正负号比例
function bili3 (item) {
  var bili3 = bili(item)
  return bili3 > 0 ? '+' + bili3 : bili3 < 0 ? '-' + bili3 : bili3
}

// 是否在抢购状态
 function isPanicBuy (item, now = Date.now()) {
  if (item.status !== 1) return false
  if (now >= item.applybegintime && now < item.applyendtime) {
    return true
  }
  return false
}

 function timeState (item, now = Date.now()) {
  var state = {
    wait: false,
    ready: false,
    start: false,
    end: false,
    gaptime: null
  }
  if (item.status !== 1) return null
  var begintime = item.applybegintime
  var endtime = item.applyendtime
  var isSameDay = new Date(begintime).getDate() === new Date(now).getDate()
  if (now < begintime && !isSameDay) {
    state.wait = true
  } else if (now < begintime && isSameDay) {
    state.ready = true
    state.gaptime = begintime - now
  } else if (now >= begintime && now < endtime) {
    state.start = true
    state.gaptime = endtime - now
  } else {
    state.end = true
  }
  return state
}

 function timeWord (props) {
  var str = ''
  if (props.days) {
    str += (~~props.days + '天')
  }
  if (props.hours) {
    str += (~~props.hours + '小时')
  }
  if (props.minutes) {
    str += (~~props.minutes + '分')
  }
  if (props.seconds) {
    str += (~~props.seconds + '秒')
  }
  return str
}
// 获取开盘状态
 function openState (val) {
  if (val == 1) return '已开盘'
  else return '未开盘'
}

// 涨跌判断
 function upOrDown (commodity, lastclosing) {
  if (commodity > lastclosing) {
    return 'up'
  }
  if (commodity < lastclosing) {
    return 'down'
  }
  return ''
 }
 // 手续费计算
 function fee (price,count) {
  var fee = Math.floor(price * count * 0.003)
    return fee < 1 ? 1 : fee
 }

 // 含手续费金额
 function playMoney (price,count) {
   return price * count + fee(price,count)
 }

 function sellTotalMoney(price,count){
     return price * count -  fee(price,count)
 }

//判断是否为数字
function  isNumeric(obj) {
    return !isNaN(parseFloat(obj)) && isFinite(obj);
}

//判断数字，可以指定小数位
function validationNumber(value) {
    var regu = /^[0-9]+\.?[0-9]*$/;
    if (value != "") {
        return regu.test(value);
    }
}

// 获取一只股票的详情
function getOpeningInfo(code, tvmid) {
  let params = {
      code,
      tvmid
  }
  return $.get(`${HOST.server}/stock/getOpeningInfo`, params).then(predeal)
}
function compareTime(begin,end) {
  var current = new Date().getTime();
  if(current>begin && current <end){
      return true
  }else{
      return false;
  }
}

//显示缩略
function str (str,length) {
  if (str == '' || str === null || str === undefined) {
    return str
  }
  return str.length > length ? str.substr(0,length) + '...' : str
}

function getJsonLength(jsonData){
    var jsonLength = 0;
    for(var item in jsonData){
        jsonLength++;

    }
    return jsonLength;
}