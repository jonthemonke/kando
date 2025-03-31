//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import classNames from 'classnames/bind';

import * as classes from './Preview.module.scss';
const cx = classNames.bind(classes);

import { ItemTypeRegistry } from '../../common/item-type-registry';
import PreviewHeaderbar from './PreviewHeaderbar';
import ThemedIcon from './widgets/ThemedIcon';

/**
 * This component encapsules the center area of the settings dialog. It contains some
 * toolbar buttons at the top, the menu preview in the center, and the item types at the
 * bottom.
 */
export default () => {
  const [draggedItemType, setDraggedItemType] = React.useState('');

  const itemTypes = Array.from(ItemTypeRegistry.getInstance().getAllTypes());

  return (
    <div className={classes.container}>
      <PreviewHeaderbar />
      <div className={classes.previewArea}>
        <div className={classes.preview}></div>
      </div>
      <div className={classes.itemArea}>
        <div className={classes.header}>
          <div className={classes.leftLine}></div>
          <div className={classes.title}>Add Menu Items</div>
          <div className={classes.rightLine}></div>
        </div>
        <div className={classes.shadow}></div>
        <div className={classes.items}>
          {itemTypes.map(([name, type]) => (
            <div
              key={name}
              className={cx({
                item: true,
                dragging: draggedItemType === name,
              })}
              data-tooltip-id="click-to-show-tooltip"
              data-tooltip-html={
                '<strong>' + type.defaultName + '</strong><br>' + type.genericDescription
              }
              draggable
              onDragStart={() => setDraggedItemType(name)}
              onDragEnd={() => setDraggedItemType('')}>
              <ThemedIcon
                size={'100%'}
                name={type.defaultIcon}
                theme={type.defaultIconTheme}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
