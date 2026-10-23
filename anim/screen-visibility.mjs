// Full-page screens share document flow: keeping two active stacks their content.
// Menus take priority over late room renders; explicit navigation clears the old
// screen before activating its destination, so it still changes screens normally.
export function enforceSingleScreen({screens,menus,terminals=[],chrome=[]}){
  const active=screens.filter(el=>el.classList.contains('active'));
  const menu=menus.find(el=>active.includes(el));
  const winner=menu||terminals.find(el=>active.includes(el))||active.at(-1);
  for(const screen of active)if(screen!==winner)screen.classList.remove('active');
  if(menu||winner?.id==='left-screen'||winner?.id==='ended-screen'){
    for(const el of chrome)if(el.classList.contains('active'))el.classList.remove('active');
  }
  return winner||null;
}
