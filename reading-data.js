/* Reading wing content: graphemes, routes, words, heart words, books.
   Pure data, shared by the app and the regression tests. Every practice word,
   book sentence and "readable" Pokémon name is checked by tests/reading-content
   to decode with only the sounds taught up to its route. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PokeReadingData=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

/* [ spoken approximation, keyword, picture, class ]
   A grown-up recording always wins over the speech engine, which cannot say a
   clean /b/ without adding "uh". */
const G={
  s:['sss','sun','☀️','cons'],      a:['ah','ant','🐜','vowel'],
  t:['tuh','tap','🚰','cons'],      p:['puh','pin','📌','cons'],
  i:['ih','in','📥','vowel'],       n:['nnn','net','🥅','cons'],
  m:['mmm','map','🗺️','cons'],      d:['duh','dog','🐕','cons'],
  g:['guh','gate','🚧','cons'],     o:['awe','otter','🦦','vowel'],
  c:['kuh','cat','🐱','cons'],      k:['kuh','kit','🧰','cons'],
  ck:['kuh','sock','🧦','team'],    e:['eh','egg','🥚','vowel'],
  u:['uh','up','⬆️','vowel'],       r:['rrr','rug','🧶','cons'],
  h:['huh','hat','🎩','cons'],      b:['buh','bed','🛏️','cons'],
  f:['fff','fan','🪭','cons'],      l:['lll','leg','🦵','cons'],
  j:['juh','jam','🍯','cons'],      v:['vvv','van','🚐','cons'],
  w:['wuh','web','🕸️','cons'],      x:['ks','box','📦','cons'],
  y:['yuh','yes','👍','cons'],      z:['zzz','zip','🤐','cons'],
  qu:['kwuh','queen','👑','team'],
  ll:['lll','bell','🔔','team'],    ss:['sss','mess','😅','team'],
  ff:['fff','huff','😤','team'],    zz:['zzz','buzz','🐝','team'],
  sh:['shhh','ship','🚢','team'],   ch:['chuh','chip','🍟','team'],
  th:['thuh','thin','🪡','team'],   ng:['ng','ring','💍','team'],
  ai:['ay','rain','🌧️','team'],     ee:['ee','tree','🌳','team'],
  oa:['oh','goat','🐐','team'],     oo:['oo','moon','🌙','team'],
  ar:['ar','star','⭐','team'],     or:['or','fork','🍴','team'],
  ow:['ow','cow','🐄','team'],      oi:['oy','coin','🪙','team'],
  er:['er','ladder','🪜','team'],   ir:['er','bird','🐦','team'],
  ur:['er','nurse','👩‍⚕️','team'],   ea:['ee','sea','🌊','team'],
  a_e:['ay','cake','🍰','team'],    i_e:['eye','bike','🚲','team'],
  o_e:['oh','bone','🦴','team'],    u_e:['yoo','cube','🧊','team'],
  igh:['eye','night','🌃','team'],  ear:['ear','ear','👂','team'],
  air:['air','hair','💇','team'],   ay:['ay','play','🛝','team'],
  ou:['ow','cloud','☁️','team'],    ie:['eye','pie','🥧','team'],
  oy:['oy','toy','🧸','team'],      ue:['oo','blue','💙','team'],
  aw:['or','saw','🪚','team'],      ew:['yoo','new','🆕','team'],
  wh:['wuh','whale','🐳','team'],   ph:['fff','phone','📱','team'],
  ing:['ing','sing','🎤','end'],    ed:['d','jumped','🤸','end']
};
const LONG={a:'ay',e:'ee',i:'eye',o:'oh',u:'yoo'};
const VOWELS='aeiou';
/* Longest first, so "igh" wins over "i" and "ear" over "ea". */
const MULTI=['igh','ear','air','qu','ck','sh','ch','th','ng','ai','ee','oa','oo','ar','or','ow','oi','ea','er','ir','ur','ll','ss','ff','zz','ay','ou','ie','oy','ue','aw','ew','wh','ph'];

/* Only words listed here can appear as a picture answer. */
const ART={
  pin:'📌',pan:'🍳',tin:'🥫',tap:'🚰',nap:'😴',sit:'🪑',spin:'🌀',pit:'🕳️',
  map:'🗺️',mop:'🧹',dog:'🐕',pot:'🍲',dot:'🔴',dig:'⛏️',mat:'🟫',mad:'😠',top:'🔝',pod:'🫛',
  cat:'🐱',cup:'☕',duck:'🦆',sock:'🧦',sun:'☀️',net:'🥅',ten:'🔟',pen:'🖊️',nut:'🥜',
  rug:'🧶',red:'🟥',kit:'🧰',cut:'✂️',rock:'🪨',run:'🏃',
  hat:'🎩',hen:'🐔',bed:'🛏️',bus:'🚌',leg:'🦵',bell:'🔔',fan:'🪭',log:'🪵',hug:'🤗',
  lip:'👄',bat:'🦇',fun:'🥳',doll:'🪆',
  jam:'🍯',van:'🚐',fox:'🦊',box:'📦',six:'6️⃣',jet:'✈️',web:'🕸️',wig:'💇',zip:'🤐',
  jug:'🫙',yes:'👍',wax:'🕯️',
  cap:'🧢',bug:'🐛',pig:'🐷',bee:'🐝',snail:'🐌',nail:'💅',lock:'🔒',bread:'🍞',brain:'🧠',cart:'🛒',
  ship:'🚢',fish:'🐟',chip:'🍟',ring:'💍',king:'🤴',shell:'🐚',shop:'🏪',chin:'😃',
  bath:'🛁',sing:'🎤',dish:'🍽️',moth:'🦋',chick:'🐤',
  frog:'🐸',flag:'🚩',drum:'🥁',hand:'✋',milk:'🥛',tent:'⛺',jump:'🤸',nest:'🪺',
  lamp:'💡',crab:'🦀',sled:'🛷',stop:'🛑',clock:'🕐',plant:'🌱',grass:'🌿',
  rain:'🌧️',tree:'🌳',goat:'🐐',boat:'🚤',feet:'🦶',sheep:'🐑',sail:'⛵',coat:'🧥',
  road:'🛣️',soap:'🧼',train:'🚂',seed:'🌰',queen:'👑',toad:'🐸',
  moon:'🌙',book:'📖',star:'⭐',car:'🚗',corn:'🌽',fork:'🍴',farm:'🚜',arm:'💪',
  food:'🍔',horn:'📯',barn:'🏚️',spoon:'🥄',shark:'🦈',foot:'🦶',
  cake:'🍰',bike:'🚲',kite:'🪁',snake:'🐍',five:'5️⃣',gate:'🚧',lake:'🏞️',time:'⏰',
  plate:'🍽️',cave:'🕳️',smile:'😀',flame:'🔥',
  home:'🏠',bone:'🦴',rose:'🌹',nose:'👃',sea:'🌊',beach:'🏖️',note:'🎵',stone:'🪨',
  cube:'🧊',tube:'🧪',meat:'🥩',leaf:'🍃',seal:'🦭',globe:'🌍',
  cow:'🐄',owl:'🦉',coin:'🪙',crown:'👑',bird:'🐦',girl:'👧',down:'⬇️',soil:'🪴',
  shirt:'👕',burn:'🔥',boil:'♨️',clown:'🤡',
  night:'🌃',light:'🔦',ear:'👂',beard:'🧔',hair:'💇‍♀️',chair:'🪑',fight:'🥊',
  day:'🌞',play:'🛝',hay:'🌾',cloud:'☁️',couch:'🛋️',pie:'🥧',tie:'👔',toy:'🧸',boy:'👦',
  blue:'💙',saw:'🪚',straw:'🥤',screw:'🔩',whale:'🐳',phone:'📱',paw:'🐾',
  cats:'🐱🐱',ducks:'🦆🦆',hats:'🎩🎩',bells:'🔔🔔',socks:'🧦🧦',fishing:'🎣',
  sunset:'🌅',rocket:'🚀',picnic:'🧺',rabbit:'🐇',popcorn:'🍿',pumpkin:'🎃',
  hotdog:'🌭',laptop:'💻',teapot:'🫖',cobweb:'🕸️',desktop:'🖥️',kitten:'🐈',starfish:'⭐'
};

/* Routes. "add" = new sounds taught here; heart words mark the letters that do
   not play fair (i = start, n = length). Words may use "+" for an ending
   (jump+ed) and "·" for a syllable break (sun·set); both are display-only. */
const ROUTES=[
{n:1,name:'Pallet Path',colour:'#F7D02C',add:['s','a','t','p','i','n'],
 heart:[{w:'I',i:0,n:1},{w:'a',i:0,n:1},{w:'the',i:2,n:1}],
 blend:['pin','pan','tin','tap','nap','sit'],build:['sat','tip','pat','nip','pit','pin'],
 mons:[{id:25,name:'Pikachu',read:false}],
 book:{title:'Pikachu Naps',pages:[{t:'Pikachu sat.',m:25},{t:'Pikachu sat in a tin.',a:'🥫'},{t:'Tip. Tap. Tip. Tap.',a:'🌧️'},{t:'A pin!',a:'📌'},{t:'Pikachu spins.',a:'🌀'},{t:'Pikachu naps in the tin.',m:25}],
  quiz:[{q:'Where did Pikachu nap?',a:0,o:[{e:'🥫',t:'in a tin'},{e:'🍳',t:'in a pan'},{e:'📦',t:'in a box'}]}]}},
{n:2,name:'Dig Site',colour:'#E2BF65',add:['m','d','g','o'],
 heart:[{w:'is',i:1,n:1},{w:'to',i:1,n:1},{w:'go',i:1,n:1}],
 blend:['map','mop','dog','pot','dot','dig'],build:['mat','top','mad','pod','nod','gap'],
 mons:[{id:50,name:'Diglett',read:false}],
 book:{title:'Diglett Digs',pages:[{t:'Diglett digs.',m:50},{t:'Diglett digs a pit.',a:'🕳️'},{t:'It is a top pit!',a:'👍'},{t:'Pikachu sat in it.',m:25},{t:'Diglett digs and digs.',m:50},{t:'Pikachu naps in the pit.',a:'😴'}],
  quiz:[{q:'What did Diglett dig?',a:0,o:[{e:'🕳️',t:'a pit'},{e:'🌳',t:'a tree'},{e:'🚗',t:'a car'}]},{q:'Who sat in the pit?',a:1,o:[{m:50,t:'Diglett'},{m:25,t:'Pikachu'},{m:89,t:'Muk'}]}]}},
{n:3,name:'Muddy Marsh',colour:'#A33EA1',add:['c','k','ck','e','u','r'],
 heart:[{w:'he',i:1,n:1},{w:'we',i:1,n:1},{w:'me',i:1,n:1},{w:'of',i:1,n:1},{w:'no',i:1,n:1},{w:'so',i:1,n:1}],
 blend:['cat','cup','duck','sock','sun','net'],build:['red','ten','rug','nut','kit','cut'],
 mons:[{id:89,name:'Muk',read:true},{id:23,name:'Ekans',read:true}],
 book:{title:'Muk in the Mud',pages:[{t:'Muk is in the mud.',m:89},{t:'Ekans is up on a rock.',m:23},{t:'A duck ran at Muk.',a:'🦆'},{t:'Muk got up.',m:89},{t:'The duck ran and ran!',a:'🏃'},{t:'Muk and Ekans sat in the sun.',a:'☀️'}],
  quiz:[{q:'Where is Ekans?',a:0,o:[{e:'🪨',t:'on a rock'},{e:'🚐',t:'in a van'},{e:'🥫',t:'in a tin'}]},{q:'What ran at Muk?',a:1,o:[{e:'🐕',t:'a dog'},{e:'🦆',t:'a duck'},{e:'🐱',t:'a cat'}]}]}},
{n:4,name:'Bat Cavern',colour:'#7B4FA8',add:['h','b','f','l','ll','ss','ff','zz'],
 heart:[{w:'was',i:1,n:2},{w:'my',i:1,n:1},{w:'you',i:1,n:2}],
 blend:['hat','hen','bed','bus','leg','bell'],build:['fan','log','hug','lip','bat','fun'],
 mons:[{id:42,name:'Golbat',read:true}],
 book:{title:'Golbat and the Bell',pages:[{t:'Golbat is in a hut.',m:42},{t:'A big bell fell!',a:'🔔'},{t:'Golbat is mad.',a:'😠'},{t:'It huffs and puffs.',a:'😤'},{t:'Muk hid in the mud.',m:89},{t:'It was a big mess. Golbat had fun.',a:'😅'}],
  quiz:[{q:'What fell?',a:0,o:[{e:'🔔',t:'a bell'},{e:'📦',t:'a box'},{e:'⭐',t:'a star'}]},{q:'Who hid in the mud?',a:2,o:[{m:42,t:'Golbat'},{m:25,t:'Pikachu'},{m:89,t:'Muk'}]}]}},
{n:5,name:'Zubat Tunnel',colour:'#5D6BC4',add:['j','v','w','x','y','z','qu'],
 heart:[{w:'said',i:1,n:2},{w:'are',i:1,n:2},{w:'they',i:2,n:2}],
 blend:['jam','van','fox','box','six','jet'],build:['web','wig','zip','jug','yes','wax'],
 mons:[{id:41,name:'Zubat',read:true},{id:95,name:'Onix',read:true},{id:63,name:'Abra',read:true},{id:193,name:'Yanma',read:true}],
 book:{title:'Zubat and Onix',pages:[{t:'Zubat is in a van.',m:41},{t:'Onix is a big rock.',m:95},{t:'Abra had a jug of jam.',m:63},{t:'"Yum!" said Zubat.',a:'😋'},{t:'Zubat zips up to Onix.',a:'💨'},{t:'They had jam. Yanma had six!',m:193}],
  quiz:[{q:'What did Abra have?',a:0,o:[{e:'🍯',t:'jam'},{e:'🥚',t:'an egg'},{e:'🧦',t:'a sock'}]},{q:'Who is a big rock?',a:1,o:[{m:41,t:'Zubat'},{m:95,t:'Onix'},{m:63,t:'Abra'}]}]}},
{n:6,name:'Chop Dojo',colour:'#C22E28',add:['sh','ch','th','ng'],
 heart:[{w:'she',i:2,n:1},{w:'be',i:1,n:1},{w:'all',i:0,n:1}],
 blend:['ship','fish','chip','ring','king','shell'],build:['shop','chin','bath','sing','dish','moth'],
 mons:[{id:66,name:'Machop',read:true},{id:403,name:'Shinx',read:true}],
 book:{title:'Machop and the Ship',pages:[{t:'Machop has a ship.',m:66},{t:'Shinx is on the ship.',m:403},{t:'A fish is in the ship!',a:'🐟'},{t:'Machop can chop.',a:'✋'},{t:'Shinx sang a long song.',a:'🎤'},{t:'All the fish sang. She can sing!',a:'🐟'}],
  quiz:[{q:'Who has a ship?',a:0,o:[{m:66,t:'Machop'},{m:403,t:'Shinx'},{m:89,t:'Muk'}]},{q:'What is in the ship?',a:2,o:[{e:'🐄',t:'a cow'},{e:'🚗',t:'a car'},{e:'🐟',t:'a fish'}]}]}},
{n:7,name:'Bug Woods',colour:'#A6B91A',add:[],
 heart:[{w:'have',i:3,n:1},{w:'like',i:3,n:1},{w:'some',i:1,n:1}],
 blend:['frog','flag','drum','hand','milk','tent'],build:['jump','nest','lamp','crab','sled','stop'],
 mons:[{id:28,name:'Sandslash',read:true},{id:328,name:'Trapinch',read:true},{id:167,name:'Spinarak',read:false},{id:599,name:'Klink',read:true}],
 book:{title:'The Bug Woods Band',pages:[{t:'Sandslash has a drum.',m:28},{t:'Klink can clang.',m:599},{t:'Spinarak spins a web.',m:167},{t:'Trapinch stands on a stump.',m:328},{t:'Bang! Clang! Thump!',a:'💥'},{t:'"I like this band!" said Spinarak.',a:'🥁'}],
  quiz:[{q:'Who has a drum?',a:0,o:[{m:28,t:'Sandslash'},{m:599,t:'Klink'},{m:328,t:'Trapinch'}]},{q:'What did Spinarak spin?',a:1,o:[{e:'🧶',t:'a rug'},{e:'🕸️',t:'a web'},{e:'🌀',t:'a spin'}]}]}},
{n:8,name:'Rain Coast',colour:'#6390F0',add:['ai','ee','oa'],
 heart:[{w:'come',i:1,n:1},{w:'one',i:0,n:2},{w:'there',i:2,n:3}],
 blend:['rain','tree','goat','boat','feet','sheep'],build:['sail','coat','road','soap','train','seed'],
 mons:[{id:86,name:'Seel',read:true},{id:118,name:'Goldeen',read:true},{id:70,name:'Weepinbell',read:true},{id:349,name:'Feebas',read:true}],
 book:{title:'Seel and the Rain',pages:[{t:'Seel sat in the rain.',m:86},{t:'Goldeen is in the deep.',m:118},{t:'"Come and see!" said Seel.',a:'👀'},{t:'Feebas went up the road.',m:349},{t:'Weepinbell is in a green tree.',m:70},{t:'There they all sat in the rain.',a:'🌧️'}],
  quiz:[{q:'Where did Seel sit?',a:0,o:[{e:'🌧️',t:'in the rain'},{e:'☀️',t:'in the sun'},{e:'🚤',t:'in a boat'}]},{q:'Where is Weepinbell?',a:2,o:[{e:'🛣️',t:'on the road'},{e:'🌊',t:'in the sea'},{e:'🌳',t:'in a tree'}]}]}},
{n:9,name:'Sunset Farm',colour:'#B6A136',add:['oo','ar','or'],
 heart:[{w:'were',i:1,n:3},{w:'do',i:1,n:1},{w:'out',i:1,n:2},{w:'into',i:3,n:1}],
 blend:['moon','book','star','car','corn','fork'],build:['farm','arm','food','horn','barn','spoon'],
 mons:[{id:129,name:'Magikarp',read:true},{id:143,name:'Snorlax',read:true},{id:72,name:'Tentacool',read:true},{id:100,name:'Voltorb',read:true},{id:255,name:'Torchic',read:true},{id:183,name:'Marill',read:true}],
 book:{title:'Stars on the Farm',pages:[{t:'Snorlax went to the farm.',m:143},{t:'Magikarp was in the pool.',m:129},{t:'Torchic had corn for all.',m:255},{t:'Soon it was dark.',a:'🌙'},{t:'The moon was out. The stars were out.',a:'✨'},{t:'Snorlax had a good, long nap.',m:143}],
  quiz:[{q:'Where was Magikarp?',a:1,o:[{e:'🚜',t:'on the farm'},{e:'🏊',t:'in the pool'},{e:'🚗',t:'in a car'}]},{q:'What did Torchic have?',a:0,o:[{e:'🌽',t:'corn'},{e:'🥄',t:'a spoon'},{e:'⭐',t:'a star'}]}]}},
{n:10,name:'Flame Ridge',colour:'#EE8130',magicE:true,add:['a_e','i_e'],
 heart:[{w:'what',i:0,n:2},{w:'who',i:0,n:3},{w:'when',i:0,n:2}],
 blend:['cake','bike','kite','snake','five','gate'],build:['lake','time','plate','cave','smile','flame'],
 mons:[{id:59,name:'Arcanine',read:true},{id:37,name:'Vulpix',read:true},{id:68,name:'Machamp',read:true}],
 book:{title:'Arcanine and the Cake',pages:[{t:'Vulpix made a cake.',m:37},{t:'It was by the lake.',a:'🏞️'},{t:'Arcanine came for a bite.',m:59},{t:'"Who ate my cake?" said Vulpix.',a:'😲'},{t:'Machamp had a big smile.',m:68},{t:'"What a fine cake!" he said.',a:'🍰'}],
  quiz:[{q:'What did Vulpix make?',a:0,o:[{e:'🍰',t:'a cake'},{e:'🪁',t:'a kite'},{e:'🚲',t:'a bike'}]},{q:'Who had a big smile?',a:2,o:[{m:37,t:'Vulpix'},{m:59,t:'Arcanine'},{m:68,t:'Machamp'}]}]}},
{n:11,name:'Deep Reef',colour:'#3E8FB0',magicE:true,add:['o_e','u_e','ea'],
 heart:[{w:'your',i:1,n:3},{w:'little',i:3,n:3},{w:'from',i:2,n:1}],
 blend:['home','bone','rose','nose','sea','beach'],build:['note','stone','cube','tube','meat','leaf'],
 mons:[{id:117,name:'Seadra',read:true},{id:335,name:'Zangoose',read:true},{id:498,name:'Tepig',read:true},{id:104,name:'Cubone',read:false}],
 book:{title:'A Note from the Sea',pages:[{t:'Cubone sat by the sea.',m:104},{t:'A little note came from the sea.',a:'📜'},{t:'It was in a tube.',a:'🧪'},{t:'"Eat this!" said the note.',a:'🥩'},{t:'Seadra had meat and a leaf.',m:117},{t:'Zangoose and Tepig went home.',m:335}],
  quiz:[{q:'Where did Cubone sit?',a:0,o:[{e:'🌊',t:'by the sea'},{e:'🏞️',t:'by a lake'},{e:'🚲',t:'on a bike'}]},{q:'What was the note in?',a:1,o:[{e:'📦',t:'a box'},{e:'🧪',t:'a tube'},{e:'🧦',t:'a sock'}]}]}},
{n:12,name:'Coin Hollow',colour:'#8E5BB5',magicE:true,add:['ow','oi','er','ir','ur'],
 heart:[{w:'because',i:3,n:4},{w:'people',i:2,n:4},{w:'would',i:1,n:3}],
 blend:['cow','owl','coin','crown','bird','girl'],build:['down','soil','shirt','burn','boil','clown'],
 mons:[{id:58,name:'Growlithe',read:true},{id:684,name:'Swirlix',read:true},{id:90,name:'Shellder',read:true},{id:194,name:'Wooper',read:true},{id:52,name:'Meowth',read:false}],
 book:{title:'The Coin in the Soil',pages:[{t:'A coin was down in the soil.',a:'🪙'},{t:'Growlithe got it first.',m:58},{t:'Meowth sat on a brown rock.',m:52},{t:'"Would you join us?" said Swirlix.',m:684},{t:'Wooper let out a howl.',m:194},{t:'Now they hunt for coins, because that is what pals do.',a:'🌻'}],
  quiz:[{q:'What was in the soil?',a:0,o:[{e:'🪙',t:'a coin'},{e:'🦴',t:'a bone'},{e:'🌽',t:'corn'}]},{q:'Who let out a howl?',a:2,o:[{m:58,t:'Growlithe'},{m:52,t:'Meowth'},{m:194,t:'Wooper'}]}]}},
{n:13,name:'Night Peak',colour:'#4B5DA8',magicE:true,add:['igh','ear','air'],
 heart:[{w:'two',i:1,n:2},{w:'here',i:1,n:3},{w:'where',i:2,n:3},{w:'find',i:1,n:1}],
 blend:['night','light','ear','beard','hair','chair'],build:['fight','high','near','hear','fair','pair'],
 mons:[{id:21,name:'Spearow',read:true},{id:22,name:'Fearow',read:true},{id:305,name:'Lairon',read:true}],
 book:{title:'Spearow at Night',pages:[{t:'It was night on the hill.',a:'🌃'},{t:'Spearow sat on a high rock.',m:21},{t:'Lairon had a chair of stone.',m:305},{t:'"I can hear you!" said Spearow.',a:'👂'},{t:'Lairon got a fright.',a:'😲'},{t:'Then they sat in the light of the moon.',a:'🌙'}],
  quiz:[{q:'Where did Spearow sit?',a:0,o:[{e:'🪨',t:'on a high rock'},{e:'🪑',t:'on a chair'},{e:'🌊',t:'in the sea'}]},{q:'Who got a fright?',a:1,o:[{m:21,t:'Spearow'},{m:305,t:'Lairon'},{m:22,t:'Fearow'}]}]}},
{n:14,name:'Sunny Bay',colour:'#E8A33B',magicE:true,add:['ay','ou','ie','oy'],
 heart:[{w:'water',i:1,n:1},{w:'want',i:1,n:1},{w:'many',i:1,n:3},{w:'four',i:1,n:3}],
 blend:['day','play','hay','cloud','couch','pie'],build:['way','say','loud','shout','tie','boy'],
 mons:[{id:228,name:'Houndour',read:true},{id:325,name:'Spoink',read:true}],
 book:{title:'Houndour Plays',pages:[{t:'It was a hot day.',a:'🌞'},{t:'Houndour went out to play.',m:228},{t:'Spoink had a pie on a tray.',m:325},{t:'A big cloud came.',a:'☁️'},{t:'Rain! Houndour and Spoink ran to the couch.',a:'🛋️'},{t:'"We can play in here," said Spoink.',a:'🧸'}],
  quiz:[{q:'What did Spoink have?',a:0,o:[{e:'🥧',t:'a pie'},{e:'🍰',t:'a cake'},{e:'🌽',t:'corn'}]},{q:'What came in the sky?',a:1,o:[{e:'⭐',t:'a star'},{e:'☁️',t:'a cloud'},{e:'🌙',t:'the moon'}]}]}},
{n:15,name:'Blue Lagoon',colour:'#2F8FC9',magicE:true,add:['ue','aw','ew','wh','ph'],
 heart:[{w:'put',i:1,n:1},{w:'push',i:1,n:1},{w:'pull',i:1,n:1}],
 blend:['blue','saw','straw','screw','whale','phone'],build:['new','chew','draw','paw','true','whip'],
 mons:[{id:293,name:'Whismur',read:true},{id:87,name:'Dewgong',read:true},{id:624,name:'Pawniard',read:true}],
 book:{title:'Whismur and the Whale',pages:[{t:'Whismur saw a whale in the blue sea.',m:293},{t:'The whale blew a jet of spray.',a:'🐳'},{t:'Dewgong swam up to it.',m:87},{t:'"Who are you?" said the whale.',a:'🐳'},{t:'Pawniard drew a map with a claw.',m:624},{t:'Then they all had stew.',a:'🍲'}],
  quiz:[{q:'What did Whismur see?',a:0,o:[{e:'🐳',t:'a whale'},{e:'🦈',t:'a shark'},{e:'🐟',t:'a fish'}]},{q:'What did Pawniard draw?',a:2,o:[{e:'🌙',t:'the moon'},{e:'🚗',t:'a car'},{e:'🗺️',t:'a map'}]}]}},
{n:16,name:'Endings Market',colour:'#3FA06B',magicE:true,add:['ing','ed'],ends:true,
 heart:[{w:'friend',i:2,n:2},{w:'school',i:1,n:2},{w:'could',i:1,n:3}],
 blend:['cat+s','duck+s','hat+s','fish+ing','bell+s','sock+s'],build:['bug+s','ring+s','help+ed','rest+ed','kick+ed','sing+ing'],
 mons:[{id:650,name:'Chespin',read:true},{id:661,name:'Fletchling',read:true}],
 book:{title:'Fishing Day',pages:[{t:'Chespin has six friends.',m:650},{t:'They went fishing in the pond.',a:'🎣'},{t:'Fletchling looked down at the fish.',m:661},{t:'The fish jumped and splashed!',a:'🐟'},{t:'Chespin helped them get the nets.',a:'🥅'},{t:'At night, they all slept in the woods.',a:'🌃'}],
  quiz:[{q:'What did they go to do?',a:0,o:[{e:'🎣',t:'go fishing'},{e:'🚲',t:'ride bikes'},{e:'🎤',t:'sing'}]},{q:'Who looked down at the fish?',a:1,o:[{m:650,t:'Chespin'},{m:661,t:'Fletchling'},{m:228,t:'Houndour'}]}]}},
{n:17,name:'Long Word Ridge',colour:'#B05A3C',magicE:true,ends:true,add:[],
 heart:[{w:'again',i:2,n:2},{w:'any',i:0,n:3},{w:'pretty',i:2,n:4},{w:'funny',i:4,n:1},{w:'yellow',i:4,n:2}],
 blend:['sun·set','rock·et','pic·nic','rab·bit','pop·corn','pump·kin'],build:['car·pet','gar·den','rain·coat','star·fish','kit·ten','sand·pit'],
 mons:[{id:390,name:'Chimchar',read:true},{id:387,name:'Turtwig',read:true},{id:324,name:'Torkoal',read:true}],
 book:{title:'The Picnic',pages:[{t:'Turtwig and Chimchar had a picnic.',m:387},{t:'They sat on a carpet in the garden.',a:'🏡'},{t:'Torkoal got popcorn and a hotdog.',m:324},{t:'Then a rocket went up in the sunset!',a:'🚀'},{t:'"Look at that!" said Chimchar.',m:390},{t:'It was the best picnic.',a:'🧺'}],
  quiz:[{q:'What did Torkoal get?',a:0,o:[{e:'🍿',t:'popcorn'},{e:'🥧',t:'a pie'},{e:'🍰',t:'a cake'}]},{q:'What went up in the sky?',a:2,o:[{e:'🎈',t:'a balloon'},{e:'🦅',t:'a bird'},{e:'🚀',t:'a rocket'}]}]}},
{n:18,name:'Capital City',colour:'#7A4FB8',magicE:true,ends:true,caps:true,add:[],
 heart:[{w:'Mr',i:0,n:2},{w:'Mrs',i:0,n:3},{w:'please',i:4,n:2}],
 blend:['hot·dog','lap·top','tea·pot','cob·web','desk·top','kit·ten'],build:['sun·light','bath·room','foot·ball','farm·yard','down·hill','tool·box'],
 mons:[{id:399,name:'Bidoof',read:true},{id:504,name:'Patrat',read:true}],
 book:{title:'Bidoof in Town',pages:[{t:'Bidoof and Patrat went to town.',m:399},{t:'Mr Kim had a shop with red hats.',a:'🎩'},{t:'Mrs Lee had cakes and jam.',a:'🍰'},{t:'Patrat got a hat. Bidoof got a cake.',m:504},{t:'"Thank you, Mrs Lee!" said Bidoof.',a:'😀'},{t:'Then they went home.',a:'🏠'}],
  quiz:[{q:'What did Patrat get?',a:0,o:[{e:'🎩',t:'a hat'},{e:'🍰',t:'a cake'},{e:'🍯',t:'jam'}]},{q:'Who had the cakes?',a:1,o:[{e:'👨',t:'Mr Kim'},{e:'👩',t:'Mrs Lee'},{m:399,t:'Bidoof'}]}]}}
];

/* Pictures clear enough to name from sound alone (listening games). */
/* Pictures a 5-year-old names easily (ambiguous ones such as moth→🦋 or jug→🫙 left out). */
const EARS=['cap','bug','pig','bee','snail','nail','lock','cart','pin','pan','map','mop','dog','pot','cat','cup','duck','sock','sun','ten','pen','hat','hen','bed','bus','leg','bell','fan','log','bat','van','fox','box','six','web','ship','fish','chip','ring','shell','shop','bath','chick','frog','flag','drum','hand','milk','tent','nest','crab','clock','rain','tree','goat','boat','feet','sheep','coat','train','queen','moon','book','star','car','corn','fork','spoon','shark','foot','cake','bike','kite','snake','five','plate','home','bone','rose','nose','leaf','seal','cow','owl','coin','crown','bird','girl','shirt','clown'];

/* Taking a sound away: [whole word, sound removed, what is left, where]. Every word has a picture.
   (Checked by ear in American English: "bear" without /b/ is "air", not "ear", so it is left out.) */
const DELETE=[['snail','s','nail','first'],['spin','s','pin','first'],['stop','s','top','first'],['train','t','rain','first'],['brain','b','rain','first'],
 ['farm','f','arm','first'],['clock','c','lock','first'],['bread','b','red','first'],['tent','t','ten','last'],['cart','t','car','last'],['seal','l','sea','last']];

/* Rhyme families with pictures, for listening games. */
const RHYMES=[['cat','hat','bat'],['dog','log','frog'],['cake','snake','lake'],['moon','spoon'],['goat','boat','coat'],['bell','shell'],['fox','box'],['car','star'],['nose','rose'],['hen','pen','ten'],['bed','sled'],['mop','top']];

/* Dolch pre-primer and primer: the sight-word lists Singapore schools send home in P1. */
const DOLCH=['a','and','away','big','blue','can','come','down','find','for','funny','go','help','here','I','in','is','it','jump','little','look','make','me','my','not','one','play','red','run','said','see','the','three','to','two','up','we','where','yellow','you',
 'all','am','are','at','ate','be','black','brown','but','came','did','do','eat','four','get','good','have','he','into','like','must','new','no','now','on','our','out','please','pretty','ran','ride','saw','say','she','so','soon','that','there','they','this','too','under','want','was','well','went','what','white','who','will','with','yes'];

/* Letter formation, 100x140 box: ascender 14, x-height 56, baseline 112, descender 138.
   Most letters start at the top; the round family runs anticlockwise. */
const WRITE={
  a:['M 70 66 A 27 27 0 1 0 70 102','M 72 56 L 72 112'],b:['M 24 14 L 24 112','M 24 62 A 26 26 0 1 1 24 112'],
  c:['M 70 66 A 27 27 0 1 0 70 102'],d:['M 70 66 A 27 27 0 1 0 70 102','M 74 14 L 74 112'],
  e:['M 20 86 L 70 86 C 70 62 40 52 26 72 C 12 92 26 116 68 104'],f:['M 68 28 C 48 12 32 26 32 48 L 32 112','M 16 60 L 52 60'],
  g:['M 70 66 A 27 27 0 1 0 70 102','M 72 56 L 72 122 C 72 136 54 138 42 132'],h:['M 26 14 L 26 112','M 26 76 C 30 58 66 54 70 76 L 70 112'],
  i:['M 50 56 L 50 112','M 50 34 L 50 40'],j:['M 56 56 L 56 122 C 56 136 40 138 30 130','M 56 34 L 56 40'],
  k:['M 26 14 L 26 112','M 68 58 L 28 86','M 42 76 L 70 112'],l:['M 50 14 L 50 112'],
  m:['M 22 56 L 22 112','M 22 74 C 26 56 48 54 50 74 L 50 112','M 50 74 C 54 56 76 54 78 74 L 78 112'],
  n:['M 28 56 L 28 112','M 28 74 C 32 58 68 54 72 76 L 72 112'],o:['M 50 56 A 27 27 0 0 0 50 110 A 27 27 0 0 0 50 56'],
  p:['M 24 56 L 24 138','M 24 62 A 26 26 0 1 1 24 112'],q:['M 72 66 A 27 27 0 1 0 72 102','M 74 56 L 74 138'],
  r:['M 30 56 L 30 112','M 30 74 C 36 58 58 54 72 62'],s:['M 68 66 C 58 56 30 56 28 70 C 26 84 66 84 68 98 C 70 112 40 112 30 102'],
  t:['M 44 22 L 44 100 C 44 110 54 112 62 108','M 26 56 L 62 56'],u:['M 28 56 L 28 92 C 28 112 68 112 68 92 L 68 56','M 68 60 L 68 112'],
  v:['M 26 56 L 50 112 L 74 56'],w:['M 20 56 L 34 112 L 50 68 L 66 112 L 80 56'],
  x:['M 28 56 L 72 112','M 72 56 L 28 112'],y:['M 28 56 L 50 106','M 72 56 L 44 128 C 40 138 28 138 22 132'],
  z:['M 26 58 L 72 58 L 28 110 L 74 110']
};
/* Pairs children actually muddle; shape distractors come from here first. */
const CONFUSE={
  b:['d','p','q','h'],d:['b','p','q','a'],p:['q','b','d','g'],q:['p','g','b','d'],n:['u','m','h','r'],u:['n','v','w','y'],m:['w','n','h'],w:['m','v','u'],
  i:['l','j','t'],l:['i','t','j'],t:['f','l','i'],f:['t','l','r'],s:['z','c','e'],z:['s','x','n'],c:['e','o','s'],e:['c','o','a'],
  o:['c','e','a','g'],a:['e','o','c','d'],g:['q','y','p','a'],y:['g','v','x'],v:['w','y','u'],h:['n','b','k'],k:['h','x','r'],r:['n','f','k'],x:['k','y','z'],j:['i','g','y']
};
const LETTER_NAME={a:'ay',b:'bee',c:'see',d:'dee',e:'ee',f:'eff',g:'jee',h:'aitch',i:'eye',j:'jay',k:'kay',l:'ell',m:'em',n:'en',o:'oh',p:'pee',q:'cue',r:'ar',s:'ess',t:'tee',u:'you',v:'vee',w:'double you',x:'ex',y:'why',z:'zee'};
// Scene subjects make book art explicit, including expressions previously rendered as emoji.
const SCENES={'😤':'huff','😅':'mess','😋':'jam','💨':'zip','💥':'drum','👀':'child','✨':'star','😲':'face','📜':'note','🌻':'soil','🌞':'sun','🛋️':'couch','🏡':'home','🧺':'picnic','😀':'face'};
for(const r of ROUTES)for(const p of r.book.pages)if(!p.m)p.picture=SCENES[p.a]||Object.keys(ART).find(w=>ART[w]===p.a);
return {G,LONG,VOWELS,MULTI,ART,ROUTES,DOLCH,EARS,RHYMES,DELETE,WRITE,CONFUSE,LETTER_NAME};
});
