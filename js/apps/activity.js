/* Activity: The Chronicle. */
(() => {
const EOS = window.EOS, {D, esc} = EOS;
EOS.register('activity', {
  render: () => `<div class="scroll" style="flex:1"><div class="tl"><h3>The Chronicle</h3><ol>${D.chron.map(c => `<li><div class="d">${esc(c.d)}</div><p>${c.b}</p></li>`).join('')}</ol></div></div>`,
});
})();
