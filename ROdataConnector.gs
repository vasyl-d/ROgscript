function getConfig(request) {
  var config = {
    configParams: [
      {
        type: 'SELECT_SINGLE',
        name: 'resource',
        displayName: 'Select Data Type',
        helpText: 'The connector will retrieve data for the selected type.',
        options: [
          {
            label: 'Lead',
            value: 'lead'},
          {
            label: 'Order',
            value: 'order'
          }
         ]
      }
    ]
  };
  return config;
}

var fixedSchema = {
  order: [
    { name: 'id_label',
      label: 'ID',
      dataType: 'STRING',
      semantics: {
        conceptType: 'DIMENSION'
      }
     },
    { name: 'payed',
      label: 'payed',
      dataType: 'NUMBER',
      semantics: {
        conceptType: 'DIMENSION'
      }
     },
    { name: 'created_at',
      label: 'created_at',
      dataType: 'NUMBER',
      semantics: {
        conceptType: 'DIMENSION'
      }
     },
    { name: 'price',
      label: 'price',
      dataType: 'NUMBER',
      semantics: {
        conceptType: 'DIMENSION'
      }
     }  
  ],
  lead: [
    {
      name: 'lead_id_label',
      label: 'ID',
      dataType: 'STRING',
      semantics: {
        conceptType: 'DIMENSION'
      }
    },
    {
      name: 'branch_id',
      label: 'Branch ID',
      dataType: 'NUMBER',
      semantics: {
        conceptType: 'DIMENSION'
      }
    },
    {
      name: 'contact_name',
      label: 'Contact',
      dataType: 'STRING',
      semantics: {
        conceptType: 'DIMENSION'
      }
    },
    {
      name: 'description',
      label: 'Description',
      dataType: 'STRING',
      semantics: {
        conceptType: 'DIMENSION'
      }
     },
     {
      name: 'ad_campaign',
      label: 'ad_campaign',
      dataType: 'STRING',
      semantics: {
        conceptType: 'DIMENSION'
       }
      },
      {
       name: 'status',
       label: 'status',
       dataType: 'STRING',
       semantics: {
        conceptType: 'DIMENSION'
        }
       },
   ],
}

function getSchema(request) {
  return {schema: fixedSchema[request.configParams.resource]};
}

function getData(request) {
  var userProperties = PropertiesService.getUserProperties();
  var key = userProperties.getProperty('dscc.key');
  _roLogin(key);
  var scriptProperties = PropertiesService.getScriptProperties();
  var token = scriptProperties.getProperty('token');
  var dataSchema = [];
  var schema = fixedSchema[request.configParams.resource];

  request.fields.forEach(function(field) {
    for (var i = 0; i < schema.length; i++) {
      if (schema[i].name === field.name) {
        dataSchema.push(schema[i]);
        break;
      }
    }
  });

  var fullResponse = [];
  var next;
  var pageNum = 1;

  do {
    var url = [
      'https://api.remonline.ru/',
      request.configParams.resource,
      '/?token=',
      token,
      '&page=',
      pageNum
    ];
 
    var response = JSON.parse(UrlFetchApp.fetch(url.join('')));
    var results = response.data;
    fullResponse = fullResponse.concat(results);

    next = ((response.count/50-pageNum) > 0);
    pageNum++;
  } while (next);

  var data = [];
  fullResponse.forEach(function(item) {
    var values = [];
    dataSchema.forEach(function(field) {
      var ii = item[field.name];
      if (!!ii) {
        if (isArr(ii)) { 
           ii = ii.join(',')
           };
        if (isObj(ii)) {
           ii = JSON.stringify(ii);
           }
        values.push(ii);
      } else {
        values.push('');
      }
    });
    data.push({
      values: values
    });
  });

  return {
    schema: dataSchema,
    rows: data
  };
}

function getAuthType() {
  var response = {
    type: 'KEY'
  };
  return response;
}

function isAdminUser() {
  return true;
}

/**
     * Returns true if the auth service has access.
     * @return {boolean} True if the auth service has access.
     */
function isAuthValid() {
      var userProperties = PropertiesService.getUserProperties();
      var key = userProperties.getProperty('dscc.key');
      var res = _roLogin(key);
    return(res)
}
    
function _roLogin(key) {
  //логинимся в РО
   var api_key = key;
   var scriptProperties = PropertiesService.getScriptProperties();
   var token = scriptProperties.getProperty('token');
   var LifeTime = scriptProperties.getProperty('LifeTime');
 
  var url = 'https://api.remonline.ru/token/new';
  var options = {
        'method' : 'post',
        'payload' : 'api_key=' + api_key,
        'content-type' : 'application/x-www-form-urlen-coded',
        'muteHttpExceptions' : true  
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
     return (false);
   }
  }
 return (true);
}

/**
     * Resets the auth service.
     */
    function resetAuth() {
      var userProperties = PropertiesService.getUserProperties();
      userProperties.deleteProperty('dscc.key');
    }
    
    /**
     * Sets the credentials.
     * @param {Request} request The set credentials request.
     * @return {object} An object with an errorCode.
     */
     
function setCredentials(request) {
      var key = request.key;

      // Optional
      // Check if the provided key is valid through a call to your service.
      // You would have to have a `checkForValidKey` function defined for
      // this to work.
      var validKey = _roLogin(key);
      if (!validKey) {
        return {
          errorCode: 'INVALID_CREDENTIALS'
        };
      }
      var userProperties = PropertiesService.getUserProperties();
      userProperties.setProperty('dscc.key', key);
      return {
        errorCode: 'NONE'
      };
    }
    
function isArr (value) {
  return value && typeof value === 'object' && value.constructor === Array;
}

// Returns if a value is an object
function isObj (value) {
  return value && typeof value === 'object' && value.constructor === Object;
}
