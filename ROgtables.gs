//функции для расширения возможностей гугл-таблиц для работы с РемОНлайн
//
//

var api_key = '';
var token = '';
var LifeTime = new Date();

function _today0() {
 var dd = new Date();
 var dd2= new Date(dd.getFullYear()+'.'+(dd.getMonth()+1)+'.'+dd.getDate());
 return dd2.getTime(); 
}

function _roLogin() {
  //логинимся в РО
  var url = 'https://api.remonline.ru/token/new';
  var options = {
        'method' : 'post',
        'payload' : 'api_key=' + api_key,
        'content-type' : 'application/x-www-form-urlen-coded',
        'muteHttpExceptions' : false  
      };
  
 if (token == '' || LifeTime < new Date()) { 
  //нужен новый токен
  var login = UrlFetchApp.fetch(url , options);
  var data = JSON.parse(login.getContentText("UTF-8"));
  var lt = new Date().getTime()+480000;
  if (data.success) {
     token = data.token;
     LifeTime = new Date(lt);
   } else {
     return (0);
   }
  }
 return (1);
}

function getROcashbox() {
//получаем список касс
 if (_roLogin() == 0) {return ([0])}

  var url = 'https://api.remonline.ru/cashbox/?token='+token;
  var login = UrlFetchApp.fetch(url);
  var data = JSON.parse(login.getContentText("UTF-8"));
  var i=0;
  if (data.success != true) {
    return ([0]);
    }
  var ids =[];
  for (i in data.data) {
  ids [i] = [data.data[i].currency, data.data[i].balance, data.data[i].type, data.data[i].title, data.data[i].id];
  }
  return (ids);
}

function getROtodayCash(dd, dd0) {
//обороты по кассам за период
 if (_roLogin() == 0) {return ([0])}
 //запросим список касс
  var url = 'https://api.remonline.ru/cashbox/?token='+token;
  var login = UrlFetchApp.fetch(url);
  var data = JSON.parse(login.getContentText("UTF-8"));
  if (data.count == 0) {
    return ([0]);
    }
  var ids = 0;
  var i=0; 
  var rc = 0;
  dd0 = new Date(dd0).getTime();
  dd = new Date(dd).getTime();
  var rng = [];  
  for (i in data.data) {
     ids = data.data[i].id;
     //движение по кассе
     url = 'https://api.remonline.ru/cashbox/report/'+ids+'?token='+token+'&created_at[]='+dd0+'&created_at[]='+dd;
     login = UrlFetchApp.fetch(url);
     var cash = JSON.parse(login.getContentText("UTF-8"));
     var j=0;
     for (j in cash.data) {
        rng[rc] = [ids,data.data[i].title, data.data[i].currency, cash.data[j].value,cash.data[j].direction,cash.data[j].employee_id,new Date(cash.data[j].created_at),cash.data[j].description];
        rc = rc + 1;
        }   
   }
   return(rng);
}

function getROwarehouses() {
//список складов
if (_roLogin() == 0) {return ([0])}
 //запросим список складов
  var url = 'https://api.remonline.ru/warehouse/?token='+token;
  var login = UrlFetchApp.fetch(url);
  var data = JSON.parse(login.getContentText("UTF-8"));
  var i=0;
  if (data.success != true) {
    return ([0]);
  }
  var ids=[];
  for (i in data.data) {
     ids[i] = [data.data[i].id,data.data[i].title];
  }
  return(ids);
}

function getROlocations() {
//список локаций
if (_roLogin() == 0) {return ([0])}
  //запросим список локаций
  var url = 'https://api.remonline.ru/branches/?token='+token;
  var login = UrlFetchApp.fetch(url);
  var data = JSON.parse(login.getContentText("UTF-8"));
  if (data.success != true) {
    return ([0]);
  }
  var i=0;
  var ids=[];
  for (i in data.data) {
     ids[i] = [data.data[i].id, data.data[i].name];
  }
  return(ids);
}

function getROorders(dd,dd0) {
//заказы за период
if (_roLogin() == 0) {return ([0])} 
  //запросим список заказов
  dd0 = new Date(dd0).getTime();
  dd = new Date(dd).getTime();
  var url = 'https://api.remonline.ru/order/?token='+token+'&created_at[]='+dd0+'&created_at[]='+dd;
  var login = UrlFetchApp.fetch(url);
  var data = JSON.parse(login.getContentText("UTF-8"));
  var cnt = data.count;
  if (cnt == 0) { 
      return ([0]);
      }
  var contents =[]; 
      contents[0] = ['id','Создан','Изменен','Готов','Закрыт','Статус','Клиент, имя','Клиент телефон','Стоимость','Оплачено','Запчасти','Работы'];
  var i;
  for (i = 0; i < cnt; i++)  { 
                      var cV = data.data[i];
                      var str1 = new Date(cV.created_at);
                      var str2 = new Date(cV.modified_at);
                      var str3 = new Date(cV.done_at);
                      var str4 = new Date(cV.closed_at); 
                      contents[i+1] = [cV.id_label, str1, str2, str3, str4, cV.status.name, cV.client.name, cV.client.phone[0], cV.price, cV.payed, JSON.stringify(cV.parts[0]), JSON.stringify(cV.operations)];  ;
                     };
   return(contents);
}

function getROsales(dd,dd0) {
//продажи за период
if (_roLogin() == 0) {return ([0])}
  //запросим список заказов
  dd0 = new Date(dd0).getTime();
  dd = new Date(dd).getTime();
  
  var url = 'https://api.remonline.ru/retail/sales/?token='+token+'&created_at[]='+dd0+'&created_at[]='+dd;
  var login = UrlFetchApp.fetch(url);
  var data = JSON.parse(login.getContentText("UTF-8"));
  var cnt = data.count;
  if (cnt == 0) { 
      return ([0]);
      }
  var headerRow = Object.keys(data.data[0]);
  var contents = [];
      contents[0] = headerRow;
  var i;
  for ( i = 0; i < cnt; i++)  { 
                      var currentValue = data.data[i];
                      headerRow = Object.keys(currentValue);
                      var row = headerRow.map(function(key){ return currentValue[key]});
                      contents[i+1] = row;
                     };
   return(contents);
}
