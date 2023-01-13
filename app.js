'use strict';
const uuid = require('uuid');
// Imports the Dialogflow library
const dialogflow = require('@google-cloud/dialogflow');
// QR Code printer
const qrcode = require('qrcode-terminal');
var dateTime = require('node-datetime');

const fs = require('fs');


const CONFIGURATION = {
    credentials: {
        "type": "service_account",
        "project_id": "",
        "private_key_id": "",
        "private_key": "",
        "client_email": "",
        "client_id": "",
        "auth_uri": "",
        "token_uri": "",
        "auth_provider_x509_cert_url": "",
        "client_x509_cert_url": ""
    }
}



const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client();

let rawdata = fs.readFileSync('mesajes.json');
let data = JSON.parse(rawdata);

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

async function dialogflowIA(inmsg, msg, from, projectId = 'makercenterbot-u9wa') {
    // A unique identifier for the given session
    const sessionId = uuid.v4();
    // Create a new session
    const sessionClient = new dialogflow.SessionsClient(CONFIGURATION);
    const sessionPath = sessionClient.projectAgentSessionPath(
        projectId,
        sessionId
    );

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                // The query to send to the dialogflow agent
                text: msg,
                // The language used by the client (en-US)
                languageCode: 'es',
            },
        },
    };

    // Send request and log result
    const responses = await sessionClient.detectIntent(request);
    //console.log('Detected intent');
    const result = responses[0].queryResult;
    //console.log(`  Query: ${result.queryText}`);
    //console.log(`  Response: ${result.fulfillmentText}`);

    if (result.intent) {
        //console.log(`  Intent: ${result.intent.displayName}`);
        sendMessage(from, result.fulfillmentText)
    } else {
        //console.log('  No intent matched.');
    }

    let dt = dateTime.create();
    let formatted = dt.format('Y-m-d H:M:S');


    try {
        let prevmsg = {
            "time": formatted,
            "from": inmsg.from,
            "name": inmsg.notifyName,
            "body": inmsg.body,
            "bot-response": result.fulfillmentText
        }
        data.msgjson.push(prevmsg)
        let datanew = JSON.stringify(data);
        fs.writeFileSync("mesajes.json", datanew)
    } catch (error) {
        console.log(error)
    }

}



client.on('message', async msg => {
    let dt = dateTime.create();
    let formatted = dt.format('Y-m-d H:M:S');

    console.log('MESSAGE RECEIVED 🤖 :', formatted);
    const { from, to, body } = msg;
    dialogflowIA(msg, body, from)
});


const sendMessage = async (to, message) => {
    client.sendMessage(to, message)
    console.log(`⚡⚡⚡ Enviando mensajes....`);
}



client.initialize();