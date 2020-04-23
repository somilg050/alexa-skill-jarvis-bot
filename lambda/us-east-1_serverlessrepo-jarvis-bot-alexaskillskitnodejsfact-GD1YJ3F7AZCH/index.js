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
    token: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InB
    yaXllc2guc3JpdjIwMTdAZ21haWwuY29tIiwiZXhwaXJ5X2RhdGUiOjE1ODc3
    NTEyMTkuNjcwMzQ1fQ.o9Yay1TbrJZxC972ns5IrgztsyF5qz6vUKch9m_2Umg`
  } 
};

async function auth(options) {
  return new Promise((resolve) => {
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      console.log(`statusCode: ${response.statusCode}`);
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
    
    var speechOutput = `Hello I'm Jarvis. Your Intelligent process manager. `;
    const SessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    await auth(loginOptions).then((response) => {
      SessionAttributes.LoginStatus = response;
    });
    
    if(SessionAttributes.AuthStatus.statusCode === 200){
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
      SessionAttributes.IntegrationsStatus = response;
    });

    var speechOutput = 'Welcome to Trello Boards';

    const API_KEY = SessionAttributes.IntegrationsStatus.trelloAPIkey;
    const API_TOKEN= SessionAttributes.IntegrationsStatus.trelloAPISecret;
    
    var URL = `https://api.trello.com/1/members/me/boards?key=${API_KEY}&token=${API_TOKEN}`;

    await getRemoteData(URL)
      .then((response) => {
        const data = JSON.parse(response);
        if(data.length === 0){
          speechOutput = `I can see you don't have any existing trello boards. Please visit trello.com and create trello boards.`;
          return handlerInput.responseBuilder
          .speak(speechOutput)
          .reprompt(speechOutput)
          .withShouldEndSession(true)
          .getResponse();
        }
        else{
          speechOutput = `I can see you have following trello boards created `;
        }
      })
      .catch((err) => {
        //set an optional error message here
        speechOutput = err.message;
      });

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(`I can tell you the current price of Bitcoin and Ethereum. What can I help you with?`)
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
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    RepeatHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

