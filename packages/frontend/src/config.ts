/*
 * SPDX-FileCopyrightText: syuilo and other misskey, cherrypick contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { miLocalStorage } from '@/local-storage.js';
import packageinfo from '../../../package.json';

const address = new URL(document.querySelector<HTMLMetaElement>('meta[property="instance_url"]')?.content || location.href);
const siteName = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')?.content;

export const host = address.host;
export const hostname = address.hostname;
export const url = address.origin;
export const apiUrl = location.origin + '/api';
export const wsOrigin = location.origin;
export const lang = miLocalStorage.getItem('lang') ?? 'en-US';
export const langs = _LANGS_;
const preParseLocale = miLocalStorage.getItem('locale');
export let locale = preParseLocale ? JSON.parse(preParseLocale) : null;
export const version = _VERSION_;
export const basedMisskeyVersion = _BASEDMISSKEYVERSION_;
export const basedCherryPickVersion = packageinfo.basedCherryPickVersion;
export const instanceName = siteName === 'Rosekey' ? host : siteName;
export const ui = miLocalStorage.getItem('ui');
export const debug = miLocalStorage.getItem('debug') === 'true';

export function updateLocale(newLocale): void {
	locale = newLocale;
}
