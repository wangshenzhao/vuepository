/* eslint-disable no-dupe-keys,one-var,block-spacing */
(function () {
  let getKminuteData, getdayKlineinfodata

  var SOCKET_OBJ = {
    roomname: 'biggie_time_socket',
    socket: {},
    listener: {},
    addMessageListener: function (type, fun) {
      this.listener[type] = fun
    },
    getUrl: function () {
      var h, url
      if (HOST.isqa) {
        h = 'qa.wsq.mtq.tvm.cn'
        url = location.protocol + '//' + h + ':9092'
      } else {
        h = 'h5-socket.yaotv.tvm.cn'//正式地址
        url = location.protocol + '//' + h
      }
      return url
    },
    init: function (userInfo) {
      var self = this
      var s_url = self.getUrl() + '?channel=' + self.roomname
      var socketioobj = null
      userInfo = userInfo || { 'nickname': 'guest', 'id': 'guest', 'headimg': '' }
      socketioobj = io.connect(s_url, {
        upgrade: false,
        transports: ['websocket']
      })
      socketioobj.on('connect', function (e) { })
      socketioobj.on('error', function (e) { })
      socketioobj.on('disconnect', function (e) { })
      socketioobj.on('sendChatMessage', function (data) {
        self.socket.onmessage(data)
      })
      socketioobj.on('joinRoom', function (data) {
        self.socket.onmessage(data)
      })
      self.socket.send = function (jsonObject) {
        var eventname = jsonObject.event || ''
        if (eventname) {
          if (eventname == 'sockjs:joinChannel') {
            socketioobj.emit('joinRoom', jsonObject)
          } else {
            socketioobj.emit('sendChatMessage', jsonObject)
          }
        }
      }
      self.socket.onmessage = function (socketmsg) {
        var msg = socketmsg.data.body
        for (var key in self.listener) {
          var fun = self.listener[key]
          if (typeof fun == 'function') {
            fun(msg)
          }
        }
      }
      var joinroomjson = {
        'channel': self.roomname,
        'user': userInfo,
        'data': {
          message: '我来也',
          body: {
            type: 'joinroom'
          }
        },
        'event': 'sockjs:joinChannel'
      }
      self.socket.send(joinroomjson)
    }
  }
  var DAKA_CHART = {
    dakainfo: {},
    timedifference: 0, // 时间差
    sysUnit: '元',
    klineTimeout: null, // 分时k线轮询
    myDayChart: null,
    cloneJson: function (jsonObj) {
      var self = this
      var buf
      if (jsonObj instanceof Array) {
        buf = []
        var i = jsonObj.length
        while (i--) {
          buf[i] = self.cloneJson(jsonObj[i])
        }
        return buf
      } else if (jsonObj instanceof Object) {
        buf = {}
        for (var k in jsonObj) {
          buf[k] = self.cloneJson(jsonObj[k])
        }
        return buf
      } else {
        return jsonObj
      }
    },
    accDiv: function (arg1, arg2) {
      var t1 = 0, t2 = 0, r1, r2
      try { t1 = arg1.toString().split('.')[1].length } catch (e) { }
      try { t2 = arg2.toString().split('.')[1].length } catch (e) { }
      r1 = Number(arg1.toString().replace('.', ''))
      r2 = Number(arg2.toString().replace('.', ''))
      return (r1 / r2) * Math.pow(10, t2 - t1)
    },
    data2str: function (_data, format) {
      format = format || 'yyyy-MM-dd hh:mm:ss'
      var o = {
        'M+': _data.getMonth() + 1, //month
        'd+': _data.getDate(),    //day
        'h+': _data.getHours(),   //hour
        'm+': _data.getMinutes(), //minute
        's+': _data.getSeconds(), //second
        'q+': Math.floor((_data.getMonth() + 3) / 3),  //quarter
        'S': _data.getMilliseconds() //millisecond
      }
      if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
        (_data.getFullYear() + '').substr(4 - RegExp.$1.length))
      for (var k in o) if (new RegExp('(' + k + ')').test(format))
        format = format.replace(RegExp.$1,
          RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
      return format
    },
    accDiv: function (arg1, arg2) {
      var t1 = 0, t2 = 0, r1, r2
      try { t1 = arg1.toString().split('.')[1].length } catch (e) { }
      try { t2 = arg2.toString().split('.')[1].length } catch (e) { }

      r1 = Number(arg1.toString().replace('.', ''))
      r2 = Number(arg2.toString().replace('.', ''))
      return (r1 / r2) * Math.pow(10, t2 - t1)
    },
    accDivFixed2: function (arg1, arg2) {
      return Number(this.accDiv(arg1, arg2)).toFixed(2)
    },
    formatNum: function (v) {
      //转换成元：1分等于0.01元
      return this.accDiv(v || 0, 100).toFixed(2)
    },
    unitCount: function (v) {
      v = Number(v || 0)
      var result
      var fixed = 2
      if (v >= 100000000000) {
        result = Number(this.accDiv(v, 100000000000).toFixed(fixed)) + '千亿'
      } else if (v >= 1000000000) {
        result = Number(this.accDiv(v, 100000000).toFixed(fixed)) + '亿'
      } else if (v >= 100000000) {
        result = Number(this.accDiv(v, 10000000).toFixed(fixed)) + '千万'
      } else if (v >= 100000) {
        result = Number(this.accDiv(v, 10000).toFixed(fixed)) + '万'
      } else {
        result = v
      }
      return result
    },
    getkminute: function (code, call) {
      getKminuteData(code).then(call)
    },
    getdayklineinfo: function (code, datestr, call) {
      getdayKlineinfodata(code, datestr).then(call)
    },
    minutechart: function () {
      var self = this
      var myChart, alltimelist

      function _getTimeList () {
        var system_range = self.dakainfo.system_range || []
        var list = []
        for (var k = 0; k < system_range.length; k++) {
          var _time = system_range[k]
          var timestart = _time[0].split(':')
          var timeend = _time[1].split(':')
          var start_hour = Number(timestart[0])
          var end_hour = Number(timeend[0])
          var start_minute = Number(timestart[1])
          var end_minute = Number(timeend[1])
          for (var i = start_hour; i < end_hour + 1; i++) {
            for (var j = 0; j < 60; j++) {
              var s = j < 10 ? ':' + 0 + '' + j : ':' + j
              if ((i == start_hour && j < start_minute) || (i == end_hour && j > end_minute)) {

              } else {
                if (k != 0 && i == start_hour && j == start_minute) {
                  var i_str = i < 10 ? '0' + i : i
                  s = i_str + s
                  var newa = list.pop()
                  newa += '/' + s
                  list.push(newa)
                } else {
                  var i_str = i < 10 ? '0' + i : i
                  s = i_str + s
                  list.push(s)
                }
              }
            }
          }
        }
        return list
      }

      function splitData (timelist, rawData) {
        var _data = []
        var opening_price = self.dakainfo.opening_price//开盘
        var commodity_price = self.dakainfo.commodity_price//当前价
        opening_price = self.formatNum(opening_price)
        var getminutedata = function (_data, _time) {
          var _d = null
          for (var i = 0; i < _data.length; i++) {
            var sdata = _data[i]
            var time = sdata.time
            if (_time.indexOf(time) != -1) {
              _d = sdata
              break
            }
          }
          return _d
        }
        var _splitdata = function (_data) {
          var categoryData = []
          var values = []
          var volumes = []
          for (var i = 0; i < _data.length; i++) {
            categoryData.push(_data[i].splice(0, 1)[0])
            volumes.push([i, _data[i][0], _data[i][2]])
            var _value = _data[i][1]
            if (_value != '-') {
              _value = Number(_value)
            }
            values.push(_value)
          }
          return {
            categoryData: categoryData,
            values: values,
            volumes: volumes
          }
        }
        var compareDate = function (t1, t2) {
          var date = new Date()
          var a = t1.split(':')
          var b = t2.split(':')
          return date.setHours(a[0], a[1]) > date.setHours(b[0], b[1])
        }
        var nowTimestamp = Number(new Date().getTime()) + Number(self['timedifference'])
        var nowHM = self.data2str(new Date(nowTimestamp), 'hh:mm')

        for (var i = 0; i < timelist.length; i++) {
          var _time = timelist[i]
          var sdata = getminutedata(rawData, _time)
          var _volume = []
          var _price = opening_price
          //time
          _volume.push(_time)
          //count
          var _count = ''
          if (sdata) {
            _count = sdata.count
          } else {
            if (compareDate(_time, nowHM) && self.dakainfo['opening'] == 1) {
              _count = '-'
            } else {
              _count = 0
            }
          }
          _volume.push(_count)
          //price
          if (sdata) {
            _price = self.formatNum(sdata.price)
          } else {
            if (i > 0) {
              _price = _data[i - 1][2]
            }
          }
          if (compareDate(_time, nowHM) && self.dakainfo['opening'] == 1 || commodity_price == 0 || _price=='0.00') {
            _price = '-'
          }
          _volume.push(_price)
          //1跌 -1涨
          if (i > 0) {
            _volume.push(_data[i - 1][2] > _price ? 1 : -1)
          } else {
            _volume.push(opening_price > _price ? 1 : -1)
          }
          _data.push(_volume)
        }
        //console.log(_data)
        return _splitdata(_data)
      }

      function _k_line (rawData) {
        alltimelist = _getTimeList()
        var chatdata = splitData(alltimelist, rawData)

        var firstcategoryData = chatdata.categoryData.shift()
        var newfirstcategoryData = {}
        newfirstcategoryData['value'] = firstcategoryData
        newfirstcategoryData['textStyle'] = { 'align': 'left' }
        chatdata.categoryData.unshift(newfirstcategoryData)

        myChart = echarts.init(self.minutechartEle)
        //var splitNumber = Math.floor(chatdata.categoryData.length/4);
        var limit_down = self.formatNum(self.dakainfo.limit_down)
        var limit_up = self.formatNum(self.dakainfo.limit_up)
        var commodity_max_price = self.formatNum(self.dakainfo.commodity_max_price)
        var commodity_min_price = self.formatNum(self.dakainfo.commodity_min_price)
        var yAxisMin = Math.min(limit_down, commodity_min_price)
        var yAxisMax = Math.max(limit_up, commodity_max_price)
        if (yAxisMin == 0) {
          yAxisMin = Math.max(limit_down, commodity_min_price)
        }

        var opening_price = self.dakainfo.opening_price//开盘
        var lastclosing_price = self.dakainfo.lastclosing_price
        if (lastclosing_price) {
          lastclosing_price = self.formatNum(lastclosing_price)
        } else {
          lastclosing_price = self.formatNum(opening_price)
        }

        var kline_m_obj_height = self.minutechartEle.clientHeight
        var optionLeft = limit_up.length * 5 + 4
        var optionKH = kline_m_obj_height - 50 - 20 - 32 - 40//40handle

        var dktype = self.dakainfo.dktype||'';
        if(dktype==2){
            yAxisMin=function(value) {
                var _min = value.min;
                return Number((_min-_min*0.08).toFixed(2));
            };
            yAxisMax=function(value) {
                var _max = value.max;
                return Number((_max+_max*0.08).toFixed(2));
            };
        }

        var grid_option = [
          {
            left: 0,//optionLeft
            right: 15,
            height: optionKH,
            top: 20
          },
          {
            left: 0,
            right: 15,
            top: optionKH + 32 + 40,
            height: 50
          }
        ]

        //console.log(chatdata);

        var option = {
          backgroundColor: '#FFF',
          animation: false,
          title: {
            show: false
          },
          tooltip: {
            //triggerOn: 'none',
            trigger: 'axis',
            axisPointer: {
              type: 'cross',
              lineStyle: {
                color: '#ffb264'
              },
              crossStyle: {
                color: '#feb300'
              },
              label: {
                backgroundColor: '#feb300'
              }
            },
            backgroundColor: 'rgba(245, 245, 245, 0.8)',
            borderWidth: 1,
            borderColor: '#999',
            padding: 5,
            textStyle: {
              color: '#333',
              fontSize: 14
            },
            position: function (pos, params, el, elRect, size) {
              var obj = { top: 5 }
              obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5
              return obj
            },
            formatter: function (params, ticket, callback) {
              var param_volumes, param_values
              for (var i = 0; i < params.length; i++) {
                var _data = params[i]
                var seriesName = _data.seriesName
                if (seriesName == 'Minute') {
                  param_values = _data
                } else if (seriesName == 'Volume') {
                  param_volumes = _data
                }
              }
              var price = '-'
              var difference_per = '-'
              var instantstyle = ''

              if (param_values.data) {
                price = param_values.data
                var opening_price = self.dakainfo.opening_price//开盘
                var lastclosing_price = self.dakainfo.lastclosing_price
                lastclosing_price = self.formatNum(lastclosing_price)
                if (price > lastclosing_price) {
                  instantstyle = '#ff0000'
                } else if (price < lastclosing_price) {
                  instantstyle = '#05d389'
                }

                if (price != '-') {
                  var difference = Math.abs(lastclosing_price - price).toFixed(2)
                  difference_per = self.accDivFixed2(difference * 100, lastclosing_price) + '%'
                  price += self.sysUnit
                }

              }

              if (price && price != '-') {
                return [
                  '时间: ' + param_volumes.name + '<hr size=1 style="margin: 3px 0;">',
                  '价格: <font color="' + instantstyle + '">' + price + '</font><br/>',
                  '成交量: ' + param_volumes.data[1] + '<br/>',
                  '涨跌: <font color="' + instantstyle + '">' + difference_per + '</font><br/>'
                ].join('')
              } else {
                return
              }

            }
          },
          axisPointer: {
            link: { xAxisIndex: 'all' },
            label: {
              padding: [2, 2, 2, 2],
              textStyle: {
                fontSize: 14
              },
              backgroundColor: '#777'
            }
          },
          visualMap: {
            show: false,
            seriesIndex: 1,
            dimension: 2,
            pieces: [{
              value: -1,
              color: '#FD1050'
            }, {
              value: 1,
              color: '#0CF49B'
            }]
          },
          grid: grid_option,
          xAxis: [
            {
              type: 'category',
              data: chatdata.categoryData,
              scale: true,
              boundaryGap: true,
              axisLine: {
                onZero: false,
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              axisTick: {
                inside: true
              },
              axisLabel: {
                show: true,
                margin: 3,
                //interval: splitNumber,
                interval: function (index, value) {
                  if (
                    value
                    && (index == 0 || index == chatdata.categoryData.length - 1 || value.length > 5)
                  ) {
                    return true
                  }
                },
                textStyle: {
                  color: '#333',
                  fontSize: 12
                },
                showMinLabel: true,
                showMaxLabel: true
              },
              splitLine: {
                show: true,
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              min: 'dataMin',
              max: 'dataMax',
              axisPointer: {
                show: true,
                label: {
                  formatter: function (params) {
                    //var seriesValue = (params.seriesData[0] || {}).value;
                    return params.value
                  }
                },
                z: 100
              }
            },
            {
              type: 'category',
              gridIndex: 1,
              data: chatdata.categoryData,
              scale: true,
              boundaryGap: true,
              axisLine: {
                onZero: false,
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              axisTick: {
                show: false
              },
              splitLine: {
                show: true,
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              axisLabel: {
                show: false,
                interval: function (index, value) {
                  if (
                    value
                    && (index == 0 || index == chatdata.categoryData.length - 1 || value.length > 5)
                  ) {
                    return true
                  }
                },
                textStyle: {
                  color: '#333',
                  fontSize: 12
                }
              },
              //splitNumber: splitNumber,
              min: 'dataMin',
              max: 'dataMax',
              axisPointer: {
                label: {
                  show: false
                }
              }
            }
          ],
          yAxis: [
            {
              scale: true,
              splitNumber: 2,
              axisTick: {
                inside: true
              },
              axisLine: {
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              splitLine: {
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              axisLabel: {
                margin: 2,
                inside: true,
                textStyle: {
                  color: '#333',
                  fontSize: 12,
                  baseline: 'bottom'
                }
              },
              min: yAxisMin,
              max: yAxisMax
            },
            {
              name: '成交量',
              nameTextStyle:{
                color: "#000",
                padding: [0, 0, 0, 40],
              },
              scale: true,
              gridIndex: 1,
              splitNumber: 1,
              axisLabel: {
                margin: 2,
                inside: true,
                textStyle: {
                  color: '#333',
                  fontSize: 12,
                  baseline: 'bottom'
                }
              },
              axisLine: {
                show: true,
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              axisTick: {
                inside: true
              },
              splitLine: {
                lineStyle: {
                  color: '#e9e9e9'
                }
              }
            }
          ],
          dataZoom: [
            {
              type: 'inside',
              xAxisIndex: [0, 1],
              zoomLock: true
            },
            {
              type: 'inside',
              xAxisIndex: [0, 1],
              zoomLock: true
            }
          ],
          series: [
            {
              name: 'Minute',
              type: 'line',
              data: chatdata.values,
              showSymbol: false,
              smooth: true,
              lineStyle: {
                normal: {
                  color: '#067dff',
                  width: 1
                }
              },
              zlevel: 5,
              markLine: {
                silent: true,
                symbol: ['none', 'none'],
                data: [
                  {
                    name: 'Y 轴值为 前一天收盘价',
                    yAxis: lastclosing_price,
                    lineStyle: {
                      normal: {
                        opacity: 1,
                        color: '#fa9000'
                      }
                    },
                    label: {
                      normal: {
                        show: false
                      }
                    }
                  }
                ]
              }
            },
            {
              name: 'Volume',
              type: 'bar',
              xAxisIndex: 1,
              yAxisIndex: 1,
              data: chatdata.volumes
            }
          ],
          progressive: 400
        }

        myChart.setOption(option, true)
      }

      function mychartUpdate (timelist, rawData) {
        var chatdata = splitData(timelist, rawData)
        myChart.setOption({
          series: [
            { data: chatdata.values },
            { data: chatdata.volumes }
          ]
        })
      }

      function _build_kline_m () {
        var minutedealinfoData = []

        function _autoupdate () {
          if (myChart && myChart.isDisposed()) return
          if (self.dakainfo['opening'] == 1) {
            self.klineTimeout = setTimeout(function () {
              if (myChart && myChart.isDisposed()) return
              mychartUpdate(alltimelist, minutedealinfoData)
              _autoupdate()
            }, 60000)
          }
        }

        self.getkminute(self.dakainfo['code'], function (data) {
          var _len = data.length
          if (_len) {
            for (var i = 0; i < _len; i++) {
              var timeval = data[i]['time']
              if (JSON.stringify(minutedealinfoData).indexOf(timeval) == -1) {
                minutedealinfoData.push(data[i])
              } else {
                for (var j = 0; j < minutedealinfoData.length; j++) {
                  var mdata = minutedealinfoData[j]
                  if (mdata['time'] == timeval) {
                    minutedealinfoData[j] = data[i]
                  }
                }
              }
            }
          }
          _k_line(minutedealinfoData)
          _autoupdate()
          SOCKET_OBJ.addMessageListener('kline_m', function (msg) {
            if (myChart && myChart.isDisposed()) return
            if (msg.type == 'dealinfo') {
              var msgdata = msg.data || {}
              if (msgdata.code == self.dakainfo['code']) {
                var currdeal_time = msgdata.currdeal_time
                var currdeal_price = msgdata.currdeal_price
                var currdeal_count = msgdata.currdeal_count
                var commodity_price = msgdata.commodity_price
                if (JSON.stringify(minutedealinfoData).indexOf(currdeal_time) == -1) {
                  minutedealinfoData.push({
                    count: currdeal_count,
                    price: commodity_price,
                    time: currdeal_time
                  })
                } else {
                  for (var j = 0; j < minutedealinfoData.length; j++) {
                    var mdata = minutedealinfoData[j]
                    if (mdata['time'] == currdeal_time) {
                      minutedealinfoData[j]['count'] += currdeal_count
                      minutedealinfoData[j]['price'] = commodity_price
                    }
                  }
                }
                mychartUpdate(alltimelist, minutedealinfoData)
              }
            }
          })
        })
      }

      _build_kline_m()

      function resizeWindow () {
        myChart && myChart.resize && myChart.resize()
      }
      window.addEventListener('resize', resizeWindow)
      return () => {
        myChart.dispose()
        window.removeEventListener('resize', resizeWindow)
      }
    },
    daychart: function (klineType) {
      var self = this
      var klineType = klineType || 'price'
      var volumespriceMax = 0
      var volumescountMax = 0

      self.dayinfoData = []
      self.datestr = ''
      self.codedealdata = []
      self.codedeal_timestamp = ''
      self.nextcodedealdata = true
      self.nextdata = true

      function _checkdate (_date, _tradeDate) {
        var year = _tradeDate[0].toString().substring(2)
        var month = _tradeDate[1]
        var day = _tradeDate[2]
        if (month < 10) {
          month = '0' + month
        }
        if (day < 10) {
          day = '0' + day
        }
        var _str = year + month.toString() + day.toString()
        if (_date == _str) {
          return true
        } else {
          return false
        }
      }

      function _setMax (_chatdata) {
        var p_data = _chatdata.volumesprice
        var c_data = _chatdata.volumescount
        var _price = []
        for (var i = 0; i < p_data.length; i++) {
          var _val = p_data[i][1]
          if (_val != '-') {
            _price.push(_val)
          }
        }
        var _count = []
        for (var i = 0; i < c_data.length; i++) {
          var _val = c_data[i][1]
          if (_val != '-') {
            _count.push(_val)
          }
        }
        if (_price.length) {
          volumespriceMax = Math.max.apply(null, _price)
        }
        if (_count.length) {
          volumescountMax = Math.max.apply(null, _count)
        }
      }

      function calculateMA (dayCount, data) {
        var result = []
        for (var i = 0, len = data.length; i < len; i++) {
          if (i < dayCount) {
            result.push('-')
            continue
          }
          var sum = 0
          for (var j = 0; j < dayCount; j++) {
            sum += data[i - j][1]
          }
          result.push((sum / dayCount).toFixed(2))
        }
        return result
      }

      function checkdate (str) {
        return '20' + str.substr(0, 2) + '-' + str.substr(2, 2) + '-' + str.substr(4, 2)
      }

      function checkarray (a, len, first) {
        var a_len = a.length
        if (a_len < 61) {
          for (var i = 0; i < 61; i++) {
            if (i > a.length) {
              if (len) {
                var _array = []
                for (var k = 0; k < len; k++) {
                  if (first && k == 0) {
                    _array.push('*@' + i)
                  } else {
                    _array.push('-')
                  }
                }
                a.push(_array)
              } else {
                a.push('*@' + i)
              }
            }
          }
        }
        return a
      }

      function splitDayData (infodata) {
        var _data = self.cloneJson(infodata)
        _data = _data.reverse()
        var categoryData = []
        var values = []
        var volumesprice = []
        var volumescount = []

        var kline = [], dline = [], jline = [], difline = [], demline = [], macd = []

        for (var i = 0; i < _data.length; i++) {
          var subdata = _data[i]
          //Open   Close   Lowest  Highest
          var opening_price = Number(self.formatNum(subdata['opening_price']))
          var commodity_price = Number(self.formatNum(subdata['commodity_price'] || 0))
          var lastclosing_price = Number(self.formatNum(subdata['lastclosing_price'] || 0))
          var commodity_min_price = Number(self.formatNum(subdata['commodity_min_price'] || 0))
          var commodity_max_price = Number(self.formatNum(subdata['commodity_max_price'] || 0))
          var deal_count_sum = subdata['deal_count_sum']//成交量
          var deal_price_sum = Number(self.formatNum(subdata['deal_price_sum']))//成交金额

          var up_or_down = opening_price > commodity_price ? 1 : opening_price == commodity_price ? 0 : -1
          //var up_or_down = opening_price > commodity_price ? 1 : -1;
          var updown_price = commodity_price > lastclosing_price ? -1 : commodity_price == lastclosing_price ? -1 : 1
          //console.log(up_or_down,updown_price)
          if (up_or_down == 0 && updown_price == -1) {
            commodity_price += 0.001
            up_or_down = -1
          }

          categoryData.push(checkdate(_data[i]['opening_date']))
          values.push([opening_price, commodity_price, commodity_min_price, commodity_max_price, deal_count_sum, deal_price_sum, updown_price])
          volumescount.push([i, deal_count_sum, up_or_down])
          volumesprice.push([i, deal_price_sum, up_or_down])

          var cddate = null
          if (self.codedealdata.length) {
            for (var k = 0; k < self.codedealdata.length; k++) {
              var subcd = self.codedealdata[k]
              var tradeDate = subcd.tradeDate
              if (_checkdate(subdata.opening_date, tradeDate)) {
                cddate = self.codedealdata.splice(k, 1)
                break
              }
            }
          }
          if (cddate) {
            cddate = cddate[0]
            kline.push(cddate.k)
            dline.push(cddate.d)
            jline.push(cddate.j)
            difline.push(cddate.dif)
            demline.push(cddate.dem)
            macd.push(cddate.osc)
          } else {
            kline.push('-')
            dline.push('-')
            jline.push('-')
            difline.push('-')
            demline.push('-')
            macd.push('-')
          }
        }

        return {
          categoryData: checkarray(categoryData),
          values: checkarray(values, 6),
          volumesprice: checkarray(volumesprice, 3, 'first'),
          volumescount: checkarray(volumescount, 3, 'first'),

          kline: checkarray(kline),
          dline: checkarray(dline),
          jline: checkarray(jline),
          difline: checkarray(difline),
          demline: checkarray(demline),
          macd: checkarray(macd)
        }
      }

      function _k_line (rawData) {
        var chatdata = splitDayData(rawData)
        _setMax(chatdata)//设置bar最大值

        var dataMA5 = calculateMA(5, chatdata.values)
        var dataMA10 = calculateMA(10, chatdata.values)
        var dataMA20 = calculateMA(20, chatdata.values)

        self.myDayChart = echarts.init(self.daychartEle)
        //var splitNumber = Math.floor(chatdata.categoryData.length/4);
        var optionLeft = 5 * 8 + 4

        var zoomStartValue = chatdata.categoryData[0]
        if (chatdata.categoryData.length > 59) {
          zoomStartValue = chatdata.categoryData[chatdata.categoryData.length - 60]
        }

        var kline_m_obj_height = self.daychartEle.clientHeight
        var chartktop = 30
        var optionKH = kline_m_obj_height - 50 - chartktop - 42//40handle
        var bartop = optionKH + 32 + chartktop
        var grid_option = [
          {
            left: optionLeft,//optionLeft
            right: 15,
            height: optionKH - 10,
            top: chartktop
          },
          {
            left: optionLeft,
            right: 15,
            top: bartop,
            height: 50
          }
        ]

        //console.log(chatdata)

        var _rawData_len = rawData.length
        if (_rawData_len == 1 && rawData[0].opening_daycount == 0) {
          chatdata.values[0] = ['-', '-', '-', '-', '-', '-']
        }

        var option = {
          backgroundColor: '#FFF',
          animation: false,
          title: {
            show: false
          },
          legend: [
            {
              top: 5,
              data: ['日K', 'MA5', 'MA10', 'MA20'],
              itemWidth: 16,
              itemHeight: 12,
              textStyle: {
                fontSize: 12
              },
              data: [
                {
                  name: '日K',
                  textStyle: {
                    color: '#666666'
                  }
                },
                {
                  name: 'MA5',
                  textStyle: {
                    color: '#666666'
                  }
                },
                {
                  name: 'MA10',
                  textStyle: {
                    color: '#8651c3'
                  }
                },
                {
                  name: 'MA20',
                  textStyle: {
                    color: '#e3c17c'
                  }
                }
              ]
            },
            {              
              top: optionKH + chartktop + 10,
              left: optionLeft - 5,
              data: ['volumesprice', 'volumescount'],
              itemWidth: 0,
              itemHeight: 0,
              itemGap: -5,
              padding: [5, 0],
              pageButtonItemGap: 0,
              textStyle: {
                color: '#333',
                fontSize: 12
              },
              selected: {
                'volumesprice': true,
                'volumescount': false,
                'kline': false,
                'dline': false,
                'jline': false,
                'macd': false,
                'demline': false,
                'difline': false
              },
              selectedMode: false,
              formatter: function (name) {
                if (name == 'volumesprice') {
                  name = '成交额  '
                } else if (name == 'volumescount') {
                  name = '成交量  '
                } else if (name == 'kline') {
                  name = 'KDJ  '
                } else if (name == 'dline') {
                  name = ''
                } else if (name == 'jline') {
                  name = ''
                } else if (name == 'macd') {
                  name = 'MACD'
                } else if (name == 'demline') {
                  name = ''
                } else if (name == 'difline') {
                  name = ''
                }
                return name
              }
            }
          ],
          tooltip: {
            //triggerOn: 'none',
            trigger: 'axis',
            axisPointer: {
              type: 'cross',
              lineStyle: {
                color: '#ffb264'
              },
              crossStyle: {
                color: '#feb300'
              },
              label: {
                backgroundColor: '#feb300'
              }
            },
            backgroundColor: 'rgba(245, 245, 245, 0.8)',
            borderWidth: 1,
            borderColor: '#999',
            padding: 5,
            textStyle: {
              color: '#333',
              fontSize: 12
            },
            position: function (pos, params, el, elRect, size) {
              var obj = { top: 5 }
              obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5
              return obj
            }
          },
          axisPointer: {
            link: { xAxisIndex: 'all' },
            label: {
              padding: [2, 6, 2, 6],
              textStyle: {
                fontSize: 12
              },
              backgroundColor: '#777'
            }
          },
          visualMap: [
            /*{
             show:false,
             seriesIndex: 0,
             dimension: 6,
             pieces: [{
             value: -1,
             color: '#FD1050'
             }, {
             value: 1,
             color: '#0CF49B'
             }, {
             value: 0,
             color: '#FD1050'
             }],
             formatter:function(value, value2){
             if(value==0){
             return -1
             }else{
             return value
             }
             }
             },*/
            {
              show: false,
              seriesIndex: 1,
              dimension: 2,
              pieces: [{
                value: -1,
                color: '#FD1050'
              }, {
                value: 1,
                color: '#0CF49B'
              }, {
                value: 0,
                color: '#0CF49B'
              }]
            },
            {
              show: false,
              seriesIndex: 2,
              dimension: 2,
              pieces: [{
                value: -1,
                color: '#FD1050'
              }, {
                value: 1,
                color: '#0CF49B'
              }, {
                value: 0,
                color: '#0CF49B'
              }]
            },
            {
              show: false,
              seriesIndex: 3,
              pieces: [{
                gt: 0,
                color: '#FD1050'
              }, {
                lte: 0,
                color: '#0CF49B'
              }]
            }
          ],
          grid: grid_option,
          xAxis: [
            {
              type: 'category',
              data: chatdata.categoryData,
              scale: true,
              boundaryGap: true,
              axisLine: {
                onZero: false,
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              axisTick: {
                inside: true,
                length: 1
              },
              axisLabel: {
                show: true,
                margin: 3,
                //interval: splitNumber,
                interval: function (index, value) {
                  if (
                    value
                    //
                    && (index == 0 || value.substr(value.length - 2, 2) == '01' || index == chatdata.categoryData.length - 1)
                  ) {
                    return true
                  }
                },
                formatter: function (value, index) {
                  if (value.indexOf('*@') == -1) {
                    return value.substr(0, 7)
                  } else {
                    return ''
                  }
                },
                textStyle: {
                  color: '#333',
                  fontSize: 11
                },
                showMinLabel: true,
                showMaxLabel: true
              },
              splitLine: {
                show: true,
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              min: 'dataMin',
              max: 'dataMax',
              axisPointer: {
                show: true,
                label: {
                  formatter: function (params) {
                    //var seriesValue = (params.seriesData[0] || {}).value;
                    if (params.value.indexOf('*@') == -1) {
                      return params.value
                    } else {
                      return ''
                    }
                  }
                },
                z: 100
              }
            },
            {
              type: 'category',
              gridIndex: 1,
              data: chatdata.categoryData,
              scale: true,
              boundaryGap: true,
              axisLine: {
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              axisTick: {
                show: false
              },
              splitLine: {
                show: true,
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              axisLabel: {
                show: false,
                interval: function (index, value) {
                  if (
                    value
                    && (index == 0 || value.substr(value.length - 2, 2) == '01' || index == chatdata.categoryData.length - 1)
                  ) {
                    return true
                  }
                },
                textStyle: {
                  color: '#333',
                  fontSize: 11
                }
              },
              //splitNumber: splitNumber,
              min: 'dataMin',
              max: 'dataMax',
              axisPointer: {
                label: {
                  show: false
                },
                /* handle: {
                     show: true,
                     margin: 20,
                     size:30,
                     color: '#B80C00'
                 }*/
              }
            }
          ],
          yAxis: [
            {
              scale: true,
              splitNumber: 1,
              axisTick: {
                inside: true
              },
              axisLine: {
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              splitLine: {
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              axisLabel: {
                margin: 2,
                textStyle: {
                  color: '#333',
                  fontSize: 11,
                  baseline: 'bottom'
                },
                formatter: function (value, index) {
                  if (value > 0) {
                    value = Number(value.toFixed(2))
                  }
                  return value
                }
              },
              min: 'dataMin',
              max: function(value) {
                var _max = value.max;
                return Number((_max+_max*0.08).toFixed(2));
              },
              axisPointer: {
                z: 101
              }
            },
            {
              scale: true,
              gridIndex: 1,
              splitNumber: 1,
              axisLabel: {
                margin: 2,
                textStyle: {
                  color: '#333',
                  fontSize: 11
                },
                showMinLabel: true,
                showMaxLabel: true,
                formatter: function (value, index) {
                  //console.log(index,value)
                  if (klineType == 'price' || klineType == 'count') {
                    if (index == 0) {
                      var num = ''
                      if (klineType == 'price') {
                        num = self.sysUnit
                      } else if (klineType == 'count') {
                        num = '秒'
                      }
                      value = num
                    } else {
                      if (value > 0) {
                        value = self.unitCount(value)
                      }
                    }
                  } else {
                    //value = '';
                  }
                  return value
                }
              },
              axisLine: {
                show: true,
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              axisTick: {
                inside: true
              },
              splitLine: {
                lineStyle: {
                  color: '#e9e9e9'
                }
              },
              axisPointer: {
                z: 101
              }
            }
          ],
          dataZoom: [
            {
              type: 'inside',
              xAxisIndex: [0, 1],
              zoomLock: false,
              startValue: zoomStartValue,
              endValue: chatdata.categoryData[chatdata.categoryData.length - 1]
            }
          ],
          series: [
            {
              name: '日K',
              type: 'candlestick',
              data: chatdata.values,
              itemStyle: {
                normal: {
                  color: '#FD1050',
                  color0: '#0CF49B',
                  borderColor: '#FD1050',
                  borderColor0: '#0CF49B'
                }
              },
              //dimensions: ['date', 'open', 'close', 'highest', 'lowest'],
              encode: {
                x: 0,
                y: [1, 2, 3, 4],
                //y: [1, 2, 3, 4, 7]
              }
            },
            {
              name: 'volumesprice',
              type: 'bar',
              xAxisIndex: 1,
              yAxisIndex: 1,
              data: chatdata.volumesprice
            },
            {
              name: 'volumescount',
              type: 'bar',
              xAxisIndex: 1,
              yAxisIndex: 1,
              data: chatdata.volumescount
            },
            {
              name: 'macd',
              type: 'bar',
              xAxisIndex: 1,
              yAxisIndex: 1,
              data: chatdata.macd
            },
            {
              name: 'kline',
              type: 'line',
              xAxisIndex: 1,
              yAxisIndex: 1,
              data: chatdata.kline,
              smooth: true,
              showSymbol: false,
              lineStyle: {
                normal: {
                  width: 1,
                  color: '#626262'
                }
              }
            },
            {
              name: 'dline',
              type: 'line',
              xAxisIndex: 1,
              yAxisIndex: 1,
              data: chatdata.dline,
              smooth: true,
              showSymbol: false,
              lineStyle: {
                normal: {
                  width: 1,
                  color: '#454693'
                }
              }
            },
            {
              name: 'jline',
              type: 'line',
              xAxisIndex: 1,
              yAxisIndex: 1,
              data: chatdata.jline,
              smooth: true,
              showSymbol: false,
              lineStyle: {
                normal: {
                  width: 1,
                  color: '#8342d0'
                }
              }
            },
            {
              name: 'demline',
              type: 'line',
              xAxisIndex: 1,
              yAxisIndex: 1,
              data: chatdata.demline,
              smooth: true,
              showSymbol: false,
              lineStyle: {
                normal: {
                  width: 1,
                  color: '#252166'
                }
              }
            },
            {
              name: 'difline',
              type: 'line',
              xAxisIndex: 1,
              yAxisIndex: 1,
              data: chatdata.difline,
              smooth: true,
              showSymbol: false,
              lineStyle: {
                normal: {
                  width: 1,
                  color: '#5d5d5d'
                }
              }
            },
            {
              name: 'MA5',
              type: 'line',
              data: dataMA5,
              smooth: true,
              showSymbol: false,
              lineStyle: {
                normal: {
                  width: 1,
                  color: '#666666'
                }
              }
            },
            {
              name: 'MA10',
              type: 'line',
              data: dataMA10,
              smooth: true,
              showSymbol: false,
              lineStyle: {
                normal: {
                  width: 1,
                  color: '#8651c3'
                }
              }
            },
            {
              name: 'MA20',
              type: 'line',
              data: dataMA20,
              smooth: true,
              showSymbol: false,
              lineStyle: {
                normal: {
                  width: 1,
                  color: '#e3c17c'
                }
              }
            }
          ]
        }

        self.myDayChart.setOption(option, true)

        self.myDayChart.on('datazoom', function (params) {
          var start = params.batch[0].start
          if (start == 0) {
            _kl(2)
          }
        })
        mydaycharttooltip()

        var legendactive = 0
        var legenddata = [
          'price',
          'count'
        ]

        function setlegend (legendactive) {
          var _selected = {
            'volumesprice': false,
            'volumescount': false,
            'kline': false,
            'dline': false,
            'jline': false,
            'macd': false,
            'demline': false,
            'difline': false
          }
          klineType = legenddata[legendactive]
          if (legendactive == 0) {
            _selected.volumesprice = true
            //klineType='price'
          } else if (legendactive == 1) {
            _selected.volumescount = true
            //klineType='count'
          } else if (legendactive == 2) {
            _selected.kline = true
            _selected.dline = true
            _selected.jline = true
          } else if (legendactive == 3) {
            _selected.macd = true
            _selected.demline = true
            _selected.difline = true
          }
          self.myDayChart.setOption({
            legend: [
              {},
              {
                selected: _selected
              }
            ]
          })
        }

        self.myDayChart.getZr().on('click', function (params) {
          var offsetY = params.offsetY || 0
          if (offsetY > bartop - 22 && offsetY < bartop + 50) {
            legendactive++
            if (legendactive > legenddata.length - 1) {
              legendactive = 0
            }
            setlegend(legendactive)
          }
        })

        /*self.myDayChart.on('legendselectchanged',function(obj){

         })*/
      }

      function mydaycharttooltip () {
        self.myDayChart.setOption({
          tooltip: {
            formatter: function (params, ticket, callback) {
              //console.log(params)
              var param, MA5, MA10, MA20, kline, dline, jline, macd, demline, difline
              for (var i = 0; i < params.length; i++) {
                var subparam = params[i]
                var seriesType = subparam.seriesType
                var value = subparam.value || '-'
                var seriesName = subparam.seriesName
                if (value != '-' && value != 'NaN' && value.toString().indexOf('*@') == -1) {
                  if (seriesName == 'MA5') {
                    MA5 = value
                  } else if (seriesName == 'MA10') {
                    MA10 = value
                  } else if (seriesName == 'MA20') {
                    MA20 = value
                  }

                  if (seriesName == 'kline') {
                    kline = value.toFixed(2)
                  }
                  if (seriesName == 'dline') {
                    dline = value.toFixed(2)
                  }
                  if (seriesName == 'jline') {
                    jline = value.toFixed(2)
                  }

                  if (seriesName == 'macd') {
                    macd = value.toFixed(2)
                  }
                  if (seriesName == 'demline') {
                    demline = value.toFixed(2)
                  }
                  if (seriesName == 'difline') {
                    difline = value.toFixed(2)
                  }
                }
                if (seriesType == 'candlestick') {
                  param = subparam
                }
              }
              //count  param.data[5]
              //price  param.data[6]
              var datename = param.name
              if (datename.indexOf('*@') != -1) {
                datename = '-'
              }
              var opening_price = param.data[1]
              var closing_price = param.data[2]
              if (opening_price != '-') {
                opening_price = Number(opening_price).toFixed(2)
              }
              if (closing_price != '-') {
                closing_price = Number(closing_price).toFixed(2)
              }

              var showval = [
                '日期: ' + datename + '<hr size=1 style="margin: 3px 0;">',
                '开盘: ' + opening_price + '<br/>',
                '收盘: ' + closing_price + '<br/>',
                '最低: ' + param.data[3] + '<br/>',
                '最高: ' + param.data[4] + '<br/>',
                '成交额: ' + param.data[6] + '<br/>',
                '成交量: ' + param.data[5] + '<br/>'
              ]
              if (MA5) {
                showval.push('MA5: ' + MA5 + '<br/>')
              }
              if (MA10) {
                showval.push('MA10: ' + MA10 + '<br/>')
              }
              if (MA20) {
                showval.push('MA20: ' + MA20 + '<br/>')
              }
              if (kline && dline && jline) {
                showval.push('<hr size=1 style="margin: 3px 0;">')
                showval.push('<span style="color:#626262">K: ' + kline + '</span><br/>')
                showval.push('<span style="color:#454693">D: ' + dline + '</span><br/>')
                showval.push('<span style="color:#8342d0">J: ' + jline + '</span><br/>')
              }
              if (macd && demline && difline) {
                showval.push('<hr size=1 style="margin: 3px 0;">')
                showval.push('<span style="">MACD: ' + macd + '</span><br/>')
                showval.push('<span style="color:#252166">DEA: ' + demline + '</span><br/>')
                showval.push('<span style="color:#5d5d5d">DIFF: ' + difline + '</span><br/>')
              }
              if (datename != '-') {
                return showval.join('')
              } else {
                return
              }
            }
          }
        })
      }

      function mydaychartUpdate (rawData) {
        var chatdata = splitDayData(rawData)
        _setMax(chatdata)//设置bar最大值
        if (self.myDayChart) {
          self.myDayChart.setOption({
            xAxis: [
              { data: chatdata.categoryData },
              { data: chatdata.categoryData }
            ],
            series: [
              {
                name: '日K',
                data: chatdata.values
              },
              {
                name: 'volumesprice',
                data: chatdata.volumesprice
              },
              {
                name: 'volumescount',
                data: chatdata.volumescount
              }
            ]
          })
          mydaycharttooltip()
        }
      }

      function _getdata (datestr, call) {
        self.nextdata = false
        self.getdayklineinfo(self.dakainfo['code'], datestr, function (data) {
          if (data.length < 60) {
            self.nextdata = false
          } else {
            self.nextdata = true
          }
          call && call(data)
        })
      }

      function _kl (type) {
        if (!self.nextdata) {
          return
        }
        type = type || 1
        _getdata(self.datestr, function (data) {
          var len = data.length
          if (len) {
            for (var i = 0; i < len; i++) {
              self.dayinfoData.push(data[i])
              self.datestr = data[i].opening_date
            }
            if (type == 2) {
              mydaychartUpdate(self.dayinfoData)
            } else {
              _k_line(self.dayinfoData)
            }
          }
        })
      }

      _kl(1)

      SOCKET_OBJ.addMessageListener('kline_d', function (msg, targetSocketid) {
        if (self.myDayChart && self.myDayChart.isDisposed()) return
        if (msg.type == 'dealinfo') {
          var msgdata = msg.data || {}
          var s_opening_date = msgdata['opening_date'] || ''
          if (msgdata.code == self.dakainfo['code'] && self.dayinfoData[0]['opening_date'] == s_opening_date) {
            var currdeal_time = msgdata.currdeal_time
            var currdeal_price = msgdata.currdeal_price
            var currdeal_count = msgdata.currdeal_count
            var commodity_price = msgdata.commodity_price

            self.dakainfo.commodity_max_price = msgdata.commodity_max_price
            self.dakainfo.commodity_min_price = msgdata.commodity_min_price
            self.dakainfo.commodity_price = commodity_price
            self.dakainfo.deal_count_sum += currdeal_count
            self.dakainfo.deal_price_sum += currdeal_price
            self.dakainfo.total_count_sum += currdeal_count
            self.dakainfo.total_price_sum += currdeal_price

            self.dayinfoData[0].commodity_max_price = self.dakainfo.commodity_max_price
            self.dayinfoData[0].commodity_min_price = self.dakainfo.commodity_min_price
            self.dayinfoData[0].commodity_price = self.dakainfo.commodity_price
            self.dayinfoData[0].deal_count_sum = self.dakainfo.deal_count_sum
            self.dayinfoData[0].deal_price_sum = self.dakainfo.deal_price_sum
            self.dayinfoData[0].total_count_sum = self.dakainfo.total_count_sum
            self.dayinfoData[0].total_price_sum = self.dakainfo.total_price_sum
            mydaychartUpdate(self.dayinfoData)
          }
        }
      })

      function resizeWindow () {
        self.myDayChart && self.myDayChart.resize && self.myDayChart.resize()
      }
      window.addEventListener('resize', resizeWindow)

      return () => {
        self.myDayChart.dispose()
        window.removeEventListener('resize', resizeWindow)
      }
    },
    init: function (dakainfo, minutebox, daybox, timedifference) {
      this.dakainfo = dakainfo || {}
      this.minutechartEle = minutebox
      this.daychartEle = daybox
      timedifference && (this.timedifference = Number(timedifference))
    }
  }
  function socketInit () {
    SOCKET_OBJ.init()      
  }
  function createChart (options) {
    let dakainfo = options.dakainfo
    let minuteBox = options.minuteBox
    // let dayBox = options.dayBox
    let wudang_socket = options.wudang_socket
    let log_socket = options.log_socket
    let deal_socket = options.deal_socket

    getKminuteData = options.getKminuteData
    getdayKlineinfodata = options.getdayKlineinfodata


    DAKA_CHART.init(dakainfo, minuteBox)
    var destoryMinute = DAKA_CHART.minutechart()
    // var destoryDay = DAKA_CHART.daychart()

    //五档和交易明细,socket消息监听
    SOCKET_OBJ.addMessageListener('wudang_deallogs', function (msg) {
      if (dakainfo == null) return
      if (msg.type == 'wudang') {
        var msgdata = msg.data || {}
        if (msgdata.code == dakainfo['code']) {
          typeof wudang_socket === 'function' && wudang_socket(msgdata)
        }
      } else if (msg.type == 'deallogs') {
        var msgdata = msg.data || {}
        if (msgdata.code == dakainfo['code']) {
          typeof log_socket === 'function' && log_socket(msgdata)
        }
      } else if (msg.type == 'dealinfo') {
        var msgdata = msg.data || {}
          typeof deal_socket === 'function' && deal_socket(msgdata)
      }
    })
    return function destory () {
      try {
        console.log('开始销毁图表')
        destoryMinute()
        // destoryDay()
        dakainfo = null
      } catch (e) {
        console.log(e)
      }
    }
  }

  window.createChart = createChart
  window.socketInit = socketInit
} ())



