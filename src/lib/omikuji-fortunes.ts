import type { OmikujiTier } from "./omikuji";

// The 15 fortune slips supplied by the client (5 tiers × 3 variations), shown
// after the draw. Text is Japanese + English as provided; other locales fall
// back to English (see pickFortuneText). NOTE: proofread by the client pending —
// transcribed from "OMIKUJI BOX 15種PDF"; ko/zh translations still to come.
export type FortuneText = { ja: string; en: string };
export type Fortune = {
  poem: FortuneText;
  love: FortuneText;
  money: FortuneText;
  work: FortuneText;
  travel: FortuneText;
  snack: FortuneText;
};

/** English blessing label printed on each tier's slip. */
export const OMIKUJI_LABEL_EN: Record<OmikujiTier, string> = {
  daikichi: "Excellent Luck!!",
  chukichi: "Very Good Luck",
  shokichi: "Good Luck",
  kichi: "Slightly Good Luck",
  suekichi: "Uncertain Luck",
};

export const FORTUNES: Record<OmikujiTier, Fortune[]> = {
  daikichi: [
    {
      poem: {
        ja: "心を素直にし、身もちを正しくすれば、ますます運よろしく、何事も思うままになるでしょう。",
        en: "Honesty and good behavior will bring you even better fortune, and everything will work out as you wish.",
      },
      love: { ja: "思い通り。", en: "Things will go the way you want." },
      money: { ja: "台所に吉運有り。清潔にせよ。", en: "The kitchen is your lucky place. Keep it clean." },
      work: { ja: "おそいが利あり。", en: "Something good will happen in the future." },
      travel: { ja: "全ていい結果となる。", en: "Everything will go well." },
      snack: { ja: "OMIKUJIBOXで一番好きなお菓子。", en: "Your favorite snack in OMIKUJIBOX." },
    },
    {
      poem: {
        ja: "春の盛りの楽しい様に、美しい花が咲き匂う。譲吉の運に向かうでしょう。",
        en: "Your fortune will reach the top, which is pleasant like the spring with beautiful flowers in full bloom.",
      },
      love: { ja: "自慢して嫌われるようなこと有り。慎め。", en: "Bragging can get yourself disliked. Be discreet." },
      money: { ja: "思い切って大きな買い物をするのもよい。", en: "This is good timing to make a big purchase." },
      work: { ja: "利益確実なり。", en: "You will surely make a profit." },
      travel: { ja: "朝立ちは特によし。", en: "Morning departure is especially good." },
      snack: { ja: "緑色のカップ麺。", en: "Cup-type noodles with green-color packaging." },
    },
    {
      poem: {
        ja: "過去の不幸や多くの悩みも消え去り、良いことが起こるでしょう。",
        en: "Unhappiness in the past and your current worries will fade away, and something good will happen.",
      },
      love: { ja: "思うままなり。", en: "Things will go the way you want." },
      money: {
        ja: "人のために使え。後に自分に返ってくる。",
        en: "Spend money for others. What goes around comes around.",
      },
      work: { ja: "希望通りになる。祈れ。", en: "Your wish will come true." },
      travel: { ja: "新しい事、見込み有り。", en: "Something new will happen." },
      snack: { ja: "抹茶（緑色）のチョコレート。", en: "Matcha Chocolates." },
    },
  ],
  chukichi: [
    {
      poem: {
        ja: "心静かに過ごして流れに身を任せれば、全て吉報へ向かうでしょう。",
        en: "Keep calm and just go with the flow, and then everything will be on a good course.",
      },
      love: { ja: "楽しむ程度なら吉。", en: "Things will go well unless you get too serious." },
      money: { ja: "購入したことがない物に幸運がある。", en: "The lucky item is something you have never bought." },
      work: { ja: "扱うて損をせず。", en: "You will not lose anything." },
      travel: { ja: "好日を選べば良し。", en: "Choose a good day to go." },
      snack: { ja: "白色の煎餅。", en: "White rice crackers." },
    },
    {
      poem: {
        ja: "吉深く、嘆き悲しまず身を慎んでおれば、後は万事思いのままになるでしょう。",
        en: "As long as you behave well and do not mourn, everything will go as you wish.",
      },
      love: { ja: "思うだけでは駄目。", en: "You cannot get anything by only thinking." },
      money: {
        ja: "出費が多いが、その分はいる。",
        en: "You will spend a lot, while you will gain the same amount.",
      },
      work: { ja: "売買物、何れも吉。", en: "Both buying and selling are good." },
      travel: { ja: "何れに行くも損なし。", en: "Anywhere is fine." },
      snack: { ja: "ソース味のおかし。", en: "Sauce-flavored snacks." },
    },
    {
      poem: {
        ja: "一度おもい定めたことは、わきめもふらず一心にすると、何事もうまくいくでしょう。",
        en: "Once you decide to do something, devote yourself to achieve it. Then everything will be all right.",
      },
      love: { ja: "お互いを知れ。", en: "You should know each other." },
      money: { ja: "自己投資に益あり。", en: "Self-investment is good." },
      work: { ja: "売買に運あり。", en: "You will have luck with trading." },
      travel: { ja: "楽しい。", en: "Any travel will be enjoyable." },
      snack: { ja: "動物の柄がついたチョコ菓子。", en: "Chocolate snacks with animal patterns." },
    },
  ],
  shokichi: [
    {
      poem: {
        ja: "他所に困る事があっても、自分の家には春風が吹く様です。他人の為に尽くすと良いでしょう。",
        en: "Though there will be some troubles around you, you yourself will be at peace. Something good will happen if you help others.",
      },
      love: {
        ja: "後に至り、思いがけず叶う。気長く思え。",
        en: "Your wish will come true unexpectedly sometime. Wait patiently.",
      },
      money: { ja: "上昇していく。", en: "Your fortune will gradually go up." },
      work: { ja: "名刺を新調すると良し。", en: "New business cards will bring you good luck." },
      travel: { ja: "出発は吉日を選べ。", en: "Choose a good day to go." },
      snack: { ja: "筒状のコーンスナック。", en: "Tube corn snacks." },
    },
    {
      poem: {
        ja: "心を平和にして親類縁者に交われば、争いごともなくなって一家和合するでしょう。",
        en: "If you communicate with your relatives with a peaceful mind, harmony will be brought to your family.",
      },
      love: { ja: "長びけど必ず叶う。", en: "It will take some time, but definitely go well." },
      money: { ja: "貸し借りに注意。", en: "Be careful of lending and borrowing." },
      work: { ja: "上下なし。焦るな。", en: "Nothing will go up or down. Just be patient." },
      travel: { ja: "色事をつつしめ。", en: "You should refrain from love affairs." },
      snack: { ja: "漢字が書いてあるスナック。", en: "Snacks with kanji written on them." },
    },
    {
      poem: {
        ja: "何事にも心静かに、他人とよくよく相談して事をすれば、すべてこころの思うままなるでしょう。",
        en: "Keep calm and talk to others before doing anything, and then everything will go as you wish.",
      },
      love: { ja: "再出発せよ。", en: "Make a fresh start." },
      money: { ja: "交際費は惜しまずに。", en: "Do not spare entertainment expenses." },
      work: { ja: "利あり、損はなし。", en: "You will gain a profit without any loss." },
      travel: { ja: "早くしてよろし。", en: "The earlier, the better." },
      snack: { ja: "チーズ味のお菓子。", en: "Cheese-flavored snacks." },
    },
  ],
  kichi: [
    {
      poem: {
        ja: "苦しき日々も後に幸せに。時期が来るまでは焦らず控えると良いでしょう。",
        en: "Happiness will come after hard days. Wait patiently until the time comes.",
      },
      love: {
        ja: "心和やかに待てば、疑い晴れて思い叶う。",
        en: "If you wait calmly, you will be cleared of suspicion and your wish will come true.",
      },
      money: { ja: "勢いに乗る。", en: "You will catch the momentum." },
      work: { ja: "急ぐと損あり。間をおけ。", en: "You will lose if you rush. Let time pass now." },
      travel: { ja: "盗難に注意せよ。", en: "Beware of theft." },
      snack: { ja: "じゃがいものスナック。", en: "Potato snacks." },
    },
    {
      poem: {
        ja: "旧の道を守って辛抱おこたらなければ、幸福身にあまって家の内も明るく楽しく暮らせるでしょう。",
        en: "Keep traditional manners and be patient, and then you will be happy enough to enjoy your life.",
      },
      love: { ja: "恋敵に注意。", en: "Beware of a love rival." },
      money: { ja: "現状維持を心がけよ。", en: "Keep things as they are." },
      work: { ja: "物の値、上下定まらず。", en: "The prices will be unstable." },
      travel: { ja: "利なし。行かぬが吉。", en: "Nothing good will happen. Do not go anywhere." },
      snack: { ja: "桃色の袋のお菓子。", en: "Snacks with peach-color packaging." },
    },
    {
      poem: {
        ja: "貴方が前を向いて過ごせば、必ず道はひらけるでしょう。",
        en: "As long as you are positive, you will definitely find a way out.",
      },
      love: { ja: "心変わらねば後、必ず調う。", en: "Everything will work out unless you change your mind." },
      money: { ja: "財布を使い分けよ。", en: "Use different wallets depending on your purposes." },
      work: {
        ja: "物の値打ち変動有れど、注意すれば利あり。",
        en: "The value of things will fluctuate, but you can make a profit if you are careful.",
      },
      travel: { ja: "益なし。しばらく待て。", en: "Nothing good will happen. Wait for a while." },
      snack: { ja: "カフェオレ味のビスケット。", en: "Café au lait-flavored cookies." },
    },
  ],
  suekichi: [
    {
      poem: {
        ja: "初めは心配事多いけれど、後になれば何事も望み通り叶う様になり、幸福引き続いてくるでしょう。",
        en: "Though you will have a lot of worries at first, everything will work out and you will be happy later.",
      },
      love: { ja: "迷ったときには静かに心を定めよ。", en: "Make up your mind silently." },
      money: { ja: "購入は控えるべし。", en: "If you hesitate, you should not buy it." },
      work: { ja: "後程、利益多し。", en: "The later it is, the more you will make a profit." },
      travel: { ja: "連れあればなおよし。", en: "Take someone on the trip with you." },
      snack: { ja: "桃色の缶ジュース。", en: "Pink-color canned juice." },
    },
    {
      poem: {
        ja: "本業をよくまもって、静かに時の来るのをまちましょう。すれば開運うたがいないでしょう。",
        en: "Focus on your main business and wait until the right time comes, and then your luck will definitely get better.",
      },
      love: { ja: "焦らずに待て。", en: "Wait patiently." },
      money: { ja: "何でもよく考えて決めるが吉。", en: "Think thoroughly before decision." },
      work: { ja: "落ち着けば利あり。", en: "If you are composed, you can make a profit." },
      travel: { ja: "急ぐべからず。", en: "Do not rush." },
      snack: { ja: "イチゴ味のチョコ菓子。", en: "Strawberry-flavored chocolate snacks." },
    },
    {
      poem: {
        ja: "長い苦しみの時期であれば終わるでしょう。驕らず過ごせば益々良くなるでしょう。",
        en: "If you have been suffering hardship, it will end soon. The situation will get better unless you get arrogant.",
      },
      love: { ja: "浮気心は捨てよ。", en: "Do not be tempted to play around." },
      money: { ja: "大きな入りはない。", en: "You will not get any big income." },
      work: { ja: "騒げば損あり。", en: "You will lose if you make a fuss." },
      travel: { ja: "十分ならず。急ぐな。", en: "This is not the right time. Do not rush." },
      snack: { ja: "ラムネ。", en: "Ramune soda fizzy candy." },
    },
  ],
};

/** Japanese for ja guests; English for everyone else (ko/zh pending). */
export function pickFortuneText(text: FortuneText, locale: string): string {
  return locale === "ja" ? text.ja : text.en;
}
