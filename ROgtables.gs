// Ver 0.91 (c) Vasyl-D

var api_key = ' '; //вставить ключ из https://app.remonline.ua/settings/api

var scriptProperties = PropertiesService.getScriptProperties();
let lt = new Date().getTime()-100;
scriptProperties.setProperties({'token' : '',
  'LifeTime' : lt
  });

function _today0() {
 var dd = new Date();
 var dd2= new Date(dd.getFullYear()+'.'+(dd.getMonth()+1)+'.'+dd.getDate());
 return dd2.getTime(); 
}

function sendUserError(message) {
  var ui = SpreadsheetApp.getUi(); // Same variations.
  var result = ui.alert(
     'Ошибка: '+message,
      ui.ButtonSet.OK);
}

function fetchData(url) {
  if (!url || !url.match(/^https?:\/\/.+$/g)) {
    sendUserError('"' + url + '" is not a valid url.');
  }
  var response = UrlFetchApp.fetch(url);
  var content = JSON.parse(response.getContentText("UTF-8"));
//  if (!content) {
//    sendUserError('"' + url + '" returned no content.');
//  }
  return content;
}

function _roLogin() {
  //логинимся в РО
  //надо избавиться от конкуренции за глобальную переменную
   var lock = LockService.getScriptLock();
   var success = lock.tryLock(20000);
    if (!success) {
         Logger.log('Could not obtain lock after 20 seconds.');
         return(0);
     }
  let token = scriptProperties.getProperty('token');
  let LifeTime = scriptProperties.getProperty('LifeTime');
 
  Logger.log('login token before:', token, 'lt before: ', LifeTime);
  var url = 'https://api.remonline.ru/token/new';
  var options = {
        'method' : 'post',
        'payload' : 'api_key=' + api_key,
        'content-type' : 'application/x-www-form-urlen-coded',
        'muteHttpExceptions' : false  
      };
   
 if (token == '' || LifeTime < new Date().getTime()) { 
  //нужен новый токен
  var login = UrlFetchApp.fetch(url , options);
  var data = JSON.parse(login.getContentText("UTF-8"));
  var lt = new Date().getTime()+540000;
  if (data.success) {
     token = data.token;
     scriptProperties.setProperties({'token' : token,
                      'LifeTime' : lt
                       });
     Logger.log('login token after:', token, 'lt after: ', lt);
   } else {
     lock.releaseLock();
     return (0);
   }
  }
 lock.releaseLock();
 return (1);
}

function getROstatuses() {

 if (_roLogin() == 0) {return ([0])}

  let token = scriptProperties.getProperty('token');
  let LifeTime = scriptProperties.getProperty('LifeTime');
 //запросим список статусов
  var url = 'https://api.remonline.ru/statuses/?token='+token;
  var login = UrlFetchApp.fetch(url);
  var data = JSON.parse(login.getContentText("UTF-8"));
  var i=0;
  if (data.success != true) {
    return ([0]);
    }
  var ids=[];
  var rc=0;
  ids[0] =['id','name','color','group'];
  for (i in data.data) {
        ids [rc] = [data.data[i].id, data.data[i].name, data.data[i].color, data.data[i].group];
        rc++;
  }
  return (ids);
}


function getROcashbox() {

 if (_roLogin() == 0) {return ([0])}

  let token = scriptProperties.getProperty('token');
  let LifeTime = scriptProperties.getProperty('LifeTime');
 //запросим список касс
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
 if (_roLogin() == 0) {return ([0])}
 //запросим список касс
  let token = scriptProperties.getProperty('token');
  let LifeTime = scriptProperties.getProperty('LifeTime');
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
if (_roLogin() == 0) {return ([0])}
 //запросим список складов
 let token = scriptProperties.getProperty('token');
 let LifeTime = scriptProperties.getProperty('LifeTime');
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
if (_roLogin() == 0) {return ([0])}
  //запросим список локаций
  let token = scriptProperties.getProperty('token');
  let LifeTime = scriptProperties.getProperty('LifeTime');
 
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
if (_roLogin() == 0) {return ([0])} 

  let token = scriptProperties.getProperty('token');
  let LifeTime = scriptProperties.getProperty('LifeTime');
 
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
if (_roLogin() == 0) {return ([0])}

  let token = scriptProperties.getProperty('token');
  let LifeTime = scriptProperties.getProperty('LifeTime');
 
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

function getROleads(dd,dd0) {
if (_roLogin() == 0) {return ([0])}

  let token = scriptProperties.getProperty('token');
  let LifeTime = scriptProperties.getProperty('LifeTime');
 
  //запросим список лидов
  dd0 = new Date(dd0).getTime();
  dd = new Date(dd).getTime();
  var url = 'https://api.remonline.ru/lead/?token='+token+'&created_at[]='+dd0+'&created_at[]='+dd;
  var login = UrlFetchApp.fetch(url);
  var data = JSON.parse(login.getContentText("UTF-8"));
  var cnt = data.count;
  if (cnt == 0) { 
      return ([0]);
      }
  var contents =[]; 
      contents[0] = ['id','Статус','Группа','Клиент телефон','Клиент, имя', 'Тип обращения'];
  var i;
  for (i = 0; i < cnt; i++)  { 
                      let cV = data.data[i];
                      contents[i+1] = [cV.lead_id_label, cV.status.name, cV.status.group, cV.contact_phone, cV.contact_name, cV.lead_type_id];  ;
                     };
   return(contents);
}

function getROClients(dd,dd0) {
if (_roLogin() == 0) {return ([0])} 

  let token = scriptProperties.getProperty('token');
  let LifeTime = scriptProperties.getProperty('LifeTime');
 
  //запросим список клиентов
  dd0 = new Date(dd0).getTime();
  dd = new Date(dd).getTime();
  var url = 'https://api.remonline.ru/clients/?token='+token+'&modified_at[]='+dd0+'&modified_at[]='+dd;
  var login = UrlFetchApp.fetch(url);
  var data = JSON.parse(login.getContentText("UTF-8"));
  var cnt = data.count;
  if (cnt == 0) { 
      return ([0]);
      }
  var contents =[]; 
      contents[0] = ['id','Д.Карта','Email','Клиент телефон','Клиент имя'];
  var i;
  for (i = 0; i < cnt; i++)  { 
                      let cV = data.data[i];
                      contents[i+1] = [cV.id, cV.discount_code, cV.email, cV.phone[0], cV.name];  ;
                     };
   return(contents);
}

function getROSaleProducts(dd,dd0) {
if (_roLogin() == 0) {return ([0])}
  //запросим список продаж
  dd0 = new Date(dd0).getTime();
  dd = new Date(dd).getTime();
  let token = scriptProperties.getProperty('token');
  let LifeTime = scriptProperties.getProperty('LifeTime');
   
  var url = 'https://api.remonline.ru/retail/sales/?token='+token+'&created_at[]='+dd0+'&created_at[]='+dd;
  var login = UrlFetchApp.fetch(url);
  var data = JSON.parse(login.getContentText("UTF-8"));
  var cnt = data.count;
  if (cnt == 0) { 
      return ([0]); //нет продаж
      }
  //отработать пагинацию 50 строк на страницу
  
  var contents = [];
      contents[0] = ['id','created','Сотрудник','Склад', 'Клиент', 'Товар', 'кол-во', 'Цена.ед','Себестоимость.ед','Скидка'];
  let j=1; 
  for (let i in data.data)  { 
      var cV = data.data[i];
      for (let tr in cV.products) {
          contents[j] = [cV.id_label, new Date(cV.created_at), cV.created_by_id, cV.warehouse_id, cV.client_id, 
          cV.products[tr].title, cV.products[tr].amount, cV.products[tr].price, cV.products[tr].cost, cV.products[tr].discount_value];
          j++;
      };
  };
   return(contents);
}
