# 武林積木：龍門江湖 · Wulin Bricks: The Rivers and Lakes of Longmen

An open-world 3D adventure in the spirit of Leaf Leap, set in the world of the Wulin Bricks series 《龍門雙奕》
*The Longmen Brothers*. The whole land is built of LEGO-like bricks, studs and all.

**Play:** https://ywchen0711.github.io/wulin-world/

## The story

Their father has been framed for the murder of the Alliance chief and thrown in jail. The brothers Yi Rui (a young
swordsman) and Yi Shuo (his little brother, who fights with a football) are on the run. The jade in Yi Shuo's ball is
one of the four **Stratagem Keys**. Behind the great falls in the north, the four keys open the **Stratagem
Pavilion**, where the truth is kept.

## The land (800 × 800 bricks)

| Place | What is there |
|-------|---------------|
| 龍門刀莊 Longmen Manor | sealed by the Law Hall since the night of the murder; the main hall, the guest pavilion |
| 龍門村 Longmen Village | little houses, a well, fields |
| 聽雨樓 the teahouse, crossroads town | Master Bai the storyteller, a market street |
| 竹林 Bamboo Forest | bamboo everywhere, a stone tablet in a clearing |
| 寒江閣 Cold River Pavilion | on an island in the lake, reached by a long jetty; Liu Hanyan |
| 千佛寺 Temple of a Thousand Buddhas | on a hill up a long stair, a pagoda, four bells; Master Kuchan |
| 暴龍崖 Tyrant Dragon Cliff | a red tower of rock with a path cut up its face; Leng Xiaotian on top |
| 黑風寨 Black Wind Fort | a palisade on a hill, watchtowers, the chief's hall |
| 天機瀑布 Stratagem Falls | behind the curtain of water, a jade gate |
| 漁村 Fishing Village | stilt houses with reed roofs, fish-drying racks, a jetty, boats, ducks |
| 悅來客棧 The Yuelai Inn | a two-storey inn on the western road, a stable and its horse; the innkeeper sells buns and wine |
| 斷橋 The Broken Bridge | an arched bridge over the Cold River with a span fallen out of its middle |
| 古戰場 The Old Battlefield | broken walls, toppled pillars, blades in the ground, tattered banners, bandits, chests |
| 雲霧茶園 Tea Terraces | rows of tea climbing the hill north of the town, a pavilion at the top |
| 梅林 Plum Grove | blossoming trees round a pond, a pavilion, cranes |
| 黑風洞 Black Wind Cave | a tunnel into the western hills, a lit hall full of the bandits' loot |

## Playing

- **Two brothers.** Play Yi Rui or Yi Shuo and swap any time (Q); the other follows. Yi Rui runs a little faster,
  Yi Shuo jumps a little higher.
- **Fighting.** Yi Rui slashes and Yi Shuo kicks (J or left click). The specials cost qi (K or right click): Yi
  Rui's 一刀啟程 sends a crescent of sword qi, Yi Shuo's 旋風球 a whirlwind ball that comes back to him. Qi refills
  slowly.
- **Foes.** The Black Wind bandits hold their fort and roam the wilds. Law Hall guards patrol the roads hunting the
  fugitive brothers.
- **Bosses.**
  - 黑熊 Black Bear, the fort's chief, with his club.
  - 冷笑天 Leng Xiaotian on the cliff top, who fights with palm wind.
  - The Masked Man inside the Stratagem Pavilion.
- **Lightness skills** are learnt from the masters, and each opens a new part of the land:
  - **梯雲縱 Cloud Ladder** (a second jump): from Master Kuchan, after you ring the four bells round the temple hill.
  - **水上飄 Skim the Water** (hold jump to glide; run fast and you run on water): from Liu Hanyan, after you drive off
    the disguised assassins.
  - **壁虎遊牆 Gecko on the Wall** (jump into a wall to climb it): the manual in Black Bear's chest.
- **The four keys.**
  - Azure Dragon: you start with it.
  - Black Tortoise: from Master Kuchan.
  - Vermilion Bird: from Liu Hanyan.
  - White Tiger: beat Leng Xiaotian on the cliff top. The path up needs the Cloud Ladder, and the last sheer stretch
    needs Gecko on the Wall.
- **29 manual pages** are hidden on roofs, treetops, the tallest bamboo, cliff ledges and beside the falls. Every five
  gives more health and every ten more qi. Once you have twenty, the rest show on the map.
- **Things to do.**
  - Smash urns and crates for coins, buns (health) and gourds (qi).
  - Open 28 treasure chests (coins, sometimes a manual page).
  - Shop: buns and wine at the inn, candied haws from the pedlar.
  - Ride between the six post stations (驛站) you have visited.
  - Meditate at the eight meditation stones (打坐處) to heal; you wake at the last one if you fall.
  - Hit the training dummies in the manor yard.
  - Beat the village kids at football (three goals in a minute).
  - Find 大嬸's jade hairpin in the plum grove and the pedlar's stolen crate in the Black Wind Cave.
  - Chickens, ducks, deer and cranes live about the land and run from you.
  - Eight secret caves (秘洞) are hidden in hillsides all over the land. Half are sealed by a cracked stone wall that sheds dust as you come near (strike it down); the others sit behind a curtain of vines. Deep inside, on a golden stand, lies a rare thing: ginseng, snow lotus, blood lingzhi and vermilion fruit each give one more heart; the golden elixir, bodhi seed, cold jade marrow and purple essence each give more qi for your special moves. Some caves are guarded.
  - Menus (shops, post stations) can be worked with the arrow keys or W/S, the d-pad or left stick, or the mouse.
- **More.** A day passes in about ten minutes, with dawn, day, dusk and starry nights. Each place has its own ambient
  sound and the music is a plucked zither. There is a map (M). The game saves itself, and there is Chinese and English.
- **Controls:** WASD to move, Space to jump, J or left click to hit, K or right click for the special, E to talk or
  use, Q to swap brothers, M for the map; the mouse turns the camera (click to lock it). Touch: a stick on the left,
  drag on the right to look, and buttons. **Controller:** the left stick or d-pad moves, the right stick looks, A
  jumps (hold to glide), X hits, Y is the special, B talks, LB/RB swap brothers, Start or Back opens the map, and
  the triggers zoom.

## How it is made

| File | What it holds |
|------|---------------|
| `js/voxel.js` | the brick world: one byte a brick, drawn in 32×32 chunks of visible faces with a bevel, studs near you |
| `js/worldgen.js` | the land: terrain, river, lake, cliff, falls, roads, every building, the pages, who stands where |
| `js/game.js` | the game: moving through the bricks, the brothers, combat and foes, bosses, talking, the map, the hours |
| `js/story.js` | everything said, the objectives, the ending |
| `js/music.js` | the zither music, by land |
| `js/cast/`, `js/moves/`, `js/fx.js`, `js/sound.js` | the characters, moves, effects and sounds, shared with Wulin Bricks |
