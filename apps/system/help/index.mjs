export function mount(host){
 const body=host.ui.make('div','window-content help-content');
 const contact=host.ui.make('p','','This is a beta service. For help or feedback, email ');
 const email=host.ui.make('a','','dflanag3@students.kennesaw.edu');
 email.href='mailto:dflanag3@students.kennesaw.edu';contact.append(email,'.');
 body.append(host.ui.make('h2','','Desktop help'),contact,host.ui.make('p','','The Linux terminal has a separate temporary guest filesystem. Changes made there are not synchronized with your account files.'));
 return {element:body,dispose(){}};
}
