//читаем все непрочитанные сообщения в инбоксе
//новые сообщения - первые в списке
//ключ АПМ
//для автоматического запуска необходимо установить триггер
//в https://script.google.com/home/my через меню проекта
//с вызовом  myFunction()
//в основном развертывании и вызовом по часам. периодичность 4 часа - нормально.
//проекту надо будет дать права на доступ к почте - это произойдет автоматически при первом запуске

function myFunction() {
  var api_key = ' '; //тут прописать свой ключ
  var res = _roLogin(api_key);
  if (res[0] != 0) {
     var token = res[0];
     var tt = res[1];
  } else {
     Logger.log('Не смогли подключиться к РО');
     return (0);
  }
  var cnt = GmailApp.getInboxUnreadCount();
  for (var i = 0; i < cnt; i++) {
   var thread = GmailApp.getInboxThreads(i, i+1)[0]; // Get i thred
   let tt2 = new Date();
   if ((tt2 - tt) > 100*60*8) {
       var res = _roLogin(api_key);
       if (res[0] != 0) {
         token = res[0];
         tt = res[1];
        } else {
         Logger.log('Не смогли переподключиться к РО');
         return (0);
       }
    }
     if (thread.isUnread()) {
         var msg = thread.getMessages()[0]; // Get messages
            if (msg.isUnread()) { 
                  var from = msg.getFrom();
                  let repl = from.match(/<(.*)>/g)||[from] ;
                  let regg = /(<|>)/g;
                  let rr = repl[0].replace(regg, "");
                  //Logger.log("FROM:", from);
                  var lead_id = putROlead(token, rr, from, msg.getPlainBody());
                  //Logger.log("lead_id:", lead_id);
                  if (lead_id !=0) msg.markRead();
            }
      }
   }
}

function _roLogin(api_key) {
  //получаем токен
  var url = 'https://api.remonline.ru/token/new';
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

//  
//  

function putROlead(token, leadEmail, leadFrom, body) {

  var url = 'https://api.remonline.ru/lead/';
  var tt = new Date();
  var leadData = {
  'token': token,
  'contact_phone': ' ',
  'contact_name': leadFrom,
  'description': 'lead from email: '+leadEmail+'\n'+tt+'\n'+body
  };
  var options = {
        'method' : 'post',
        'payload' : leadData,
        'content-type' : 'application/x-www-form-urlen-coded',
        'muteHttpExceptions' : false  
      };

  var login = UrlFetchApp.fetch(url, options);

  var data = JSON.parse(login.getContentText("UTF-8"));
  var i=0;
  if (data.success = true) return (data.data.id);
  return (0);
}
