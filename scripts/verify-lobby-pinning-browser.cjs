// Preserve the preceding-screen sequence: opening Worlds before the lobby used
// to expose the body overflow/sticky failure that a fresh lobby alone missed.
process.env.AUTOFIT_WIDTHS ||= '280,320,390,430,640';
process.env.AUTOFIT_PAGES = 'hsPick,hsBet,stats,world,quickLobby,lobby,teamLobby';
require('./verify-auto-fit-browser.cjs');
