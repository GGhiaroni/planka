/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router';
import { Comment } from 'semantic-ui-react';

import selectors from '../../../selectors';
import { isUserStatic } from '../../../utils/record-helpers';
import Paths from '../../../constants/Paths';
import { ActivityTypes } from '../../../constants/Enums';
import TimeAgo from '../../common/TimeAgo';
import UserAvatar from '../../users/UserAvatar';

import styles from './Item.module.scss';

const Item = React.memo(({ id }) => {
  const selectActivityById = useMemo(() => selectors.makeSelectActivityById(), []);
  const selectUserById = useMemo(() => selectors.makeSelectUserById(), []);
  const selectCardById = useMemo(() => selectors.makeSelectCardById(), []);

  const activity = useSelector((state) => selectActivityById(state, id));
  const user = useSelector((state) => selectUserById(state, activity.userId));
  const card = useSelector((state) => selectCardById(state, activity.cardId));

  const [t] = useTranslation();

  const userName = isUserStatic(user)
    ? t(`common.${user.name}`, {
        context: 'title',
      })
    : user.name;

  const cardName =
    (card && card.name) ||
    (activity.data && activity.data.card && activity.data.card.name) ||
    t('common.deletedCard');

  let contentNode;
  switch (activity.type) {
    case ActivityTypes.CREATE_CARD: {
      const { list } = activity.data;
      const listName = list.name || t(`common.${list.type}`);

      contentNode = (
        <Trans
          i18nKey="common.userAddedCardToList"
          values={{
            user: userName,
            card: cardName,
            list: listName,
          }}
        >
          <span className={styles.author}>{userName}</span>
          {' added '}
          <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{cardName}</Link>
          {' to '}
          {listName}
        </Trans>
      );

      break;
    }
    case ActivityTypes.MOVE_CARD: {
      const { fromList, toList } = activity.data;

      const fromListName = fromList.name || t(`common.${fromList.type}`);
      const toListName = toList.name || t(`common.${toList.type}`);

      contentNode = (
        <Trans
          i18nKey="common.userMovedCardFromListToList"
          values={{
            user: userName,
            card: cardName,
            fromList: fromListName,
            toList: toListName,
          }}
        >
          <span className={styles.author}>{userName}</span>
          {' moved '}
          <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{cardName}</Link>
          {' from '}
          {fromListName}
          {' to '}
          {toListName}
        </Trans>
      );

      break;
    }
    case ActivityTypes.ADD_MEMBER_TO_CARD:
      contentNode =
        user.id === activity.data.user.id ? (
          <Trans
            i18nKey="common.userJoinedCard"
            values={{
              user: userName,
              card: cardName,
            }}
          >
            <span className={styles.author}>{userName}</span>
            {' joined '}
            <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{cardName}</Link>
          </Trans>
        ) : (
          <Trans
            i18nKey="common.userAddedUserToCard"
            values={{
              actorUser: userName,
              addedUser: activity.data.user.name,
              card: cardName,
            }}
          >
            <span className={styles.author}>{userName}</span>
            {' added '}
            {activity.data.user.name}
            {' to '}
            <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{cardName}</Link>
          </Trans>
        );

      break;
    case ActivityTypes.REMOVE_MEMBER_FROM_CARD:
      contentNode =
        user.id === activity.data.user.id ? (
          <Trans
            i18nKey="common.userLeftCard"
            values={{
              user: userName,
              card: cardName,
            }}
          >
            <span className={styles.author}>{userName}</span>
            {' left '}
            <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{cardName}</Link>
          </Trans>
        ) : (
          <Trans
            i18nKey="common.userRemovedUserFromCard"
            values={{
              actorUser: userName,
              removedUser: activity.data.user.name,
              card: cardName,
            }}
          >
            <span className={styles.author}>{userName}</span>
            {' removed '}
            {activity.data.user.name}
            {' from '}
            <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{cardName}</Link>
          </Trans>
        );

      break;
    case ActivityTypes.COMPLETE_TASK:
      contentNode = (
        <Trans
          i18nKey="common.userCompletedTaskOnCard"
          values={{
            user: userName,
            task: activity.data.task.name,
            card: cardName,
          }}
        >
          <span className={styles.author}>{userName}</span>
          {' completed '}
          {activity.data.task.name}
          {' on '}
          <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{cardName}</Link>
        </Trans>
      );

      break;
    case ActivityTypes.UNCOMPLETE_TASK:
      contentNode = (
        <Trans
          i18nKey="common.userMarkedTaskIncompleteOnCard"
          values={{
            user: userName,
            task: activity.data.task.name,
            card: cardName,
          }}
        >
          <span className={styles.author}>{userName}</span>
          {' marked '}
          {activity.data.task.name}
          {' incomplete on '}
          <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{cardName}</Link>
        </Trans>
      );

      break;
    case ActivityTypes.UPDATE_CARD_NAME: {
      const { fromName, toName } = activity.data;

      contentNode = (
        <Trans i18nKey="common.userRenamedCardFromTo" values={{ user: userName, fromName, toName }}>
          <span className={styles.author}>{userName}</span>
          {' renamed '}
          <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{fromName}</Link>
          {' to '}
          {toName}
        </Trans>
      );

      break;
    }
    case ActivityTypes.UPDATE_CARD_DESCRIPTION: {
      const i18nKey = activity.data.hasContent
        ? 'common.userEditedDescriptionOfCard'
        : 'common.userClearedDescriptionOfCard';

      contentNode = (
        <Trans i18nKey={i18nKey} values={{ user: userName, card: cardName }}>
          <span className={styles.author}>{userName}</span>
          {' edited the description of '}
          <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{cardName}</Link>
        </Trans>
      );

      break;
    }
    case ActivityTypes.UPDATE_CARD_DUE_DATE: {
      const { fromDueDate, toDueDate } = activity.data;
      const formatDueDate = (value) =>
        value
          ? new Date(value).toLocaleString(undefined, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : t('common.none');

      let i18nKey;
      if (!fromDueDate && toDueDate) i18nKey = 'common.userSetDueDateOfCardTo';
      else if (fromDueDate && !toDueDate) i18nKey = 'common.userClearedDueDateOfCard';
      else i18nKey = 'common.userChangedDueDateOfCardFromTo';

      contentNode = (
        <Trans
          i18nKey={i18nKey}
          values={{
            user: userName,
            card: cardName,
            fromDueDate: formatDueDate(fromDueDate),
            toDueDate: formatDueDate(toDueDate),
          }}
        >
          <span className={styles.author}>{userName}</span>
          {' updated the due date of '}
          <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{cardName}</Link>
        </Trans>
      );

      break;
    }
    case ActivityTypes.ADD_LABEL_TO_CARD: {
      const labelName =
        activity.data.label && activity.data.label.name
          ? activity.data.label.name
          : t('common.unnamedLabel');

      contentNode = (
        <Trans
          i18nKey="common.userAddedLabelToCard"
          values={{ user: userName, label: labelName, card: cardName }}
        >
          <span className={styles.author}>{userName}</span>
          {' added label '}
          {labelName}
          {' to '}
          <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{cardName}</Link>
        </Trans>
      );

      break;
    }
    case ActivityTypes.REMOVE_LABEL_FROM_CARD: {
      const labelName =
        activity.data.label && activity.data.label.name
          ? activity.data.label.name
          : t('common.unnamedLabel');

      contentNode = (
        <Trans
          i18nKey="common.userRemovedLabelFromCard"
          values={{ user: userName, label: labelName, card: cardName }}
        >
          <span className={styles.author}>{userName}</span>
          {' removed label '}
          {labelName}
          {' from '}
          <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{cardName}</Link>
        </Trans>
      );

      break;
    }
    case ActivityTypes.UPDATE_CUSTOM_FIELD_VALUE: {
      const fieldName =
        (activity.data.customField && activity.data.customField.name) ||
        (activity.data.field && activity.data.field.name) ||
        t('common.customField');

      contentNode = (
        <Trans
          i18nKey="common.userUpdatedFieldOnCard"
          values={{ user: userName, field: fieldName, card: cardName }}
        >
          <span className={styles.author}>{userName}</span>
          {' updated '}
          {fieldName}
          {' on '}
          <Link to={Paths.CARDS.replace(':id', activity.cardId)}>{cardName}</Link>
        </Trans>
      );

      break;
    }
    default:
      contentNode = null;
  }

  return (
    <Comment>
      <span className={styles.user}>
        <UserAvatar id={activity.userId} />
      </span>
      <div className={styles.content}>
        <div>{contentNode}</div>
        <span className={styles.date}>
          <TimeAgo date={activity.createdAt} />
        </span>
      </div>
    </Comment>
  );
});

Item.propTypes = {
  id: PropTypes.string.isRequired,
};

export default Item;
