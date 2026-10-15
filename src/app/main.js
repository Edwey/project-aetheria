/**
 * Main entry point - boots the ported prototype game (Stage C).
 * R1+ will split src/app/game.js into render/, ui/ and app/ modules
 * without changing behaviour; see tasks/R1/.
 */

import '../ui/hud.css';
import { initGame } from './game.js';

initGame();
