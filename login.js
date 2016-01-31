function getInfo(wechatInfo){
  request(wechatApi.userInfo.replace(/{ACCESS_TOKEN}/, wechatInfo.access_token).replace(/{OPENID}/, wechatInfo.openid), function(error, response, body) {
      if (!error && response.statusCode == 200) {
          res.json(body)
      }
  })
}

//用户认证
app.get('/getUserInfo.do', function(req, res) {
    var code = req.query.code
    request(wechatApi.accessToken.replace(/{CODE}/, code), function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var wechatInfo = {}
        if(typeof body == 'string'){
          body = JSON.parse(body)
        }
        wechatInfo.access_token = body.access_token
        wechatInfo.openid = body.openid
        wechatInfo.refresh_token = body.refresh_token
        getInfo(wechatInfo)
      }
    })
})
