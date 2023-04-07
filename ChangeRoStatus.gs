//script needs to setup time-based trigger for running  
//V 2.0  

//setting rules for statuses
//when the "status from" becomes expired (overdue) it will be changed to a new "status to" 
//status names exactly like in Orderry
//the syntax is:
//{'<status from>': '<status to>', ...}
//

const curSett = {
  'Новый': 'Контроль оплаты',  
  'Дозвон 2': 'Дозвон 3',
  'Дозвон 3':'Дозвон 4', 
};

const APIKEY = '237....................9d85';  //the key from orderry settings - api
const BASEURL = 'https://api.remonline.app/'; //instance of api server or api.orderry.com

var TOKEN = roLogin();
var allStatuses = getRoStatuses();
var idSett = {};

for(k in curSett){
  idSett[''+allStatuses.filter(function(e){
    return e?.name == k;
  })[0]?.id] = ''+allStatuses.filter(function(e){
    return e?.name == curSett[k];
  })[0]?.id;
}

Logger.log(idSett);

function main(){

  const orders = getRoOrder().filter(function(el){
                return el?.status_overdue
  });
  let urls = [];
  let token = TOKEN ? TOKEN : roLogin();
  orders.forEach(el =>{
    let request = {
      'url': BASEURL+'order/status/',
      'method' : 'post',
      'payload' : {'token': token,
                  'order_id':''+el?.id, 
                  'status_id': ''+idSett[el?.status?.id]       
      }
    };
    urls.push(request);
    });

  count = urls.length;
  Logger.log("Count of orders to be changed %s", count);
  let res = [];
  let ind = 50;
  // because of google limit for fetching - making a fetch by parts of 50 request per iteration
  for (let i=0; i<count; i+=ind){
    let responses = UrlFetchApp.fetchAll(urls.slice(i,i+ind)); 
        responses.forEach(el => {
        let d = JSON.parse(el.getContentText("UTF-8"));
        res.push(d?.data);
      }); 
    Logger.log("Processing amount %s", i);
  }
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

  if (data?.success) return(data?.token);

return false;
}

function getRoStatuses() {
  //return all statuses from account
  let token = TOKEN ? TOKEN : roLogin();
  let url = BASEURL+'statuses/?token='+token;
  let options = {
        'method' : 'get',
        'muteHttpExceptions' : true,
        'mode': 'same-origin'
        }; 
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText("UTF-8"));
  return data?.data;
}

function getRoOrder() {
  //return all orders as array with given statuses from curSett

  let token = TOKEN ? TOKEN : roLogin();
  let url = BASEURL+'order/';
  var statuses = '';
  for(var k in idSett){
    statuses += '&statuses[]='+ k
  }

  url = url+'?token='+token+statuses+'&page=1';
  let options = {
        'method' : 'get',
        'muteHttpExceptions' : true,
        'mode': 'same-origin'
        };  

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText("UTF-8"));
  const count = data?.count;
  const pages = Math.ceil(count/50);
  let res = data?.data;
  if (pages > 1 ) {
    let urls = [];
    
    for(let i = 2; i <= pages; i++) {
      urls.push(BASEURL+'order/?token='+token+statuses+'&page='+i);
    }
    let ind = 50;
    for (let i=0; i<pages; i+=ind){
      // because of google limit for fetching - making a fetch by parts of 50 request per iteration
      var responses = UrlFetchApp.fetchAll(urls.slice(i,i+ind)); 
      responses.forEach(el => {
        let d = JSON.parse(el.getContentText("UTF-8"));
        d?.data.forEach(el=> res.push(el));
      }); 
      Logger.log("Fetched part %s", i);
    }
  } 
  return res;
}

