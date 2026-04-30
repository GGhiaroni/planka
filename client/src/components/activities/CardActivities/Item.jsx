/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Comment } from 'semantic-ui-react';

import selectors from '../../../selectors';
import { isUserStatic } from '../../../utils/record-helpers';
import { ActivityTypes } from '../../../constants/Enums';
import TimeAgo from '../../common/TimeAgo';
import UserAvatar from '../../users/UserAvatar';

import styles from './Item.module.scss';

const ACTIVITY_EMOJI = {
  [ActivityTypes.CREATE_CARD]: '🆕',
  [ActivityTypes.MOVE_CARD]: '➡️',
  [ActivityTypes.ADD_MEMBER_TO_CARD]: '👤',
  [ActivityTypes.REMOVE_MEMBER_FROM_CARD]: '👋',
  [ActivityTypes.COMPLETE_TASK]: '✅',
  [ActivityTypes.UNCOMPLETE_TASK]: '↩️',
  [ActivityTypes.UPDATE_CARD_NAME]: '✏️',
  [ActivityTypes.UPDATE_CARD_DESCRIPTION]: '📝',
  [ActivityTypes.UPDATE_CARD_DUE_DATE]: '📅',
  [ActivityTypes.ADD_LABEL_TO_CARD]: '🏷️',
  [ActivityTypes.REMOVE_LABEL_FROM_CARD]: '🏷️',
  [ActivityTypes.UPDATE_CUSTOM_FIELD_VALUE]: '🔄',
};

const Item = React.memo(({ id }) => {
  const selectActivityById = useMemo(() => selectors.makeSelectActivityById(), []);
  const selectUserById = useMemo(() => selectors.makeSelectUserById(), []);

  const activity = useSelector((state) => selectActivityById(state, id));
  const user = useSelector((state) => selectUserById(state, activity.userId));

  const [t] = useTranslation();

  const userName = isUserStatic(user)
    ? t(`common.${user.name}`, { context: 'title' })
    : user.name;

  // Build the action description (no author — that's rendered separately).
  let descriptionNode = null;
  switch (activity.type) {
    case ActivityTypes.CREATE_CARD: {
      const { list } = activity.data;
      const listName = list.name || t(`common.${list.type}`);
      descriptionNode = (
        <>
          adicionou este cartão a <strong>{listName}</strong>
        </>
      );
      break;
    }
    case ActivityTypes.MOVE_CARD: {
      const { fromList, toList } = activity.data;
      const fromListName = fromList.name || t(`common.${fromList.type}`);
      const toListName = toList.name || t(`common.${toList.type}`);
      descriptionNode = (
        <>
          moveu este cartão de <strong>{fromListName}</strong> para <strong>{toListName}</strong>
        </>
      );
      break;
    }
    case ActivityTypes.ADD_MEMBER_TO_CARD:
      descriptionNode =
        user.id === activity.data.user.id ? (
          <>entrou neste cartão</>
        ) : (
          <>
            adicionou <strong>{activity.data.user.name}</strong> a este cartão
          </>
        );
      break;
    case ActivityTypes.REMOVE_MEMBER_FROM_CARD:
      descriptionNode =
        user.id === activity.data.user.id ? (
          <>saiu deste cartão</>
        ) : (
          <>
            removeu <strong>{activity.data.user.name}</strong> deste cartão
          </>
        );
      break;
    case ActivityTypes.COMPLETE_TASK:
      descriptionNode = (
        <>
          concluiu a tarefa <strong>{activity.data.task.name}</strong>
        </>
      );
      break;
    case ActivityTypes.UNCOMPLETE_TASK:
      descriptionNode = (
        <>
          marcou a tarefa <strong>{activity.data.task.name}</strong> como pendente
        </>
      );
      break;
    case ActivityTypes.UPDATE_CARD_NAME: {
      const { fromName, toName } = activity.data;
      descriptionNode = (
        <>
          renomeou o card de <strong>"{fromName}"</strong> para <strong>"{toName}"</strong>
        </>
      );
      break;
    }
    case ActivityTypes.UPDATE_CARD_DESCRIPTION: {
      const { hasContent } = activity.data;
      descriptionNode = hasContent ? (
        <>atualizou a descrição do card</>
      ) : (
        <>removeu a descrição do card</>
      );
      break;
    }
    case ActivityTypes.UPDATE_CARD_DUE_DATE: {
      const { fromDueDate, toDueDate } = activity.data;
      const fmt = (d) =>
        d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : null;
      if (!toDueDate) {
        descriptionNode = <>removeu a data de vencimento</>;
      } else if (!fromDueDate) {
        descriptionNode = (
          <>
            definiu a data de vencimento como <strong>{fmt(toDueDate)}</strong>
          </>
        );
      } else {
        descriptionNode = (
          <>
            alterou a data de vencimento de <strong>{fmt(fromDueDate)}</strong> para{' '}
            <strong>{fmt(toDueDate)}</strong>
          </>
        );
      }
      break;
    }
    case ActivityTypes.ADD_LABEL_TO_CARD: {
      const { label } = activity.data;
      descriptionNode = (
        <>
          adicionou a etiqueta <strong>"{label.name}"</strong> ao card
        </>
      );
      break;
    }
    case ActivityTypes.REMOVE_LABEL_FROM_CARD: {
      const { label } = activity.data;
      descriptionNode = (
        <>
          removeu a etiqueta <strong>"{label.name}"</strong> do card
        </>
      );
      break;
    }
    case ActivityTypes.UPDATE_CUSTOM_FIELD_VALUE: {
      const { customField, fromContent, toContent } = activity.data;
      const display = (v) =>
        v == null || v === '' ? <em>(vazio)</em> : <strong>"{String(v)}"</strong>;
      descriptionNode = (
        <>
          alterou <strong>{customField.name}</strong> de {display(fromContent)} para{' '}
          {display(toContent)}
        </>
      );
      break;
    }
    default:
      descriptionNode = null;
  }

  if (!descriptionNode) return null;

  const emoji = ACTIVITY_EMOJI[activity.type] || '•';
  const absoluteTime = activity.createdAt
    ? new Date(activity.createdAt).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <Comment>
      <span className={styles.user}>
        <UserAvatar id={activity.userId} />
      </span>
      <div className={styles.content}>
        <div className={styles.activityLine}>
          <span className={styles.author}>{userName}</span>
          <span className={styles.emoji} aria-hidden="true">
            {emoji}
          </span>
          <span className={styles.description}>{descriptionNode}</span>
        </div>
        <span className={styles.date}>
          <TimeAgo date={activity.createdAt} />
          {absoluteTime && <span className={styles.absoluteDate}>{absoluteTime}</span>}
        </span>
      </div>
    </Comment>
  );
});

Item.propTypes = {
  id: PropTypes.string.isRequired,
};

export default Item;
