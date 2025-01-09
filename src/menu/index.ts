//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import './index.scss';

import { MenuWindowWithApi } from './@types/preload';
declare const window: MenuWindowWithApi;

import { Menu } from './menu';
import { MenuTheme } from './menu-theme';
import { SoundTheme } from './sound-theme';

/**
 * This file is the main entry point for Kando's renderer process. It is responsible for
 * drawing the menu and the settings, as well as handling user input.
 */

// Wire up the menu and the settings -------------------------------------------------------

// We need some information from the main process before we can start. This includes the
// backend info, the menu theme, and the menu theme colors.
Promise.all([
  window.api.getMenuTheme(),
  window.api.getCurrentMenuThemeColors(),
  window.api.getSoundTheme(),
  window.api.appSettings.get(),
]).then(async ([themeDescription, colors, soundThemeDescription, settings]) => {
  // First, we create a new menu theme and load the description we got from the main
  // process.
  const menuTheme = new MenuTheme();
  menuTheme.loadDescription(themeDescription);
  menuTheme.setColors(colors);

  const reloadMenuTheme = async () => {
    Promise.all([window.api.getMenuTheme(), window.api.getCurrentMenuThemeColors()]).then(
      ([themeDescription, colors]) => {
        menuTheme.loadDescription(themeDescription);
        menuTheme.setColors(colors);
      }
    );
  };

  // We also listen for changes to the menu theme and the menu theme colors.
  window.api.appSettings.onChange('menuThemeColors', () => reloadMenuTheme());
  window.api.appSettings.onChange('darkMenuThemeColors', () => reloadMenuTheme());
  window.api.appSettings.onChange('menuTheme', () => reloadMenuTheme());
  window.api.appSettings.onChange('darkMenuTheme', () => reloadMenuTheme());
  window.api.appSettings.onChange('enableDarkModeForMenuThemes', () => reloadMenuTheme());
  window.api.darkModeChanged(() => reloadMenuTheme());

  // We also create a new sound theme and load the description we got from the main
  // process.
  const soundTheme = new SoundTheme();
  soundTheme.loadDescription(soundThemeDescription);
  soundTheme.setVolume(settings.soundVolume);

  window.api.appSettings.onChange('soundTheme', () => {
    window.api.getSoundTheme().then((description) => {
      soundTheme.loadDescription(description);
    });
  });

  window.api.appSettings.onChange('soundVolume', (volume) => {
    soundTheme.setVolume(volume);
  });

  // Now, we create a new menu and a new settings. The menu is responsible for rendering
  // the menu items and the settings is responsible for rendering the settings UI.
  const menu = new Menu(
    document.getElementById('kando-menu'),
    menuTheme,
    soundTheme,
    settings.menuOptions
  );

  // Show the menu when the main process requests it.
  window.api.showMenu((root, menuOptions) => {
    menu.show(root, menuOptions);
  });

  // Tell the menu and the settings about settings changes.
  window.api.appSettings.onChange('menuOptions', (o) => menu.setOptions(o));

  // Sometimes, the user may select an item too close to the edge of the screen. In this
  // case, we can not open the menu directly under the pointer. To make sure that the
  // menu is still exactly under the pointer, we move the pointer a little bit.
  menu.on('move-pointer', (dist) => {
    window.api.movePointer(dist);
  });

  // Hide Kando's window when the user aborts a selection.
  menu.on('cancel', () => {
    menu.hide();
    window.api.cancelSelection();
  });

  // Hide Kando's window when the user selects an item and notify the main process.
  menu.on('select', (path) => {
    menu.hide();
    window.api.selectItem(path);
  });

  // Report hover and unhover events to the main process.
  menu.on('hover', (path) => {
    window.api.hoverItem(path);
  });

  menu.on('unhover', (path) => window.api.unhoverItem(path));

  // Hide the menu or the settings when the user presses escape.
  document.body.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      menu.hide();
      window.api.cancelSelection();
    }
  });

  // This is helpful during development as it shows us when the renderer process has
  // finished reloading.
  window.api.log("Successfully loaded Kando's Menu process.");

  // Notify the main process that we are ready.
  window.api.menuWindowReady();
});
