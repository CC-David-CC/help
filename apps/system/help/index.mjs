export function mount(host){
 const body=host.ui.make('div','window-content help-content');
 body.append(host.ui.make('h2','','Desktop help'),host.ui.make('p','','Files and Text Editor save to this browser and synchronize with your signed-in account on the server. If copies conflict, Files asks which copy to keep.'),host.ui.make('p','','The Linux terminal has a separate temporary guest filesystem. Changes made there are not synchronized with your account files.'),host.ui.make('p','','Ctrl+S saves in Text Editor. Open websites in a normal browser tab.'));
 return {element:body,dispose(){}};
}
