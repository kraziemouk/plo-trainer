# Poker app UI research for a mobile PLO5 trainer (2026-10-23)

## Ratings (US App Store, pulled live from the iTunes Search API on 2026-10-23)
| App | Rating | Count | URL |
|---|---|---|---|
| Zynga Poker | 4.53 | 134,572 | https://apps.apple.com/us/app/zynga-poker-texas-holdem/id354902315 |
| PokerStars Play | 4.53 | 24,117 | https://apps.apple.com/us/app/pokerstars-play-money-poker/id606944207 |
| Governor of Poker (Holdem) | 4.67 | 24,902 | https://apps.apple.com/us/app/governor-of-poker-holdem/id877638937 |
| Pokerrrr 2 | 4.52 | 29,334 | https://apps.apple.com/us/app/pokerrrr-2-texas-holdem-poker/id592081067 |
| WSOP Poker (below 4.5, kept for its scale) | 4.43 | 366,797 | https://apps.apple.com/us/app/wsop-texas-holdem-poker-game/id719525810 |
| PPPoker (has Omaha, small sample) | 4.81 | 539 | https://apps.apple.com/us/app/pppoker-usa-holdem-omaha/id1554633611 |
| PokerBROS (just under 4.5) | 4.49 | 6,955 | https://apps.apple.com/us/app/pokerbros-your-poker-app/id1463376042 |

GGPoker and Replay Poker didn't come up in the US search, so they are UNVERIFIED and left out.

## Design patterns
UNVERIFIED: these notes are general knowledge of how each app looks. I didn't open their screenshots this turn.

| App | Table and orientation | Seats | Hero vs opponent cards | Folded players | Action buttons | Bet sizing | Pre-action | Pot and chips | Density and color |
|---|---|---|---|---|---|---|---|---|---|
| Zynga | Oval, portrait by default | 9 avatars around the rim | Hero cards large at the bottom center, opponents get small backs | Cards removed, avatar dimmed | 3 wide buttons across the bottom | Slider plus presets | Check/Fold, Call Any | Pot above the board, chips in front of each seat | Medium density, saturated green and gold |
| PokerStars Play | Oval, portrait | Avatar rings | Hero cards fanned and enlarged | Seat greyed out, no cards | Bottom row: Fold, Call, Raise | Raise opens a slider with 1/2, 3/4, Pot, Max | Check boxes above the actions | Pot pill above the board | Clean, dark felt, high contrast |
| Governor of Poker | Landscape-first, Western theme | 6 to 9 seats | Hero cards at the bottom, large | Cards mucked | Right-side button stack in landscape | Slider | Limited | Chip stacks | Busy art, but the controls stay plain |
| Pokerrrr 2 / PPPoker / PokerBROS | Portrait "club" style with a tall oval | Up to 9 seats, 6-max common | Hero's 4 to 6 Omaha cards in a big fan at the bottom, opponents show no backs or one tiny card icon | Seat at about 40% opacity, cards gone | Bottom-right thumb cluster | Preset chips (1/3, 1/2, 2/3, Pot) plus a vertical slider | Fold/Check, Call Any, Check | Pot at the center, bets on lines toward the center | High density, dark background, bright action colors (red fold, green call, orange raise) |
| WSOP | Portrait | 9 seats | Same as Zynga | Dimmed | Bottom row | Presets plus slider | Yes | Pot pill | Flashy gold |

## Recommendations for a mobile PLO5 trainer
1. **Hide folded hands.** When a player folds, remove their cards and set the seat to `opacity:.4`. Keep their cards in the hand history only.
2. **Opponent cards.** Show one 14×20px card-back badge next to the name, not five backs.
3. **Hero hand, portrait.** Fan five cards at 52×74px with a 6px overlap at `bottom:118px`, centered and clear of the action bar. Give it `z-index` above the seats.
4. **Board.** Five cards at 44×62px centered at 45% of the table height. Put the pot pill (28px tall) just above it.
5. **Portrait table.** Use a tall oval 92vw wide × 58vh high. Place up to 9 seats on an ellipse, skipping the bottom-center arc where the hero sits. Seats are 64×40px: name 11px plus stack 13px bold.
6. **Action bar, portrait.** Fixed to the bottom at 64px tall plus `env(safe-area-inset-bottom)`. Fold, Call, and Raise each take 1/3 of the width, with a 12px radius and 16px bold labels. Colors: Fold #c0392b, Call #27ae60, Raise #e67e22.
7. **Bet sizing.** Tapping Raise opens a 56px row above the bar with 1/3, 1/2, 2/3, and Pot (PLO max) buttons. Add a vertical slider (40px wide) on the right edge and an amount pill. All tap targets are at least 44px.
8. **Pre-action toggles.** While it's not your turn, the action bar becomes three toggles: Check/Fold, Check, and Call Any.
9. **Landscape.** The table takes the left 75% at full height. Stack the actions vertically on the right (3 buttons, 56px each, 120px wide). Put the hero hand at the bottom center at 46×64px. Use one-row seats only.
10. **Color.** Dark felt #0f3d2e on #0b0f14. Cards are white with 4-color suits (♦ blue, ♣ green) so PLO flush reads are quick. Hide extra info like odds and meters behind tap-to-open sheets, max 40vh high.
