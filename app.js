var express = require('express') //生成一个express实例app
var proxy = require('express-http-proxy')
var axios = require('axios')
var bodyParser = require('body-parser')
var app = express()

var cookieParser = require('cookie-parser')

axios.defaults.withCredentials = true

axios.defaults.baseURL = ''

app.set('port', process.env.PORT || 8088)

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({ extended: false }))

app.use(cookieParser())

app.all('*', function (req, res, next) {
  //设置请求头
  //允许所有来源访问
  res.header('Access-Control-Allow-Origin', '*')
  //用于判断request来自ajax还是传统请求
  res.header('Access-Control-Allow-Headers', ' Origin, X-Requested-With, Content-Type, Accept')
  //允许访问的方式
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
  //修改程序信息与版本
  res.header('X-Powered-By', ' 3.2.1')
  //内容类型：如果是post请求必须指定这个属性
  res.header('Content-Type', 'application/json;charset=utf-8')
  next()
})

function getCookie(cookie, key) {
  let obj = {}
  if (!cookie.length < 0) {
    return obj
  }

  var cookies = cookie.split('GMT,')
  for (let i = 0; i < cookies.length; i++) {
    let cookieObj = {}
    let keyName = ''

    let cookieItem = (cookies[i] += i === cookies.length - 1 ? '' : 'GMT')
    let cookieItems = cookieItem.split('; ')
    for (let l = 0; l < cookieItems.length; l++) {
      let item = cookieItems[l]
      let itemObj = item.split('=') // 再次切割
      if (l == 0) {
        keyName = itemObj[0]
        cookieObj.value = itemObj[1]
      } else {
        cookieObj[itemObj[0]] = itemObj[1]
      }
    }

    obj[keyName] = cookieObj
  }

  return obj
}

const query = {
  POST: 'post',
  GET: 'get',
}

app.use('/api', async function (req, res) {
  console.log(req.originalUrl, new Date())
  console.log(req)

  axios[query[req.method]](
    req.originalUrl,
    req.method === 'GET'
      ? {
          params: req,
        }
      : req.body,
    {
      headers: req.headers,
    }
  )
    .then(response => {
      console.log(response, 'res')
      if (req.originalUrl.indexOf('login') != -1) {
        let cookie = getCookie(response.headers['set-cookie'])
        for (let attr in cookie) {
          res.cookie(attr, cookie[attr].value, { maxAge: cookie[attr]['Max-Age'], path: cookie[attr]['Path'], httpOnly: true })
        }
      }
      res.status(response.status).json(response.data)
    })
    .catch(error => {
      console.log(error.response, 'error')
      res.status(error.response.status).json(error.response.data)
    })
})

//服务启动成功提示
app.listen(app.get('port'), function () {
  console.log('Express server listening on port http://127.0.0.1' + ':' + app.get('port'))
  // var uri = 'http://localhost:' + app.get('port');
  // opn(uri)
})
