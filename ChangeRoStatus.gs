//script needs to setup time-based trigger for running   

//{'<status from>': '<status to>', ...}
const curSett = {
  '526139': '526140'
};

const APIKEY = '365b................... e5';
const BASEURL = 'https://api.orderry.com/';
const TOKEN = roLogin();

function main(){

  const orders = getRoOrder().filter(function(el){
                return el?.status_overdue
  });
  let urls = [];
  let token = TOKEN ? TOKEN : roLogin();
  orders.forEach(el =>{
    var request = {
      'url': BASEURL+'order/status/',
      'method' : 'post',
      'payload' : {'token': token,
                  'order_id':''+el?.id, 
                  'status_id': ''+curSett[el?.status?.id]       
      }
    };
    urls.push(request);
    });
  Logger.log("Count of orders to be changed %s", urls.length);
  let res = [];
  let responses = UrlFetchApp.fetchAll(urls); 
      responses.forEach(el => {
      let d = JSON.parse(el.getContentText("UTF-8"));
      res.push(d?.data);
    }); 
  Logger.log(res);
}

function roLogin() {
  //get token to work with orderry api 
  let url = BASEURL+'token/new';
 
  let options = {
        'method' : 'post',
        'payload' : 'api_key='+APIKEY,
        'content-type' : 'application/x-www-form-urlen-coded',
        'muteHttpExceptions' : false
        };
  
  let login = UrlFetchApp.fetch(url, options);
  let data = JSON.parse(login.getContentText("UTF-8"));

  if (data.success) return(data.token);

return false;
}

function getRoOrder() {
  //return all orders as array with given statuses from curSett

  let token = TOKEN ? TOKEN : roLogin();
  let url = BASEURL+'order/';
  var statuses = '';
  for(var k in curSett){
    statuses += '&statuses[]='+ k
  }

  url = url+'?token='+token+statuses+'&page=1';
  let options = {
        'method' : 'get',
        'content-type' : 'application/x-www-form-urlen-coded',
        'muteHttpExceptions' : true,
        'mode': 'same-origin'
        };  

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText("UTF-8"));
  const count = data?.count;
  const pages = Math.ceil(count/50);
  let res = data.data;
  if (pages > 1 ) {
    let urls = [];
    
    for(let i = 2; i <= pages; i++) {
      urls.push(BASEURL+'order/?token='+token+statuses+'&page='+i);
    }
    var responses = UrlFetchApp.fetchAll(urls); 
    responses.forEach(el => {
      let d = JSON.parse(el.getContentText("UTF-8"));
      d?.data.forEach(el=> res.push(el));
    }); 

  } 
  return res;
}
