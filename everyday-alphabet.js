/* Original everyday vocabulary illustrations; names, sounds and words remain separate. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PokeEverydayAlphabet=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const WORDS=['apple','ball','cup','dog','egg','fish','gate','hat','insect','jug','kite','lamp','map','net','octopus','pen','quilt','rug','sun','tap','umbrella','van','web','box','yo-yo','zip'];
const ALL=WORDS.map((word,i)=>{const letter=String.fromCharCode(97+i);return {letter,word,g:letter==='q'?'qu':letter,image:'assets/everyday/'+letter+'-'+word+'.png',note:letter==='q'?'q + u · quilt':letter==='x'?'box · x at the end':word};});
return {ALL,get:letter=>ALL.find(x=>x.letter===letter)};
});
