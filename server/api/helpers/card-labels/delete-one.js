/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    record: {
      type: 'ref',
      required: true,
    },
    project: {
      type: 'ref',
      required: true,
    },
    board: {
      type: 'ref',
      required: true,
    },
    list: {
      type: 'ref',
      required: true,
    },
    card: {
      type: 'ref',
      required: true,
    },
    actorUser: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const cardLabel = await CardLabel.qm.deleteOne(inputs.record.id);

    if (cardLabel) {
      sails.sockets.broadcast(
        `board:${inputs.board.id}`,
        'cardLabelDelete',
        {
          item: cardLabel,
        },
        inputs.request,
      );

      const webhooks = await Webhook.qm.getAll();

      sails.helpers.utils.sendWebhooks.with({
        webhooks,
        event: Webhook.Events.CARD_LABEL_DELETE,
        buildData: () => ({
          item: cardLabel,
          included: {
            projects: [inputs.project],
            boards: [inputs.board],
            lists: [inputs.list],
            cards: [inputs.card],
          },
        }),
        user: inputs.actorUser,
      });

      const label = await Label.qm.getOneById(cardLabel.labelId);

      await sails.helpers.actions.createOne.with({
        webhooks,
        values: {
          card: inputs.card,
          type: Action.Types.REMOVE_LABEL_FROM_CARD,
          data: {
            label: label ? _.pick(label, ['id', 'name', 'color']) : { id: cardLabel.labelId },
          },
          user: inputs.actorUser,
        },
        project: inputs.project,
        board: inputs.board,
        list: inputs.list,
      });
    }

    return cardLabel;
  },
};
