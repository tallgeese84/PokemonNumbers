// Jonah's fox: growth comes only from learning; the shop can never put him in debt.
const {test}=require('node:test'),assert=require('node:assert/strict'),X=require('../fox-core.js');
test('milestones (tricks) grow from 1 to 9 with reading routes and Gym badges, never shrink and finish when both paths are done',()=>{
 let last=1;for(let p=0;p<=X.MAX_POINTS;p++){const t=X.tails(p);assert.ok(t>=last&&t<=9);last=t;}
 assert.equal(X.tails(0),1);assert.equal(X.tails(X.points(18,8)),9);assert.equal(X.tails(X.points(18,7)),8);
 assert.equal(X.points(30,20),X.MAX_POINTS);assert.equal(X.nextTail(X.MAX_POINTS),null);assert.deepEqual(X.nextTail(0),{at:2,need:2,tail:2});
 assert.equal(X.TRICKS.length,9);assert.equal(X.tricks(0).length,1);assert.equal(X.tricks(X.MAX_POINTS).length,9);
});
test('treats and toys spend leaves, things to wear are kept and toggled free, and nothing is bought without enough leaves',()=>{
 let s={...X.freshState(),earned:25};
 assert.equal(X.buy(s,'scarf').ok,false);assert.equal(X.buy(s,'scarf').need,95);
 let r=X.buy(s,'fish');assert.ok(r.ok);s=r.state;assert.equal(X.balance(s),5);assert.equal(s.fed,1);
 s={...s,earned:200};r=X.buy(s,'scarf');s=r.state;assert.deepEqual(s.owned,['scarf']);assert.equal(s.wearing,'scarf');
 const spent=s.spent;r=X.buy(s,'scarf');assert.ok(r.free);assert.equal(r.state.spent,spent);assert.equal(r.state.wearing,null);
});
test('fox state merges across tablets without losing leaves, purchases or seen tails',()=>{
 const a={earned:100,spent:40,owned:['bell'],wearing:'bell',tailsSeen:3,at:5},b={earned:120,spent:30,owned:['hat'],wearing:'hat',tailsSeen:2,at:9,name:'Kit'};
 const m=X.mergeState(a,b);assert.equal(m.earned,120);assert.equal(m.spent,40);assert.deepEqual(m.owned.sort(),['bell','hat']);assert.equal(m.wearing,'hat');assert.equal(m.tailsSeen,3);assert.equal(m.name,'Kit');
});
