'use strict';

layui.define(function (exports) {
    //调接口
    var $ = layui.jquery;
    //输出接口
    exports('curlTool', function (url, type, dataType, data, callback) {
        $.ajax({
            url: url,
            type: type,
            dataType: dataType,
            data: data,
            success: callback
        });
    });
});
layui.define(function (exports) {
    exports('Tools', function () {});
});