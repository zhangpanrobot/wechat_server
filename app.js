//TODO: 缓存过期处理
var express = require('express');
var request = require('request');
var sign = require('./sign') //生成签名

var appInfo = {
    appId: 'wx693582460d15cb5e',
    appSecret: '80b2223d57b8050bb02759471849154a',
    base_access_token: '', //需缓存(TODO: 刷新机制)
    jsapi_ticket: '', //需缓存(TODO: 刷新机制)
    url: '' //需要调用jssdk接口的网页
}

var wechatApi = {
    //网页授权(获取用户信息)
    get_web_access_token: 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + appInfo.appId + '&secret=' + appInfo.appSecret + '&code={CODE}&grant_type=authorization_code',
    // 获取用户信息
    get_user_info: 'https://api.weixin.qq.com/sns/userinfo?access_token={ACCESS_TOKEN}&openid={OPENID}&lang=zh_CN',
    //js-sdk基本access_token(需缓存)
    get_base_access_token: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appInfo.appId + '&secret=' + appInfo.appSecret,
    //获得jsapi_ticket, 用来生成signature, (config)
    get_ticket: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token={ACCESS_TOKEN}&type=jsapi'
}

// TODO: 数据库配置
var app = express();

app.get('/', function(req, res) {
    res.send('Hello World!');
});


//用户认证
app.get('/getUserInfo.do', function(req, res) {
    var code = req.query.code
    getWebAccessToken(code, res)
})

//生成签名
app.get('/signature.do', function(req, res) {
    var url = req.query.url;
    appInfo.url = url; //url（当前网页的URL，不包含#及其后面部分）
    getBaseAccessToken(res)
})

//用户授权
function getInfo(wechatInfo, res) {
    request(wechatApi.get_user_info.replace(/{ACCESS_TOKEN}/, wechatInfo.access_token).replace(/{OPENID}/, wechatInfo.openid), function(error, response, body) {
        if (!error && response.statusCode == 200) {
            if (typeof body == 'string') {
                body = JSON.parse(body)
            }
            var result = {};
            result.errcode = 0
            result.data = body
            res.json(result)
        } else {
            res.json({
                errcode: 1
            })
        }
    })
}

//网页用户信息
function getWebAccessToken(code, res) {
    request(wechatApi.get_web_access_token.replace(/{CODE}/, code), function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var wechatInfo = {}
            if (typeof body == 'string') {
                body = JSON.parse(body)
            }
            appInfo.web_access_token = body.access_token
            wechatInfo.access_token = body.access_token
            wechatInfo.openid = body.openid
            wechatInfo.refresh_token = body.refresh_token
            getInfo(wechatInfo, res)
        }
    })
}


//基本api调用
function getBaseAccessToken(res) {
    if (appInfo.base_access_token) {
        getTicket(res)
    } else {
        request(wechatApi.get_base_access_token, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                if (typeof body == 'string') {
                    body = JSON.parse(body)
                }
                appInfo.base_access_token = body.access_token
                    //access_token
                getTicket(res)
            }
        })
    }
}

function getTicket(res) {
    console.log(appInfo)
    if (appInfo.jsapi_ticket) {
        res.json(sign(appInfo.jsapi_ticket, appInfo.url))
    } else {
        request(wechatApi.get_ticket.replace(/{ACCESS_TOKEN}/, appInfo.base_access_token), function(error, response, body) {
            if (!error && response.statusCode == 200) {
                if(typeof body == 'string') {
                  body = JSON.parse(body)
                }
                appInfo.jsapi_ticket = body.ticket
                res.json(sign(appInfo.jsapi_ticket, appInfo.url))
            }
        })
    }
}


app.listen(443, function() {
    console.log('Example app listening on port 4000!');
})
