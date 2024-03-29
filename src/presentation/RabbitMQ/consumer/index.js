const amqp = require('amqplib');
const path = require('path');
const infoging = require('../../../common/logging');
const config = require('../../../configuration');
const { getNumberArrayActives, getBlockedNumbers, setBlockedNumbers } = require('../../../common/utils/helper');

function init({ messagesDetailRepository }) {
  async function setupMessageConsumer() {
    try {
      const amqpServer = config.rabbitServer;
      const connection = await amqp.connect(amqpServer);
      const channel = await connection.createChannel();

      getNumberArrayActives().then((NumberArrayActives) => {
        NumberArrayActives.forEach((numberActive) => {
          const queue = `messagesPending-${numberActive}`;
          infoging.info(`RabbitMQ consume : ${queue}`);

          channel.assertQueue(queue, {
            durable: true,
            arguments: {
              'x-queue-type': 'quorum',
            },
          });
          channel.prefetch(1);
          channel.consume(queue, async (response) => {
            const bufferContent = response.content;
            const stringBuffer = bufferContent.toString();
            const dataArrayObject = JSON.parse(stringBuffer);
            const jsonData = await getBlockedNumbers()
            infoging.info(`RabbitMQ consume : ${dataArrayObject.data.id}`);

            if (!jsonData.includes(dataArrayObject.data.from)) {
              const objArrayMessages = dataArrayObject.data.messages.sort(
                (a, b) => a.order - b.order,
              );

              messagesDetailRepository.updateStatusMessage(
                dataArrayObject.data.id,
                'Proceso',
                'En service rabbitmq',
                'ServiceWorker Consumer RabbitMQ',
              );

              for (let i = 0; i < objArrayMessages.length; i += 1) {
                try {
                  const folderPath = path.join(
                    __dirname,
                    '../../SessionsWsp',
                    dataArrayObject.data.from,
                  );
                  // eslint-disable-next-line import/no-dynamic-require, global-require
                  const { adapterProvider } = require(folderPath);
                  if (objArrayMessages[i].fileUrl) {
                    // eslint-disable-next-line no-await-in-loop
                    await adapterProvider.sendMedia(
                      `${dataArrayObject.data.to}@c.us`,
                      objArrayMessages[i].fileUrl,
                      objArrayMessages[i].text || '',
                    );
                  } else {
                    // eslint-disable-next-line no-await-in-loop
                    await adapterProvider.sendText(
                      `${dataArrayObject.data.to}@c.us`,
                      objArrayMessages[i].text,
                    );
                  }
                  await new Promise(resolve => setTimeout(resolve, 1000 * parseInt(config.secondsWaittingPerMessage)));

                } catch (error) {
                  var errorDescriptionJson = JSON.stringify(error);
                  infoging.info(`Error en envio del codigo ${dataArrayObject.data.id} en siguiente numero de envio ${dataArrayObject.data.from} a ${dataArrayObject.data.to} : ${error}`);
                  messagesDetailRepository.updateStatusMessage(
                    dataArrayObject.data.id,
                    'Error',
                    errorDescriptionJson,
                    'ServiceWorker Consumer RabbitMQ',
                  );
                  if (errorDescriptionJson.includes('Connection Closed')) {
                    var newBlockedNumbers = jsonData === "" ? dataArrayObject.data.to : `${jsonData};${dataArrayObject.data.to}`
                    await setBlockedNumbers(newBlockedNumbers);
                  }
                }
              }

              messagesDetailRepository.updateStatusMessage(
                dataArrayObject.data.id,
                'Enviado',
                'Ok',
                'ServiceWorker Consumer RabbitMQ',
              );
            }
            channel.ack(response);
          });
        });
      });
      infoging.info('RabbitMQ connected');
    } catch (err) {
      infoging.error(`Failed to connect to RabbitMQ: ${err.message} `);
    }
  }

  return {
    setupMessageConsumer,
  };
}
module.exports.init = init;
