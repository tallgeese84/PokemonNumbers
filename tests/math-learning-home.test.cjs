const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('math lessons are distinct named home buttons, before A-Z and outside the Games carousel',()=>{
  const dom=new JSDOM(html),d=dom.window.document;
  try{
    const section=d.getElementById('homeMathLearning');
    assert.equal(section.parentElement.id,'scr-home');
    assert.equal(section.nextElementSibling.id,'everydayAlphabetBtn');
    assert.equal(d.getElementById('homeMathTitle').textContent,'Math learning');
    for(const [id,go,label] of [['homeCountBtn','count','Counting'],['homeAddBtn','add','Addition'],['homeSubBtn','sub','Subtraction']]){
      const button=d.getElementById(id);
      assert.equal(button.closest('section'),section);
      assert.equal(button.dataset.go,go);
      assert(button.classList.contains('mode'),'reuse the existing lesson handler');
      assert.equal(button.querySelector('.home-math-label').textContent,label);
      assert.equal(button.disabled,false);assert.equal(button.hidden,false);
      assert.equal(button.closest('#gameChoices, #parentPanel'),null);
      assert.equal(d.querySelectorAll('#'+id).length,1);
    }
    assert.equal(d.getElementById('homeMathWriteBtn').dataset.go,'trace');
    assert.equal(d.getElementById('homeMathPathBtn').dataset.go,'gyms');
    assert.equal(d.querySelectorAll('#gameChoices .mode').length,12,'legacy games retained');
    assert.match(html,/document\.querySelectorAll\('\.mode'\)\.forEach/);
    assert.match(fs.readFileSync(path.join(root,'visuals.js'),'utf8'),/#gameChoices \.mode/,'pagination stays scoped to Games');
    assert.match(fs.readFileSync(path.join(root,'sw.js'),'utf8'),/const CACHE = 'pokemath-v97'/,'saved media is reused');
  }finally{dom.window.close();}
});
