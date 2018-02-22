var HOST = (function () {
  var qa = {
    isqa: true,
    server: '//qa-b2bstock.yaotv.tvm.cn',
    pmall: '//qa.pmall.yaotv.tvm.cn',
    wsqcdn: '//qa-wsq.mtq.tvm.cn'
  }
  var prod = {
    isqa: false,
    server: '//t.tvm.cn',
    pmall: '//pmall.yaotv.tvm.cn',
    wsqcdn: '//wsq-cdn.yaotv.tvm.cn'
  }
  if (/^(qa|localhost|192)/.test(location.host)) {
    return qa
  } else {
    return prod
  }
}())
window.HOST = HOST

function isAuth (e) {
  if (e && e instanceof Error && String(e.code) === '401') {
    return true
  }
  return false
}
