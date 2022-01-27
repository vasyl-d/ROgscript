//читаем все строки таблицы с номером телефона и именем клиента
//создаем клиента+обращение и отмечаем строку как обработанную
//в обращении указіваем крайний срок и ответственного менеджера
//
//в основном развертывании и вызовом по часам. периодичность 4 часа - нормально.
//проекту надо будет дать права на доступ к почте - это произойдет автоматически при первом запуске
// V 1.2 (c) Vasyl-D
 var api_key = '17f8915107a84350953'; //
 var order_type_id = '175191';
 var token = '';
 var branch_id ='106955'; 
 var manager_id ='173749';
 var base_url = 'https://api.remonline.ru/';
 var marketing_source ='286619';
 var status_id = '1275205';
 var dd = ''+new Date().getTime();
 var i = 0; //с какой строки начинаем (считаем с 0, т.к. массив) из-за ограничения на время выполнения 
            //функции 6 минут ведем счетчик загрузки и перезапускаем скрипт с указанием тут места откуда продолжать
 var tt = new Date();
 var order = { 'token': token, 
              'branch_id': branch_id,
              'order_type': order_type_id,
              'assigned_at': dd,
              'estimated_done_at': dd,
              'manager': manager_id,
              'client_id': '',
              'manager_notes': '',
              'marketing_source': marketing_source,
              };

var client = {'token': token,
              'name': '',
              'address': '',
              'phone[]': '',
              'notes':'',
              'marketing_source':marketing_source};



function onOpen() {
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    {name: 'загрузить в РО', functionName: 'myFunction'},
  ];
    spreadsheet.addMenu('РемОНлайн', menuItems);
}

function createTimeTrigger() {
 ScriptApp.newTrigger("runScript")
   .timeBased()
   .everyMinutes(8)
   .create();
}

function myFunction() {
  var res = _roLogin(api_key);
  if (res[0] != 0) {
     token = res[0];
     tt = res[1];
  } else {
     Logger.log('Не смогли подключиться к РО');
     return (0);
  }

 var sheet = SpreadsheetApp.getActive().getSheetByName("Client");
 var data = sheet.getDataRange().getValues();
 var numRows = data.length;
 while (i < numRows) {
   row = data[i];
   var ff = ProcessRow(row);
   if ( ff == 0 ) {return(0)}
   i++;
 }      
}

function ProcessRow(row) {
   let tt2 = new Date();
   if ((tt2 - tt) > 100*60*8) {
       var res = _roLogin(api_key);
       if (res[0] != 0) {
         token = res[0];
         tt = res[1];
        } else {
         Logger.log('Не смогли переподключиться к РО, строка: %s', i);
         return (0);
       }
    }
   client = {'token': token,
              'name': row[1],
              'address': row[0],
              'phone[]': ''+row[6],
              'notes': row[4],
              'marketing_source':marketing_source};
  
   dd = ''+new Date(row[7]).getTime();
   
   Logger.log('%s, строка: %s',client.name, i);

   var client_id = '' + putROClient(client);
   Logger.log(client_id);
   if (client_id) {
     order.token = token;
     order.client_id = client_id;
     order.assigned_at = dd;
     order.estimated_done_at = dd;
     order.manager_notes = row[5];

     var order_id = '' + putROOrder(order);
     if (order_id) {
       order_id = postStatus(order_id, status_id)
     }  
     Logger.log(order_id);
   };
   return(1);
}

function _roLogin(api_key) {
  //получаем токен
  var url = base_url+'token/new';
 
  var options = {
        'method' : 'post',
        'payload' : 'api_key='+api_key,
        'content-type' : 'application/x-www-form-urlen-coded',
        'muteHttpExceptions' : false
        };
  
  var login = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(login.getContentText("UTF-8"));
 
  var dd = new Date();
  if (data.success) {
    return([data.token, dd]) } else { 
    return([0, 0])};
}

 
function putROClient(client) {
  var url = base_url+'clients/';
  var options = {
        'method' : 'post',
        'payload' : client,
        'content-type' : 'application/x-www-form-urlen-coded',
        'muteHttpExceptions' : true,
        'mode': 'same-origin'
        };  

  var login = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(login.getContentText("UTF-8"));
  if (data.success == true) return (data.data.id);
  return (0);
}

function putROOrder(order){
 var url = base_url+'order/';
 var options = {
        'method' : 'post',
        'payload' : order,
        'content-type' : 'application/x-www-form-urlen-coded',
        'muteHttpExceptions' : true,
        'mode': 'same-origin'
         };

  var login = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(login.getContentText("UTF-8"));
  if (data.success == true) return (data.data.id);
  return (0);
}

function postStatus(order_id, status_id){
 var url = base_url+'order/status/';
   
 var options = {
        'method' : 'post',
        'payload' : {'token': token,'order_id': order_id, 'status_id': status_id},
        'content-type' : 'application/x-www-form-urlen-coded',
        'muteHttpExceptions' : true,
        'mode': 'same-origin'
         };
 
  var login = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(login.getContentText("UTF-8"));
  if (data.success == true) return (data.data.id);
  return (0);
}

