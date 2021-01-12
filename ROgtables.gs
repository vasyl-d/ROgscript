// Ver 1.02 (c) Vasyl-D

var api_key = ''; //брать в https://app.remonline.ua/settings/api 
var base_url = 'https://api.remonline.ru/';  //или .ua или orderry.com

var scriptProperties = PropertiesService.getScriptProperties();
let lt = Date.now() - 100;
scriptProperties.setProperties({'token' : '',
  'LifeTime' : lt
  });

function _today0() {
 let dd = new Date();
 return(new Date(dd.getFullYear()+'.'+(dd.getMonth()+1)+'.'+dd.getDate()).getTime());
}

function sendUserError(message) {
  var ui = SpreadsheetApp.getUi(); // Same variations.
  var result = ui.alert(
     'Ошибка: '+message,
      ui.ButtonSet.OK);
}

function getData(resurs) {
 //resurs = object {resurs, dd0,dd}
  var fullResponse = [];
  var next;
  var pageNum = 1;
 
  do {
    if (!_roLogin()) {
      sendUserError('не удалось подключиться');
    return([fullResponse]);
    } 
    var token = scriptProperties.getProperty('token');
    var url = base_url+resurs.resurs+'?token='+token+'&page='+pageNum;
    if (resurs.dd0) {url = url + '&created_at[]=' + (new Date(resurs.dd0).getTime())}
    if (resurs.dd) {url = url + '&created_at[]='+ (new Date(resurs.dd).getTime())}
  
    var response = JSON.parse(UrlFetchApp.fetch(url));
    var results = response.data;
    fullResponse = fullResponse.concat(results);

    next = ((response.count/50-pageNum) > 0);
    pageNum++;
  } while (next);

  return fullResponse;
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
  var token = scriptProperties.getProperty('token');
  var ltm = scriptProperties.getProperty('LifeTime');
 
  Logger.log('login token before:', token, 'lt before: ', ltm);
  var url = base_url + 'token/new';
  var options = {
        'method' : 'post',
        'payload' : 'api_key=' + api_key,
        'content-type' : 'application/x-www-form-urlen-coded',
        'muteHttpExceptions' : false  
      };
  
  if (token == '' || (( ltm - Date.now()) <= 0)) { 
    //нужен новый токен
    var login = UrlFetchApp.fetch(url , options);
    var data = JSON.parse(login.getContentText("UTF-8"));
    ltm = Date.now() + 540000;
    if (data.success) {
      token = data.token;
      scriptProperties.setProperties({'token' : token,
                      'LifeTime' : ltm
                       });
      Logger.log('login token after:', token, 'lt after: ', ltm);
    } else {
      lock.releaseLock();
      return (0);
    }
  }
 lock.releaseLock();
 return (1);
}

function getROstatuses() {
  var fullResponse = [];
  var resurs = {resurs : 'statuses/'};
  fullResponse = getData(resurs);

  var ids=[];
  var rc=0;
  ids[0] =['id','name','color','group'];
  for (i in fullResponse) {
    ids [rc] = [fullResponse[i].id, fullResponse[i].name, fullResponse[i].color, fullResponse[i].group];
    rc++;
  }
  return (ids);
}

function getROcashbox() {
  var fullResponse = [];
  var resurs = {resurs : 'cashbox/'};
  fullResponse = getData(resurs);

  var ids =[];
  var rc=1;
  ids[0] = ['Currency','Balance','type','Title','Id'];
  for (i in fullResponse) {
    ids [rc] = [fullResponse[i].currency, fullResponse[i].balance, fullResponse[i].type, fullResponse[i].title, fullResponse[i].id];
    rc++;
  }
  return (ids);
}

function getROtodayCash(dd, dd0) {
  var data = getROcashbox();
  var dl = data.length;
  if (dl == 0) {
    return ([0]);
    }
  var ids = 0;
  var rc = 0;
  var rng = [];  
  for (var i=1; i< dl; i++) {
     ids = data[i][4];
     //движение по кассе
    var cash = [];
    var sss = 'cashbox/report/'+ids;
    var resurs = {resurs : sss, 
                  dd0 : dd0,
                  dd : dd};
  
    cash = getData(resurs);
    var j=0;
    for (j in cash) {
        rng[rc] = [ids,data[i][3], data[i][0], cash[j].value,cash[j].direction,cash[j].employee_id,new Date(cash[j].created_at),cash[j].description];
        rc = rc + 1;
        }   
   }
   return(rng);
}

function getROwarehouses() {

  var fullResponse = [];
  var resurs = {resurs : 'warehouse/'};
  fullResponse = getData(resurs);

  var ids=[];
  for (i in fullResponse) {
     ids[i] = [fullResponse[i].id,fullResponse[i].title];
  }
  return(ids);
}

function getROlocations() {
   var fullResponse = [];
   var resurs = {resurs : 'branches/'};
   fullResponse = getData(resurs); 
   
  var i=0;
  var ids=[];
  for (i in fullResponse) {
     ids[i] = [fullResponse[i].id, fullResponse[i].name];
  }
  return(ids);
}

function getROorders(dd,dd0) {
  var fullResponse = [];
  var resurs = {resurs : 'order/', 
                  dd0 : dd0,
                  dd : dd};
  fullResponse = getData(resurs);

  var contents =[]; 
      contents[0] = ['id','Создан','Изменен','Готов','Закрыт','Статус','Клиент, имя','Клиент телефон','Стоимость','Оплачено','Запчасти','Работы'];
  var i;
  var cnt = fullResponse.length;
  for (i = 0; i < cnt; i++)  { 
    var cV = fullResponse[i];
    var str1 = new Date(cV.created_at);
    var str2 = new Date(cV.modified_at);
    var str3 = new Date(cV.done_at);
    var str4 = new Date(cV.closed_at); 
    contents[i+1] = [cV.id_label, str1, str2, str3, str4, cV.status.name, cV.client.name, cV.client.phone[0], cV.price, cV.payed, JSON.stringify(cV.parts[0]), JSON.stringify(cV.operations)];  ;
  };
   return(contents);
}

function getROsales(dd,dd0) {
  var fullResponse = [];
  var resurs = {resurs : 'sales/', 
                  dd0 : dd0,
                  dd : dd};
  fullResponse = getData(resurs);

  var headerRow = Object.keys(fullResponse[0]);
  var contents = [];
      contents[0] = headerRow;
  var i;
  var cnt = fullResponse.length;
  for ( i = 0; i < cnt; i++)  { 
    var currentValue = fullResponse[i];
    headerRow = Object.keys(currentValue);
    var row = headerRow.map(function(key){ return currentValue[key]});
    contents[i+1] = row;
   };
   return(contents);
}

function getROleads(dd,dd0) {
  var fullResponse = [];
  var resurs = {resurs : 'lead/', 
                  dd0 : dd0,
                  dd : dd};
  fullResponse = getData(resurs);

  var contents =[]; 
      contents[0] = ['id','Статус','Группа','Клиент телефон','Клиент, имя', 'Тип обращения'];
  var i;
  var cnt = fullResponse.length;
  for (i = 0; i < cnt; i++)  { 
    let cV = fullResponse[i];
    contents[i+1] = [cV.lead_id_label, cV.status.name, cV.status.group, cV.contact_phone, cV.contact_name, cV.lead_type_id];  ;
  };
  return(contents);
}

function getROClients(dd,dd0) {
  var fullResponse = [];
  var resurs = {resurs : 'clients/', 
                  dd0 : dd0,
                  dd : dd};
  fullResponse = getData(resurs);

  var contents =[]; 
      contents[0] = ['id','Д.Карта','Email','Клиент телефон','Клиент имя'];
  var i;
  var cnt = fullResponse.length;
  for (i = 0; i < cnt; i++)  { 
    let cV = fullResponse[i];
    contents[i+1] = [cV.id, cV.discount_code, cV.email, cV.phone[0], cV.name];  ;
  };
  return(contents);
}

function getROSaleProducts(dd,dd0) {
  var fullResponse = [];
  var resurs = {resurs : 'sales/', 
                  dd0 : dd0,
                  dd : dd};
  fullResponse = getData(resurs);

  var contents = [];
      contents[0] = ['id','created','Сотрудник', 'Клиент', 'Товар', 'кол-во', 'Цена.ед','Себестоимость.ед','Скидка'];
  let j=1; 
  for (let i in fullResponse)  { 
      var cV = fullResponse[i];
      for (let tr in cV.products) {
          contents[j] = [cV.id_label, new Date(cV.created_at), cV.created_by_id, cV.client_id, 
          cV.products[tr].title, cV.products[tr].amount, cV.products[tr].price, cV.products[tr].cost, cV.products[tr].discount_value];
          j++;
      };
  };
   return(contents);
}


function getROOrderProducts(dd,dd0) {
  var fullResponse = [];
  var resurs = {resurs : 'order/', 
                  dd0 : dd0,
                  dd : dd};
  fullResponse = getData(resurs);

  var contents = [];
      contents[0] = ['id','created','Сотрудник', 'Клиент', 'Товар', 'кол-во', 'Цена.ед','Себестоимость.ед','Скидка'];
  let j=1; 
  for (let i in fullResponse)  { 
      var cV = fullResponse[i];
      for (let tr in cV.parts) {
          contents[j] = [cV.id_label, new Date(cV.created_at), cV.created_by_id, cV.client.id, 
          cV.parts[tr].title, cV.parts[tr].amount, cV.parts[tr].price, cV.parts[tr].cost, cV.parts[tr].discount_value];
          j++;
      };
  };
   return(contents);
}

function getROOrderOperations(dd,dd0) {
  var fullResponse = [];
  var resurs = {resurs : 'order/', 
                  dd0 : dd0,
                  dd : dd};
  fullResponse = getData(resurs);

  var contents = [];
      contents[0] = ['id','created','Сотрудник', 'Клиент', 'Товар', 'кол-во', 'Цена.ед','Себестоимость.ед','Скидка'];
  let j=1; 
  for (let i in fullResponse)  { 
      var cV = fullResponse[i];
      for (let tr in cV.operations) {
          contents[j] = [cV.id_label, new Date(cV.created_at), cV.created_by_id, cV.client.id, 
          cV.operations[tr].title, cV.operations[tr].amount, cV.operations[tr].price, cV.operations[tr].cost, cV.operations[tr].discount_value];
          j++;
      };
  };
   return(contents);
}

function getROordersNew(dd,dd0) {
  var fullResponse = [];
  var resurs = {resurs : 'order/', 
                  dd0 : dd0,
                  dd : dd};
  fullResponse = getData(resurs);

  var contents =[]; 
      contents[0] = ['id','Создан','Изменен','Готов','Закрыт','Статус','Клиент, имя','Клиент телефон','Стоимость','Оплачено','Запчасти','Работы'];
  var i;
  var cnt = fullResponse.length;
  for (i = 0; i < cnt; i++)  { 
    var cV = fullResponse[i];
    var str1 = new Date(cV.created_at);
    var str2 = new Date(cV.modified_at);
    var str3 = new Date(cV.done_at);
    var str4 = new Date(cV.closed_at); 
    contents[i+1] = [cV.id_label, str1, str2, str3, str4, cV.status.name, cV.client.name, cV.client.phone[0], cV.price, cV.payed, JSON.stringify(cV.parts[0]), JSON.stringify(cV.operations)];  ;
  };
   return(contents);
}
