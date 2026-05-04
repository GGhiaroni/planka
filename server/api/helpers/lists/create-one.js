/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    values: {
      type: 'ref',
      required: true,
    },
    project: {
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
    const { values } = inputs;

    const lists = await sails.helpers.boards.getKanbanListsById(values.board.id);

    const { position, repositions } = sails.helpers.utils.insertToPositionables(
      values.position,
      lists,
    );

    if (repositions.length > 0) {
      // eslint-disable-next-line no-restricted-syntax
      for (const reposition of repositions) {
        // eslint-disable-next-line no-await-in-loop
        await List.qm.updateOne(
          {
            id: reposition.record.id,
            boardId: reposition.record.boardId,
          },
          {
            position: reposition.position,
          },
        );

        sails.sockets.broadcast(`board:${values.board.id}`, 'listUpdate', {
          item: {
            id: reposition.record.id,
            position: reposition.position,
          },
        });

        // TODO: send webhooks
      }
    }

    let labelId;
    if (List.LABEL_LINKED_TYPES.includes(values.type)) {
      const existingLabels = await Label.qm.getByBoardId(values.board.id);
      const lastPosition = existingLabels.reduce(
        (max, label) => (label.position > max ? label.position : max),
        0,
      );

      const label = await sails.helpers.labels.createOne.with({
        project: inputs.project,
        values: {
          name: values.name,
          color: _.sample(Label.COLORS),
          position: lastPosition + 65536,
          board: values.board,
        },
        actorUser: inputs.actorUser,
      });

      labelId = label.id;
    }

    const list = await List.qm.createOne({
      ...values,
      position,
      boardId: values.board.id,
      labelId,
    });

    sails.sockets.broadcast(
      `board:${list.boardId}`,
      'listCreate',
      {
        item: list,
      },
      inputs.request,
    );

    const webhooks = await Webhook.qm.getAll();

    sails.helpers.utils.sendWebhooks.with({
      webhooks,
      event: Webhook.Events.LIST_CREATE,
      buildData: () => ({
        item: list,
        included: {
          projects: [inputs.project],
          boards: [values.board],
        },
      }),
      user: inputs.actorUser,
    });

    return list;
  },
};
