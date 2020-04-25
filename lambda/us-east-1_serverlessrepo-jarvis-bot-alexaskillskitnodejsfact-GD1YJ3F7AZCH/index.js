const Alexa = require('ask-sdk-core');
var request = require("request");
var env = require('dotenv').config();

var loginOptions = { method: 'POST',
  url: 'https://codefundo2019.tk/login',
  headers: {
    'postman-token': '8d8369f1-683c-58a5-51ac-0709fa826597',
    'cache-control': 'no-cache',
    'content-type': 'application/json' 
  },
  body: { 
    email: 'priyesh.sriv2017@gmail.com',
    password: 'Q123WERTY'
  },
  json: true 
};

var integrationsOptions = { method: 'GET',
  url: 'https://codefundo2019.tk/integrations',
  headers: { 
    'postman-token': '71f48851-d2eb-2156-c210-96baff7ebebd',
    'cache-control': 'no-cache',
    'token': ``
  } 
};

var createTaskOptions = { method: 'POST',
  url: 'https://api.trello.com/1/cards',
  qs: { key: 'a12ac0b756d26258be815a399da71296',
    token: 'ba013bc39ffd37dde296e20235757e73fb79af5409688ff4193890382aa66fd4',
    idList: '',
    name: ''
  },
  headers: { 'cache-control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Length': '0',
    Host: 'api.trello.com',
    'Postman-Token': '225aa60b-ce35-4341-b5ab-703244c7c441,e4aa5e5a-36ea-4610-8b7d-c19aaac0ff88',
    'Cache-Control': 'no-cache',
  } 
};

var githubOptions = { method: 'GET',
  url: 'https://codefundo2019.tk/github',
  headers: { 'postman-token': '4e0b5a78-d39e-b56b-e089-7b8bca37f654',
    'cache-control': 'no-cache',
    token: ''
  } 
};

var jarvisBotOptions = { method: 'GET',
  url: 'https://codefundo2019.tk/installation',
  headers: 
  { 'postman-token': 'f11b9078-e89a-4500-b26e-ad719d8ffec5',
     'cache-control': 'no-cache',
     reqddocker: 'false',
     os: 'ubuntu',
     projectname: '',
     token: ''
  } 
};

var projectStatusOptions = { method: 'GET',
  url: 'https://codefundo2019.tk/status/project',
  headers: 
   { 'postman-token': 'fa69cc80-209c-6703-0bd0-1960daa9f4fc',
     'cache-control': 'no-cache',
     projectname: 'jarvis-apis',
     token: ''
   } 
};

async function auth(options) {
  return new Promise((resolve) => {
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      console.log(body);
      setTimeout(() => resolve(response.body), 1000);
    });
  });
}

const LaunchRequest = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    
    var speechOutput = `Hello, Jarvis here. Your Intelligent process manager. `;
    const SessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    await auth(loginOptions).then((response) => {
      SessionAttributes.LoginStatus = response;
    });
    
    if(SessionAttributes.LoginStatus.statusCode === 200){
      speechOutput += `You are now successfully Logged In. How can I help you today? `;
    }else{
      speechOutput += `There was some error while logging into the system. Please try Logging again in the system. Thank You. `;
    }

    handlerInput.attributesManager.setSessionAttributes(SessionAttributes);
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  }
};

const ProjectStatus = {
  canHandle(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'projectStatus');
  },
  async handle(handlerInput) {
    var projectName;
    var speechOutput;
    const SessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if(handlerInput.requestEnvelope
      && handlerInput.requestEnvelope.request
      && handlerInput.requestEnvelope.request.intent
      && handlerInput.requestEnvelope.request.intent.slots
      && handlerInput.requestEnvelope.request.intent.slots.software
      && handlerInput.requestEnvelope.request.intent.slots.software.resolutions
      && handlerInput.requestEnvelope.request.intent.slots.software.resolutions.resolutionsPerAuthority[0]){
      projectName = handlerInput.requestEnvelope.request.intent.slots.software.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    } else{
      speechOutput = `Sorry, but we don't have any status for this project. What can I help you with? `;
      
      return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .withShouldEndSession(false)
      .getResponse();
    }
    projectStatusOptions.headers.projectname = projectName;
    projectStatusOptions.headers.token = SessionAttributes.LoginStatus.auth_token;

    await auth(projectStatusOptions).then((response) => {
      var projectStatus = JSON.parse(response);
      //SessionAttributes.ProjectStatus = projectStatus;
      var progress = projectStatus.milestone.closed_issues/(projectStatus.milestone.closed_issues+projectStatus.milestone.open_issues);
      var createdDate = new Date(projectStatus.milestone.created_at);
      var dueDate = new Date(projectStatus.milestone.due_on);
      var urgentIssues = '';
      for(var i = 0; i<projectStatus.milestone.urgent_issues.length; i++){
        urgentIssues += `${i+1}. ${projectStatus.milestone.urgent_issues[i].title}. `;
      }

      speechOutput = `The earliest milestone is ${projectStatus.milestone.title}, which was created on ${createdDate.toString()}, and has
       to be completed by ${dueDate}. Current progress on the release is ${progress}, and the urgent issues pending for this 
      release are: ${urgentIssues}`;
    });

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .withShouldEndSession(false)
      .getResponse();
  },
};

const GithubInstallation = {
  canHandle(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'gitGuide');
  },
  async handle(handlerInput) {

    const SessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;
    var speechOutput;
    var softwareName = request.intent.slots.software.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    jarvisBotOptions.headers.projectname = softwareName;
    SessionAttributes.SoftwareName = softwareName;
    var OS;
    SessionAttributes.githubOptions = githubOptions;
    githubOptions.headers.token = SessionAttributes.LoginStatus.auth_token;

    await auth(githubOptions).then((response) => {
      var res = JSON.parse(response);
      var softwareNames = [];
      for(var i = 0; i<res['data'].length; i++){
        softwareNames.push(res.data[i].name);
      }
      SessionAttributes.SoftwareNames = softwareNames;
    });

    var dockerStatus = false;
    var status = request.intent.slots.dockerStatus.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    
    if(status === `locally`){
      OS = request.intent.slots.OS.resolutions.resolutionsPerAuthority[0].values[0].value.name;
      jarvisBotOptions.headers.os = OS;
    }
    else{
      jarvisBotOptions.headers.reqddocker = true;
      dockerStatus = true;
    }

    jarvisBotOptions.headers.token = SessionAttributes.LoginStatus.auth_token;
    await auth(jarvisBotOptions).then((response) => {
      SessionAttributes.JarvisStatus = JSON.parse(response);
    });

    if(dockerStatus){
      speechOutput = SessionAttributes.JarvisStatus.message;
    } else{
      speechOutput = `Instructions to install on ${OS}: `;
      if(OS==='ubuntu' || OS==='redhat' || OS==='macos'){
        speechOutput+= `Open the terminal and follow these commands. Firstly we will do.. `;
      }
      else{
        speechOutput+=`Open the command prompt and follow these steps. Firstly we will do.. `;
      }
      for(var i=0; i<SessionAttributes.JarvisStatus.instructions.length; i++){
        if(i===SessionAttributes.JarvisStatus.instructions.length-1){
          speechOutput += `finally do ${SessionAttributes.JarvisStatus.instructions[i]}.`;
        }
        else{
          speechOutput += `${SessionAttributes.JarvisStatus.instructions[i]}. Then `;
        }
      }
    }
    speechOutput += ` Your Product Installation Guide is completed. Now how can I help you? `;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .withShouldEndSession(false)
      .getResponse();
  },
};

const TrelloBoards = {
  canHandle(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'trelloBoards');
  },
  async handle(handlerInput) {

    const SessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    integrationsOptions.headers.token = SessionAttributes.LoginStatus.auth_token;
    await auth(integrationsOptions).then((response) => {
      SessionAttributes.IntegrationsStatus = JSON.parse(response);
    });

    var speechOutput = 'Welcome to Trello Boards. ';

    const API_KEY = SessionAttributes.IntegrationsStatus.data.trello_creds.trelloAPIkey;
    const API_TOKEN = SessionAttributes.IntegrationsStatus.data.trello_creds.trelloAPISecret;
    const BOARD_ID = SessionAttributes.IntegrationsStatus.data.trello_creds.board; 

    var listsURL = `https://api.trello.com/1/boards/${BOARD_ID}/lists?key=${API_KEY}&token=${API_TOKEN}`;
    var boardURL = `https://api.trello.com/1/boards/${BOARD_ID}?key=${API_KEY}&token=${API_TOKEN}`;

    await getRemoteData(boardURL)
    .then((response) => {
      const data = JSON.parse(response);
      if(data.length === 0){
        speechOutput += `I can see, You don't have any trello boards created. Please visit trello.com and create trello boards.`;
        return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(speechOutput)
        .withShouldEndSession(true)
        .getResponse();
      }
      else{
        SessionAttributes.BoardName = data.name;
      }
    })
    .catch((err) => {
      //set an optional error message here
      speechOutput = err.message;
    });

    await getRemoteData(listsURL)
      .then((response) => {
        const data = JSON.parse(response);
        if(data.length === 0){
          speechOutput += `I can see you don't have any task created yet. Please visit trello.com and create tasks.`;
          return handlerInput.responseBuilder
          .speak(speechOutput)
          .reprompt(speechOutput)
          .withShouldEndSession(true)
          .getResponse();
        }
        else{
          speechOutput += `You have the following lists in your ${SessionAttributes.BoardName}. `;
          var listIdPair = {};
          for(var i=0; i<data.length; i++){
            speechOutput+=`List ${i+1}: ${data[i].name}. `;
            listIdPair[data[i].name] = (data[i].id);
            //console.log(listIdPair[data[i].name]);
          }
          SessionAttributes.ListIdPair = listIdPair;
          speechOutput += `Which one would you like to know? `;
        }
      })
      .catch((err) => {
        //set an optional error message here
        speechOutput = err.message;
      });

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .withShouldEndSession(false)
      .getResponse();

  },
};

const TrelloLists = {
  canHandle(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'trelloList');
  },
  async handle(handlerInput) {

    const SessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    var speechOutput;
    var listName;
    
    if(handlerInput.requestEnvelope
      && handlerInput.requestEnvelope.request
      && handlerInput.requestEnvelope.request.intent
      && handlerInput.requestEnvelope.request.intent.slots
      && handlerInput.requestEnvelope.request.intent.slots.listName
      && handlerInput.requestEnvelope.request.intent.slots.listName.resolutions
      && handlerInput.requestEnvelope.request.intent.slots.listName.resolutions.resolutionsPerAuthority[0]){
      listName = handlerInput.requestEnvelope.request.intent.slots.listName.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    }
    SessionAttributes.ListName = listName;
    const API_KEY = SessionAttributes.IntegrationsStatus.data.trello_creds.trelloAPIkey;
    const API_TOKEN = SessionAttributes.IntegrationsStatus.data.trello_creds.trelloAPISecret;
    const LIST_ID = SessionAttributes.ListIdPair[listName];

    var cardsURL = `https://api.trello.com/1/lists/${LIST_ID}/cards?key=${API_KEY}&token=${API_TOKEN}`;
    console.log(cardsURL);

    await getRemoteData(cardsURL)
      .then((response) => {
        const data = JSON.parse(response);
        if(data.length === 0){
          speechOutput += `I can see you don't have any task created yet. Please visit trello.com and create tasks.`;
          return handlerInput.responseBuilder
          .speak(speechOutput)
          .reprompt(speechOutput)
          .withShouldEndSession(true)
          .getResponse();
        }
        else{
          speechOutput = `You have the following tasks in your ${listName}. `;
          for(var i=0; i<data.length; i++){
            speechOutput +=`Task ${i+1}: ${data[i].name}. `;
            if(data[i].desc.length >= 1){
              speechOutput += `With Description: ${data[i].desc} `;
            }
            if(data[i].due){
              var date = new Date(data[i].due);
              date = date.toString();
              date = date.replace(' GMT+0000', '');
              speechOutput += `With Due date: ${date} `;
            }
          }
        }
      })
      .catch((err) => {
        //set an optional error message here
        speechOutput = err.message;
      });

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .withShouldEndSession(false)
      .getResponse();
  },
};

const CreateTrelloTasks = {
  canHandle(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'createTask');
  },
  async handle(handlerInput) {

    const SessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;
    var speechOutput = `Problem occured while creating task. Check logs for more detail. `;

    var date = new Date(`${request.intent.slots.dueDate.value}T${request.intent.slots.dueTime.value}`);
    createTaskOptions.qs.name = request.intent.slots.taskName.value;
    var listName = request.intent.slots.listName.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    createTaskOptions.qs.idList = SessionAttributes.ListIdPair[listName];
    createTaskOptions.qs.due = date;

    createTaskOptions.headers.token = SessionAttributes.LoginStatus.auth_token;
    await auth(createTaskOptions).then((response) => {
      if(response){
        speechOutput = `Task created successfully under ${listName}. `;
      };
    });

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .withShouldEndSession(false)
      .getResponse();

  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = `You are in help intent`;
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak(`Sorry, I didn't get that.`)
      .reprompt(`Sorry, I didn't get that.`)
      .getResponse();
  },
};

const RepeatHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && (request.intent.name === 'AMAZON.RepeatIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(`lol`)
      .withShouldEndSession(false)
      .getResponse();
  },
};

const getRemoteData = function (url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? require('https') : require('http');
    const request = client.get(url, (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error('Failed with status code: ' + response.statusCode));
      }
      const body = [];
      response.on('data', (chunk) => body.push(chunk));
      response.on('end', () => resolve(body.join('')));
    });
    request.on('error', (err) => reject(err));
  });
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequest,
    GithubInstallation,
    ProjectStatus,
    TrelloBoards,
    TrelloLists,
    CreateTrelloTasks,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    RepeatHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

