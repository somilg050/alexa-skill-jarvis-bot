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
    'token': `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InByaXllc2guc3JpdjIwMTdAZ21haWwuY29tIiwiZXhwaXJ5X2RhdGUiOjE1ODc3NTEyMTkuNjcwMzQ1fQ.o9Yay1TbrJZxC972ns5IrgztsyF5qz6vUKch9m_2Umg`
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

const TrelloBoards = {
  canHandle(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'trelloBoards');
  },
  async handle(handlerInput) {

    const SessionAttributes = handlerInput.attributesManager.getSessionAttributes();

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
          for(var i=0; i<data.length; i++){
            speechOutput+=`List ${i+1}: ${data[i].name}. `;
          }
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
    const BOARD_ID = SessionAttributes.IntegrationsStatus.data.trello_creds.board; 

    var cardsURL = `https://api.trello.com/1/boards/${BOARD_ID}/cards?key=${API_KEY}&token=${API_TOKEN}`;

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
    TrelloBoards,
    TrelloLists,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    RepeatHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

