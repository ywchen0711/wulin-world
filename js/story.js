// What people say, and what you are doing. Each speaker's lines depend on how far you have come (the save S):
//   S.keys {qing, zhu, bai, xuan}, S.skills {double, glide, climb}, S.flags {...}, S.pages (count)
// talk(id, S) -> [{ who, zh, en }]; and what happens after (then: a function of the game, by name)
export const KEYS = [
  { id: 'qing', zh: '青龍鑰', en: 'Azure Dragon Key', color: '#3ab08a' }, { id: 'zhu', zh: '朱雀鑰', en: 'Vermilion Bird Key', color: '#e04a3a' },
  { id: 'bai', zh: '白虎鑰', en: 'White Tiger Key', color: '#e8e8f0' }, { id: 'xuan', zh: '玄武鑰', en: 'Black Tortoise Key', color: '#4a5a8a' },
];
export const SKILLS = {
  double: { zh: '梯雲縱', en: 'Cloud Ladder', how: { zh: '空中再按一次跳，再跳一次', en: 'Press jump again in mid-air for a second jump' } },
  glide: { zh: '水上飄', en: 'Skim the Water', how: { zh: '空中按住跳，緩緩飄下；快跑時能在水面上奔跑', en: 'Hold jump in the air to drift down; run fast enough and you run on water' } },
  climb: { zh: '壁虎遊牆', en: 'Gecko on the Wall', how: { zh: '在空中撞上牆壁就能往上爬（爬太久會沒力）', en: 'Jump into a wall to climb it (you tire if you climb too long)' } },
};
const L = (who, zh, en) => ({ who, zh, en });
export function objective(S) {
  const k = S.keys, sk = S.skills, n = Object.values(k).filter(Boolean).length;
  if (!S.flags.metBai) return { zh: '到東北方十字街的聽雨樓，找說書的白先生', en: 'Find Master Bai, the storyteller, at the Listening-to-Rain teahouse in the crossroads town to the north-east' };
  if (S.flags.won) return { zh: '天機閣已開。自由探索，收集所有秘笈殘頁', en: 'The Stratagem Pavilion is open. Roam freely and find every manual page' };
  if (n === 4) return { zh: '四鑰已齊！到北方天機瀑布後的天機閣', en: 'All four keys! Go to the Stratagem Pavilion behind the falls in the north' };
  const todo = [];
  if (!k.xuan) todo.push(S.flags.bells ? { zh: '回千佛寺見苦禪大師', en: 'Return to Master Kuchan at the temple' } : { zh: '千佛寺（西北）：敲響山上的四口鐘', en: 'Temple (north-west): ring the four bells on the hill' });
  if (!k.zhu) todo.push({ zh: '寒江閣（東南湖心）：見柳寒煙', en: 'Cold River Pavilion (lake, south-east): meet Liu Hanyan' });
  if (!sk.climb) todo.push({ zh: '黑風寨（西南）：打敗寨主黑熊，奪回秘笈', en: 'Black Wind Fort (south-west): defeat Black Bear and take the manual' });
  if (!k.bai) todo.push(sk.double && sk.climb ? { zh: '暴龍崖（東北）：登頂見冷笑天', en: 'Tyrant Dragon Cliff (north-east): climb to the top and face Leng Xiaotian' } : { zh: '暴龍崖（東北）：要先學會梯雲縱和壁虎遊牆才上得去', en: 'Tyrant Dragon Cliff (north-east): you need Cloud Ladder and Gecko on the Wall to climb it' });
  return todo[0] ? { zh: todo.map((t) => t.zh).join('　／　'), en: todo.map((t) => t.en).join('  /  ') } : { zh: '', en: '' };
}
export function talk(id, S, G) {
  const k = S.keys, sk = S.skills, f = S.flags;
  switch (id) {
    case 'monkey':
      if (!f.metMonkey) return { lines: [
        L('monkey', '兩位少俠！是我，瘦猴！上回你們給我包子吃，我瘦猴記一輩子。', 'Young masters! It’s me, Skinny Monkey! You gave me a bun once; I’ll remember it all my life.'),
        L('monkey', '你們的爹被關起來了，外頭到處是執法堂的人在抓你們——走大路要小心。', 'Your father’s been locked up, and the Law Hall’s everywhere looking for you. Careful on the roads.'),
        L('shuo', '哥，球裡那片刻著青龍的玉……一定跟爹有關。', 'Brother, that jade with the green dragon from the ball… it has to be about father.'),
        L('monkey', '刻青龍的玉？那是天機鑰啊！江湖上什麼都知道的，只有聽雨樓的白先生。往東北，十字街那頭就是。', 'A jade with a dragon? That’s a Stratagem Key! The only one who knows everything is Master Bai at the Listening-to-Rain. North-east, at the crossroads.'),
        L('monkey', '對了，路上撿到寫著字的紙頁，就是秘笈殘頁，收起來，越多越厲害！', 'Oh, and pages with writing on them are bits of martial manuals. Collect them; the more, the stronger you get!'),
      ], then: (G) => { f.metMonkey = true; } };
      return { lines: [L('monkey', ['聽說黑風寨的黑熊搶了一本輕功秘笈，藏在寨子裡。', '暴龍崖上那個冷笑天啊……聽到他笑，腿就軟了。', '秘笈殘頁每收五張，你們的身子就更硬朗。'][Math.floor(G.clock / 7) % 3], ['They say Black Bear of the Black Wind stole a lightness manual and keeps it in his fort.', 'That Leng Xiaotian on the cliff… hear him laugh and your knees go weak.', 'Every five manual pages, you get tougher.'][Math.floor(G.clock / 7) % 3])] };
    case 'bai':
      if (!f.metBai) return { lines: [
        L('bai', '喲，兩位小龍來了。醒木一拍——天機閣的故事，今兒說給你們聽。', 'Ah, the two little dragons. One clap of the block: today I tell you of the Stratagem Pavilion.'),
        L('bai', '天機閣藏在北方瀑布之後，閣門要四片天機鑰才開。閣裡的《天機錄》，記著江湖每一樁不可告人的事。', 'It hides behind the falls in the north, and its door needs four Stratagem Keys. Inside, the Record of Heaven’s Secrets holds every deed the rivers and lakes would hide.'),
        L('bai', '青龍鑰，你們已經有了。玄武鑰在西北千佛寺的苦禪大師手上；朱雀鑰在東南湖心寒江閣，柳寒煙守著。', 'The Azure Dragon you have. The Black Tortoise is with Master Kuchan at the temple in the north-west; the Vermilion Bird with Liu Hanyan at the Cold River Pavilion, on the lake in the south-east.'),
        L('bai', '白虎鑰嘛……在東北暴龍崖頂，冷笑天那裡。那崖，沒有輕功是上不去的。', 'And the White Tiger… atop the Tyrant Dragon Cliff in the north-east, with Leng Xiaotian. Without lightness skill, no one climbs that cliff.'),
        L('rui', '誰殺了盟主，閣裡會有答案？', 'And the Pavilion will tell us who killed the chief?'),
        L('bai', '答案嘛……總比你們猜的多一層。去吧，我等著聽你們的故事。', 'The answer… is always one layer deeper than you guess. Go. I look forward to hearing your story.'),
      ], then: () => { f.metBai = true; } };
      return { lines: [L('bai', ['西北千佛寺，苦禪大師最愛聽鐘聲。', '寒江閣的柳寒煙，不輕易信人。', '黑風寨的黑熊搶了一本秘笈，叫做壁虎遊牆。', '天機閣門前，四鑰缺一不可。'][Math.floor(G.clock / 6) % 4], ['Master Kuchan of the temple loves the sound of bells.', 'Liu Hanyan of the Cold River trusts no one easily.', 'Black Bear stole a manual called Gecko on the Wall.', 'At the Pavilion’s door, not one key may be missing.'][Math.floor(G.clock / 6) % 4])] };
    case 'kuchan':
      if (k.xuan) return { lines: [L('kuchan', '阿彌陀佛。梯雲縱，心輕則身輕。', 'Amituofo. Cloud Ladder: light of heart, light of body.')] };
      if (G.bellsRung() < 4) return { lines: [
        L('kuchan', '阿彌陀佛。兩位施主，要玄武鑰？', 'Amituofo. You seek the Black Tortoise Key?'),
        L('kuchan', '寺外四方各有一口鐘，已經多年無人敲響。去敲響它們——鐘聲齊了，老衲自然明白你們的心。', 'On the four sides of the hill hang four bells no one has rung in years. Ring them; when all four have sounded, I will know your hearts.'),
      ], then: () => { f.askedBells = true; } };
      return { lines: [
        L('kuchan', '四方鐘鳴，心誠則靈。這片玄武鑰，交給你們。', 'The four bells have rung; a sincere heart is heard. The Black Tortoise Key is yours.'),
        L('kuchan', '老衲再傳你們一門輕功——梯雲縱：身在半空，再借一口氣，便能再起一步。', 'And a lightness skill besides: the Cloud Ladder. In mid-air, take one more breath, and rise one step more.'),
      ], then: (G) => { k.xuan = true; sk.double = true; G.gain('xuan'); G.learn('double'); } };
    case 'liu':
      if (k.zhu) return { lines: [L('liu', '水上飄：心若浮萍，腳下便是路。', 'Skim the Water: let your heart float like duckweed, and the water is a road.')] };
      if (!f.liuEvent) return { lines: [
        L('liu', '奕長風的兒子？……朱雀鑰，不是誰來要，我就會給。', 'Yi Changfeng’s sons? The Vermilion Bird Key is not given to whoever asks.'),
        L('liu', '——等等，有人來了。是衝著鑰匙來的。', '— Wait. Someone’s coming. They are here for the key.'),
      ], then: (G) => { f.liuEvent = true; G.ambush(); } };
      if (G.ambushLeft() > 0) return { lines: [L('liu', '先把他們打退再說！', 'Drive them back first!')] };
      return { lines: [
        L('liu', '他們戴著別人的臉……是易容刺客。你們替我擋下了他們。', 'They wore other men’s faces: assassins in disguise. You held them off for me.'),
        L('liu', '朱雀鑰，給你們。再教你們寒江閣的水上飄：空中按住氣，緩緩飄落；腳夠快，水面也能踏。', 'The Vermilion Bird Key is yours. And the Cold River’s Skim the Water: hold your breath in the air and drift; with fast enough feet, you can run on water.'),
      ], then: (G) => { k.zhu = true; sk.glide = true; G.gain('zhu'); G.learn('glide'); } };
    case 'xiaotian':
      if (!f.xiaoMet) return { lines: [
        L('xiaotian', '哈、哈、哈……能爬上暴龍崖的人，十年來你們是第一對。', 'Ha, ha, ha… In ten years, you are the first to climb the Tyrant Dragon Cliff.'),
        L('xiaotian', '白虎鑰？拿得走，就是你們的。', 'The White Tiger Key? Take it from me, and it is yours.'),
      ], then: (G) => { f.xiaoMet = true; G.duel('xiaotian'); } };
      return { lines: [L('xiaotian', '……好。龍門的刀，果然不是左手刀。白虎鑰，拿去。', '…Good. The Longmen blade is no left-handed blade after all. Take the White Tiger Key.')], then: (G) => { if (!k.bai) { k.bai = true; G.gain('bai'); } } };
    case 'abo': return { lines: [L('abo', ['唉，龍門刀莊被封了，貼滿了執法堂的封條。', '小兄弟，躲著點執法堂的人。', '村北的路通到十字街，往西是竹林。'][Math.floor(G.clock / 6) % 3], ['Alas, the Longmen Manor is sealed, covered in Law Hall strips.', 'Lads, keep away from the Law Hall men.', 'The road north goes to the crossroads; west is the bamboo forest.'][Math.floor(G.clock / 6) % 3])] };
    case 'dashen': return { lines: [L('dashen', ['聽雨樓的白先生啊，天下事沒有他不知道的。', '寒江上的閣主，劍法冷得跟冰一樣。'][Math.floor(G.clock / 6) % 2], ['Master Bai at the teahouse: there’s nothing he doesn’t know.', 'The mistress on the Cold River: her swordplay is cold as ice.'][Math.floor(G.clock / 6) % 2])] };
    case 'xiaofan': return { lines: [L('xiaofan', ['糖葫蘆！不要錢，給兩位少俠的！', '聽說北邊瀑布後面，有一扇玉做的門。'][Math.floor(G.clock / 6) % 2], ['Candied haws! Free, for you two!', 'They say behind the falls in the north there’s a door made of jade.'][Math.floor(G.clock / 6) % 2])] };
    case 'chest': return { lines: [L('rui', '黑熊藏的秘笈……「壁虎遊牆」！', 'The manual Black Bear hid… “Gecko on the Wall”!')], then: (G) => { sk.climb = true; G.learn('climb'); } };
    case 'gate':
      if (Object.values(k).filter(Boolean).length < 4) return { lines: [L('rui', `玉門上有四個鎖孔……還缺${4 - Object.values(k).filter(Boolean).length}片鑰匙。`, `Four keyholes in the jade door… we are ${4 - Object.values(k).filter(Boolean).length} key(s) short.`)] };
      if (!f.gateOpen) return { lines: [L('shuo', '四片鑰匙……一起插進去！', 'All four keys… in together!')], then: (G) => { f.gateOpen = true; G.openGate(); } };
      return { lines: [] };
    case 'masked':
      if (!f.maskedMet) return { lines: [
        L('masked', '奕長風的兩個兒子……來得比我算的，早了一步。', 'Yi Changfeng’s two sons… one step earlier than I reckoned.'),
        L('rui', '你是誰？殺盟主的，是不是你？', 'Who are you? Was it you who killed the chief?'),
        L('masked', '江湖本是一盤棋。棋子，不必知道下棋的人是誰。', 'The rivers and lakes are a game of chess. A piece need not know who moves it.'),
      ], then: (G) => { f.maskedMet = true; G.duel('masked'); } };
      return { lines: [] };
    default: return { lines: [] };
  }
}
export const ENDING = {
  zh: ['蒙面人化作一陣煙，留下半卷《天機策》。', '卷末寫著一行字：「雙奕出，天機變。」', '真相，總比猜測多一層——', '《龍門雙奕》第一季・待續'],
  en: ['The masked man vanishes in a puff of smoke, leaving half a scroll of the Stratagem behind.', 'At its end, one line: “When the two Yi come forth, heaven’s plan will change.”', 'The truth is always one layer deeper than the guess.', 'The Longmen Brothers · to be continued'],
};
