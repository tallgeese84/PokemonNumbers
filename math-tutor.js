/* Worked reasoning derived from the same operands as the displayed model. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PokeMathTutor=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function explain(it){const s=it.show,a=it.a,b=it.b,n=it.answer;
 switch(it.kind){
 case 'teen':return 'A full ten frame is 10. There are '+s.ones+' extra. 10 plus '+s.ones+' is '+n+'.';
 case 'teenSplit':return a+' is one ten and '+n+' ones. So the missing part is '+n+'.';
 case 'blocks':return s.tens+' tens make '+(s.tens*10)+'. Add '+s.ones+' ones to make '+n+'.';
 case 'placeValue':return a+' is '+Math.floor(a/10)+' tens and '+a%10+' ones. We need '+(b===10?'tens':'ones')+', so choose '+n+'.';
 case 'compareFrames':case 'compareNums':return 'Compare the two amounts. '+(a>=10?'Look at the tens first, then the ones. ':'Match one from each group. The group with some left over has more. ')+n+' is '+(it.dir?'more.':'less.');
 case 'track':return 'Follow the same step along the path: '+s.track.map(x=>x===null?n:x).join(', ')+'. The missing number is '+n+'.';
 case 'sum':case 'vertical':{
  if(a<10&&b>0&&a+b>10)return a+' needs '+(10-a)+' to make 10. Split '+b+' into '+(10-a)+' and '+(b-(10-a))+'. 10 and '+(b-(10-a))+' make '+n+'.';
  if(a>10&&a<20&&b<0&&n<10)return 'Take '+(a-10)+' from '+a+' to reach 10. There are '+(-b-(a-10))+' more to take away. 10 take away '+(-b-(a-10))+' is '+n+'.';
  const onesA=a%10,onesB=Math.abs(b)%10,tensA=Math.floor(a/10),tensB=Math.floor(Math.abs(b)/10);
  if(b>=0){const ones=onesA+onesB,carry=Math.floor(ones/10);return 'Add the ones: '+onesA+' plus '+onesB+' is '+ones+'. '+(carry?'Exchange 10 ones for one ten. ':'')+'Now there are '+(tensA+tensB+carry)+' tens and '+ones%10+' ones. That makes '+n+'.';}
  const borrow=onesA<onesB;return (borrow?'Exchange one ten for 10 ones. Now use '+(onesA+10)+' ones. ':'Start with the ones. ')+(onesA+(borrow?10:0))+' take away '+onesB+' is '+(onesA+(borrow?10:0)-onesB)+'. '+(tensA-(borrow?1:0))+' tens take away '+tensB+' tens leaves '+Math.floor(n/10)+' tens. Altogether, '+n+'.';
 }
 case 'story':if(s.bar.compare)return 'Match the smaller amount, '+s.bar.compare[1]+', against '+s.bar.compare[0]+'. The extra part is '+n+'.';return s.bar.whole===null?'Join the two parts: '+s.bar.parts.join(' plus ')+' makes '+n+'.':'The whole is '+s.bar.whole+'. One part is '+s.bar.parts[0]+'. '+s.bar.parts[0]+' and '+n+' make the whole, so the missing part is '+n+'.';
 case 'groups':return s.groups+' equal groups, '+s.each+' in each. '+Array(s.groups).fill(s.each).join(' plus ')+' makes '+n+'.';
 case 'share':return s.plates?'Share one to each plate, and repeat until the berries are gone. Each of the '+s.plates+' plates has '+n+'.':s.n+' berries, '+s.per+' in every bowl. '+n+' equal bowls use all the berries.';
 case 'money':return 'Add the values, not the number of coins or notes. '+(s.coins||s.notes).join(' plus ')+' makes '+n+(it.unit==='¢'?' cents.':' dollars.');
 case 'clock':return 'The short hand is at or just after '+s.h+'. The long hand has moved '+s.m+' minutes from the top. The time is '+n+'.';
 case 'ruler':return 'Line up the start with zero. The end reaches '+s.len+' on the ruler. It is '+s.len+' centimetres long.';
 case 'ordinalTap':case 'ordinalName':return 'Start with the Pokémon next to the flag. Count places from first. We need place '+(Number(n)+1)+'.';
 case 'hearNumber':return n+' has '+Math.floor(n/10)+' tens and '+n%10+' ones. Look for those two digits in that order.';
 case 'numeralToQty':case 'qtyToNumeral':return 'One object for each count. The final number tells how many are in the whole group: '+n+'.';
 default:return '';
 }
}
return {explain};
});
