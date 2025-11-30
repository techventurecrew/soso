// ==========================
// FILE: filters/main.js
// Central filter manager file
// ==========================

import animeSmooth from './animeSmooth.js';
import beautyGlow from './beautyGlow.js';
import brightPop from './brightPop.js';
import brownMoody from './brownMoody.js';
import colorPop from './colorPop.js';
import coolTone from './coolTone.js';
import dreamBlur from './dreamBlur.js';
import eyeEnlarge from './eyeEnlarge.js';
import faceSlim from './faceSlim.js';
import hdrBoost from './hdrBoost.js';
import lutVintage, { lutCinematic, lutTealOrange } from './lutFilters.js';
import sharpenDetail from './sharpenDetail.js';
import skinSoftProfessional from './skinSoftProfessional.js';
import smoothSkin from './smoothSkin.js';
import softPink from './softPink.js';
import warmTone from './warmTone.js';
import whitening from './whitening.js';

const identityFilter = (canvas) => canvas;

const baseFilters = {
  none: identityFilter,
  smoothSkin,
  whitening,
  eyeEnlarge,
  faceSlim,
  hdrBoost,
  colorPop,
  warmTone,
  coolTone,
};

const premiumFilters = {
  animeSmooth,
  beautyGlow,
  brightPop,
  brownMoody,
  dreamBlur,
  skinSoftProfessional,
  sharpenDetail,
  softPink,
  lutVintage,
  lutCinematic,
  lutTealOrange,
};

export const filters = {
  ...baseFilters,
  ...premiumFilters,
};

const startCase = (key) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());

export const filterOptions = Object.keys(filters).map((id) => ({
  id,
  label: startCase(id),
}));

export function applyFilter(filterName, imageCanvas, detectionData) {
  const fn = filters[filterName] || identityFilter;
  return fn(imageCanvas, detectionData);
}

