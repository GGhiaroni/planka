/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useInView } from 'react-intersection-observer';
import { Comment, Loader } from 'semantic-ui-react';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import Item from './Item';

import styles from './CardActivities.module.scss';

function dayKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
    dt.getDate(),
  ).padStart(2, '0')}`;
}

function formatGroupHeader(d) {
  const dt = new Date(d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(dt) === dayKey(today)) return 'HOJE';
  if (dayKey(dt) === dayKey(yesterday)) return 'ONTEM';
  return dt
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    .toUpperCase();
}

const CardActivities = React.memo(() => {
  const activityIds = useSelector(selectors.selectActivityIdsForCurrentCard);
  const { isActivitiesFetching, isAllActivitiesFetched } = useSelector(selectors.selectCurrentCard);
  const ormState = useSelector((state) => state.orm);

  const dispatch = useDispatch();

  const [inViewRef] = useInView({
    threshold: 1,
    onChange: (inView) => {
      if (inView) {
        dispatch(entryActions.fetchActivitiesInCurrentCard());
      }
    },
  });

  // Group activity IDs by day (newest first), preserving the original order within each group.
  const groups = useMemo(() => {
    const all = ormState?.Action?.itemsById || {};
    const out = [];
    let current = null;

    activityIds.forEach((aid) => {
      const a = all[aid];
      if (!a || !a.createdAt) {
        if (!current) {
          current = { key: 'unknown', label: '', ids: [] };
          out.push(current);
        }
        current.ids.push(aid);
        return;
      }
      const k = dayKey(a.createdAt);
      if (!current || current.key !== k) {
        current = { key: k, label: formatGroupHeader(a.createdAt), ids: [] };
        out.push(current);
      }
      current.ids.push(aid);
    });

    return out;
  }, [activityIds, ormState]);

  return (
    <>
      <div className={styles.itemsWrapper}>
        <Comment.Group className={styles.items}>
          {groups.map((g) => (
            <React.Fragment key={g.key}>
              {g.label && <div className={styles.dayHeader}>{g.label}</div>}
              {g.ids.map((activityId) => (
                <Item key={activityId} id={activityId} />
              ))}
            </React.Fragment>
          ))}
        </Comment.Group>
      </div>
      {isActivitiesFetching !== undefined && isAllActivitiesFetched !== undefined && (
        <div className={styles.loaderWrapper}>
          {isActivitiesFetching ? (
            <Loader active inverted inline="centered" size="small" />
          ) : (
            !isAllActivitiesFetched && <div ref={inViewRef} />
          )}
        </div>
      )}
    </>
  );
});

export default CardActivities;
