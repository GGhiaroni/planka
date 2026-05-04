/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { Button, Icon } from 'semantic-ui-react';
import { useDidUpdate, useToggle, useTransitioning } from '../../../lib/hooks';
import { usePopup } from '../../../lib/popup';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import { BoardShortcutsContext } from '../../../contexts';
import DroppableTypes from '../../../constants/DroppableTypes';
import { BoardMembershipRoles, ListTypes } from '../../../constants/Enums';
import { ListTypeIcons } from '../../../constants/Icons';
import {
  isListCollapsed as readIsCollapsed,
  setListCollapsed,
  subscribeCollapsedLists,
} from '../../../utils/collapsed-lists';
import EditName from './EditName';
import ActionsStep from './ActionsStep';
import DraggableCard from '../../cards/DraggableCard';
import AddCard from '../../cards/AddCard';
import ArchiveCardsStep from '../../cards/ArchiveCardsStep';
import PlusMathIcon from '../../../assets/images/plus-math-icon.svg?react';

import styles from './List.module.scss';
import globalStyles from '../../../styles.module.scss';

const AddCardPositions = {
  TOP: 'top',
  BOTTOM: 'bottom',
};

const INDEX_BY_ADD_CARD_POSITION = {
  [AddCardPositions.TOP]: 0,
};

const List = React.memo(({ id, index }) => {
  const selectListById = useMemo(() => selectors.makeSelectListById(), []);

  const selectFilteredCardIdsByListId = useMemo(
    () => selectors.makeSelectFilteredCardIdsByListId(),
    [],
  );

  const clipboard = useSelector(selectors.selectClipboard);
  const isFavoritesActive = useSelector(selectors.selectIsFavoritesActiveForCurrentUser);

  const list = useSelector((state) => selectListById(state, id));
  const cardIds = useSelector((state) => selectFilteredCardIdsByListId(state, id));

  const { canEdit, canArchiveCards, canAddCard, canPasteCard, canDropCard } = useSelector(
    (state) => {
      const isEditModeEnabled = selectors.selectIsEditModeEnabled(state); // TODO: move out?

      const boardMembership = selectors.selectCurrentUserMembershipForCurrentBoard(state);
      const isEditor = !!boardMembership && boardMembership.role === BoardMembershipRoles.EDITOR;

      return {
        canEdit: isEditModeEnabled && isEditor,
        canArchiveCards: list.type === ListTypes.CLOSED && isEditor,
        canAddCard: isEditor,
        canPasteCard: isEditor,
        canDropCard: isEditor,
      };
    },
    shallowEqual,
  );

  const dispatch = useDispatch();
  const [t] = useTranslation();
  const [isEditNameOpened, setIsEditNameOpened] = useState(false);
  const [addCardPosition, setAddCardPosition] = useState(null);
  const [scrollBottomState, scrollBottom] = useToggle();
  const [handleListMouseEnter, handleListMouseLeave] = useContext(BoardShortcutsContext);

  const [isCollapsed, setIsCollapsed] = useState(() => readIsCollapsed(id));

  useEffect(() => {
    const handler = () => setIsCollapsed(readIsCollapsed(id));
    return subscribeCollapsedLists(handler);
  }, [id]);

  const handleCollapseToggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      setListCollapsed(id, next);
      return next;
    });
  }, [id]);

  const handleExpandClick = useCallback(
    (event) => {
      event.stopPropagation();
      handleCollapseToggle();
    },
    [handleCollapseToggle],
  );

  const wrapperRef = useRef(null);
  const cardsWrapperRef = useRef(null);

  const handleCardCreate = useCallback(
    (data, autoOpen) => {
      dispatch(
        entryActions.createCard(id, data, INDEX_BY_ADD_CARD_POSITION[addCardPosition], autoOpen),
      );
    },
    [id, dispatch, addCardPosition],
  );

  const handlePasteCardClick = useCallback(() => {
    dispatch(entryActions.pasteCard(id));
    scrollBottom();
  }, [id, dispatch, scrollBottom]);

  const handleMouseEnter = useCallback(() => {
    handleListMouseEnter(id, () => {
      scrollBottom();
    });
  }, [id, scrollBottom, handleListMouseEnter]);

  const handleHeaderClick = useCallback(() => {
    if (list.isPersisted && canEdit) {
      setIsEditNameOpened(true);
    }
  }, [list.isPersisted, canEdit]);

  const handleAddCardClick = useCallback(() => {
    setAddCardPosition(AddCardPositions.BOTTOM);
  }, []);

  const handleAddCardClose = useCallback(() => {
    setAddCardPosition(null);
  }, []);

  const handleCardAdd = useCallback(() => {
    setAddCardPosition(AddCardPositions.TOP);
  }, []);

  const handleNameEdit = useCallback(() => {
    setIsEditNameOpened(true);
  }, []);

  const handleEditNameClose = useCallback(() => {
    setIsEditNameOpened(false);
  }, []);

  const handleWrapperTransitionEnd = useTransitioning(
    wrapperRef,
    styles.outerWrapperTransitioning,
    [isFavoritesActive],
  );

  useDidUpdate(() => {
    if (!addCardPosition) {
      return;
    }

    cardsWrapperRef.current.scrollTop =
      addCardPosition === AddCardPositions.TOP ? 0 : cardsWrapperRef.current.scrollHeight;
  }, [cardIds, addCardPosition]);

  useDidUpdate(() => {
    cardsWrapperRef.current.scrollTop = cardsWrapperRef.current.scrollHeight;
  }, [scrollBottomState]);

  const ActionsPopup = usePopup(ActionsStep);
  const ArchiveCardsPopup = usePopup(ArchiveCardsStep);

  const addCardNode = canAddCard && (
    <AddCard
      isOpened={!!addCardPosition}
      className={styles.addCard}
      onCreate={handleCardCreate}
      onClose={handleAddCardClose}
    />
  );

  const setOuterWrapperRef = (droppableRef) => (el) => {
    wrapperRef.current = el;
    droppableRef(el);
  };

  return (
    <Draggable
      draggableId={`list:${id}`}
      index={index}
      isDragDisabled={!list.isPersisted || !canEdit || isEditNameOpened || isCollapsed}
    >
      {({ innerRef, draggableProps, dragHandleProps }) => (
        <div
          {...draggableProps} // eslint-disable-line react/jsx-props-no-spreading
          data-drag-scroller
          ref={innerRef}
          className={classNames(styles.innerWrapper, isCollapsed && styles.innerWrapperCollapsed)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleListMouseLeave}
        >
          <Droppable
            droppableId={`list:${id}`}
            type={DroppableTypes.CARD}
            isDropDisabled={!list.isPersisted || !canDropCard}
          >
            {({ innerRef: droppableRef, droppableProps, placeholder }, snapshot) => (
              <div
                {...droppableProps} // eslint-disable-line react/jsx-props-no-spreading
                ref={setOuterWrapperRef(droppableRef)}
                className={classNames(
                  styles.outerWrapper,
                  isCollapsed && styles.outerWrapperCollapsed,
                  isCollapsed &&
                    snapshot &&
                    snapshot.isDraggingOver &&
                    styles.outerWrapperCollapsedDropping,
                  isFavoritesActive && styles.outerWrapperWithFavorites,
                  list.color && globalStyles[`background${upperFirst(camelCase(list.color))}Soft`],
                )}
                onTransitionEnd={handleWrapperTransitionEnd}
              >
                {isCollapsed ? (
                  /* eslint-disable-next-line jsx-a11y/click-events-have-key-events,
                                          jsx-a11y/no-static-element-interactions */
                  <div
                    {...dragHandleProps} // eslint-disable-line react/jsx-props-no-spreading
                    className={styles.collapsedHeader}
                    onClick={handleExpandClick}
                    title={t('action.expandList')}
                  >
                    {list.type !== ListTypes.ACTIVE && (
                      <Icon name={ListTypeIcons[list.type]} className={styles.collapsedTypeIcon} />
                    )}
                    <div className={styles.collapsedName}>{list.name}</div>
                    <div className={styles.collapsedCount}>{cardIds.length}</div>
                  </div>
                ) : (
                  /* eslint-disable-next-line jsx-a11y/click-events-have-key-events,
                                          jsx-a11y/no-static-element-interactions */
                  <div
                    {...dragHandleProps} // eslint-disable-line react/jsx-props-no-spreading
                    className={classNames(styles.header, canEdit && styles.headerEditable)}
                    onClick={handleHeaderClick}
                  >
                    {isEditNameOpened ? (
                      <EditName listId={id} onClose={handleEditNameClose} />
                    ) : (
                      <div className={styles.headerName}>
                        {list.color && (
                          <Icon
                            name="circle"
                            className={classNames(
                              styles.headerNameColor,
                              globalStyles[`color${upperFirst(camelCase(list.color))}`],
                            )}
                          />
                        )}
                        {list.name}
                      </div>
                    )}
                    {list.type !== ListTypes.ACTIVE && (
                      <Icon
                        name={ListTypeIcons[list.type]}
                        className={classNames(
                          styles.headerIcon,
                          list.isPersisted &&
                            (canEdit || canArchiveCards) &&
                            styles.headerIconHidable,
                        )}
                      />
                    )}
                    {list.isPersisted && (
                      <button
                        type="button"
                        title={t('action.collapseList')}
                        className={styles.collapseButton}
                        onClick={handleCollapseToggle}
                      >
                        <Icon fitted name="compress" size="small" />
                      </button>
                    )}
                    {list.isPersisted &&
                      (canEdit ? (
                        <ActionsPopup
                          listId={id}
                          isCollapsed={isCollapsed}
                          onCollapseToggle={handleCollapseToggle}
                          onNameEdit={handleNameEdit}
                          onCardAdd={handleCardAdd}
                        >
                          <Button className={styles.headerButton}>
                            <Icon fitted name="pencil" size="small" />
                          </Button>
                        </ActionsPopup>
                      ) : (
                        canArchiveCards && (
                          <ArchiveCardsPopup listId={id}>
                            <Button className={styles.headerButton}>
                              <Icon fitted name="archive" size="small" />
                            </Button>
                          </ArchiveCardsPopup>
                        )
                      ))}
                  </div>
                )}
                <div
                  ref={cardsWrapperRef}
                  className={classNames(
                    styles.cardsInnerWrapper,
                    isCollapsed && styles.cardsInnerWrapperCollapsed,
                  )}
                >
                  <div
                    className={classNames(
                      styles.cardsOuterWrapper,
                      isCollapsed && styles.cardsOuterWrapperCollapsed,
                    )}
                  >
                    <div className={styles.cards}>
                      {addCardPosition === AddCardPositions.TOP && addCardNode}
                      {cardIds.map((cardId, cardIndex) => (
                        <DraggableCard
                          key={cardId}
                          id={cardId}
                          index={cardIndex}
                          className={styles.card}
                        />
                      ))}
                      {placeholder}
                      {addCardPosition === AddCardPositions.BOTTOM && addCardNode}
                    </div>
                  </div>
                </div>
                {!isCollapsed && !addCardPosition && canAddCard && (
                  <div className={styles.addCardButtonWrapper}>
                    <button
                      type="button"
                      disabled={!list.isPersisted}
                      className={classNames(
                        styles.addCardButton,
                        list.color &&
                          globalStyles[`background${upperFirst(camelCase(list.color))}Soft`],
                      )}
                      onClick={handleAddCardClick}
                    >
                      <PlusMathIcon className={styles.addCardButtonIcon} />
                      <span className={styles.addCardButtonText}>
                        {cardIds.length > 0 ? t('action.addAnotherCard') : t('action.addCard')}
                      </span>
                    </button>
                    {clipboard && canPasteCard && (
                      <button
                        type="button"
                        disabled={!list.isPersisted}
                        className={classNames(styles.addCardButton, styles.paste)}
                        onClick={handlePasteCardClick}
                      >
                        <Icon name="paste" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
});

List.propTypes = {
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
};

export default List;
