const { Listr } = require('listr2');

const dpnsDocumentSchema = require('@dashevo/dpns-contract/schema/dpns-contract-documents.json');
const dashpayDocumentSchema = require('@dashevo/dashpay-contract/schema/dashpay.schema.json');

const wait = require('../../../util/wait');

/**
 *
 * @param {createClientWithFundedWallet} createClientWithFundedWallet
 * @return {initTask}
 */
function initTaskFactory(
  createClientWithFundedWallet,
) {
  /**
   * @typedef {initTask}
   * @param {string} preset
   * @return {Listr}
   */
  function initTask(
    preset,
  ) {
    return new Listr([
      {
        title: 'Initialize SDK',
        task: async (ctx, task) => {
          // wait 5 seconds to ensure everything was initialized
          await wait(5000);

          ctx.client = await createClientWithFundedWallet(
            preset,
            ctx.network,
            ctx.seed,
            ctx.fundingPrivateKeyString,
          );

          // eslint-disable-next-line no-param-reassign
          task.output = `HD private key: ${ctx.client.wallet.exportWallet('HDPrivateKey')}`;
        },
        options: { persistentOutput: true },
      },
      {
        title: 'Register DPNS identity',
        task: async (ctx, task) => {
          ctx.identity = await ctx.client.platform.identities.register(5);

          // eslint-disable-next-line no-param-reassign
          task.output = `DPNS identity: ${ctx.identity.getId()}`;
        },
        options: { persistentOutput: true },
      },
      {
        title: 'Register DPNS contract',
        task: async (ctx, task) => {
          ctx.dataContract = await ctx.client.platform.contracts.create(
            dpnsDocumentSchema, ctx.identity,
          );

          await ctx.client.platform.contracts.broadcast(
            ctx.dataContract,
            ctx.identity,
          );

          // eslint-disable-next-line no-param-reassign
          task.output = `DPNS contract ID: ${ctx.dataContract.getId()}`;
        },
        options: { persistentOutput: true },
      },
      {
        title: 'Register top level domain "dash"',
        task: async (ctx) => {
          ctx.client.apps.dpns = {
            contractId: ctx.dataContract.getId(),
          };

          await ctx.client.platform.names.register('dash', ctx.identity);
        },
      },
      {
        title: 'Register identity for Dashpay',
        task: async (ctx, task) => {
          ctx.identity = await ctx.client.platform.identities.register(5);

          // eslint-disable-next-line no-param-reassign
          task.output = `Dashpay's owner identity: ${ctx.identity.getId()}`;
        },
        options: { persistentOutput: true },
      },
      {
        title: 'Register Dashpay Contract',
        task: async (ctx, task) => {
          ctx.dataContract = await ctx.client.platform.contracts.create(
            dashpayDocumentSchema, ctx.identity,
          );

          await ctx.client.platform.contracts.broadcast(
            ctx.dataContract,
            ctx.identity,
          );

          // eslint-disable-next-line no-param-reassign
          task.output = `Dashpay contract ID: ${ctx.dataContract.getId()}`;
        },
        options: { persistentOutput: true },
      },
      {
        title: 'Disconnect SDK',
        task: async (ctx) => ctx.client.disconnect(),
      },
    ]);
  }

  return initTask;
}

module.exports = initTaskFactory;
