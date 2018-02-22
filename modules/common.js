"use strict";

window.$ = layui.$;
var user;

function getUser() {
    return $.get(HOST.server + "/stock/checkLogin");
}

function logout () {
    return $.post(`${HOST.server}/stock/logout`).then(predeal)
}

function userInfo(cb) {
    var userStr = localStorage.getItem("user");
    user = JSON.parse(userStr);
    if (userStr) {
        return cb()
    }
    getUser().then(function (res) {
        if (res.status != 'success') {
            window.location.href = "./login.html";
            return cb()
        }
        user = res.data;
        user.tvmid = res.data.userId;
        localStorage.setItem("user", JSON.stringify(user));
        cb()
    });
}

function checkLogin(cb) {
    user = null
    getUser().then(function (res) {
        if (res.status != 'success') {
            window.location.href = "./login.html";
            return;
        }
        user = res.data;
        user.tvmid = res.data.userId;
        return cb()
    });
}

function predeal(res) {
    if (res.status !== 'success') {
        layer.msg(res.errMsg, {
            icon: 5,
            time: 1000
        }, function () {
            if (res.code === 401) {
                window.location.href = "./login.html";
            }
            return 
        });
    }
    // console.log("result=",res.data)
    return res.data;
}

function userLogout(){
    logout().then(function () {
        localStorage.removeItem("user")
        window.location.href = "./login.html"
    })
}